import { SCHEMA_METADATA } from '@/data/seed';
import {
  JoinClause,
  JoinType,
  ParsedQuery,
  SelectColumnSpec,
} from '@/types/sql';

const SQL_KEYWORDS = new Set([
  'WHERE',
  'INNER',
  'LEFT',
  'RIGHT',
  'FULL',
  'CROSS',
  'OUTER',
  'JOIN',
  'ON',
  'GROUP',
  'HAVING',
  'ORDER',
  'LIMIT',
  'OFFSET',
  'UNION',
]);

function stripSqlComments(sql: string): string {
  // Remove -- line comments and /* block comments */ while preserving string literals
  let out = '';
  let i = 0;
  let inSingle = false;
  let inDouble = false;

  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (!inDouble && ch === "'" && sql[i - 1] !== '\\') {
      inSingle = !inSingle;
      out += ch;
      i++;
      continue;
    }
    if (!inSingle && ch === '"' && sql[i - 1] !== '\\') {
      inDouble = !inDouble;
      out += ch;
      i++;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === '-' && next === '-') {
        while (i < sql.length && sql[i] !== '\n') i++;
        out += ' ';
        continue;
      }
      if (ch === '/' && next === '*') {
        i += 2;
        while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
        i += 2;
        out += ' ';
        continue;
      }
    }

    out += ch;
    i++;
  }

  return out;
}

function splitTopLevelCommas(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      current += ch;
      continue;
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      current += ch;
      continue;
    }
    if (!inSingle && !inDouble) {
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      else if (ch === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }
    }
    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function parseSelectList(selectText: string): {
  selectAll: boolean;
  selectColumns: SelectColumnSpec[];
} {
  const trimmed = selectText.trim();
  const cleanSelect = trimmed.replace(/^(DISTINCT|ALL)\s+/i, '').trim();
  const rawCols = splitTopLevelCommas(cleanSelect);
  const selectColumns: SelectColumnSpec[] = [];
  let selectAll = false;

  for (const rawItem of rawCols) {
    const raw = rawItem.trim();
    if (raw === '*') {
      selectAll = true;
      selectColumns.push({
        raw,
        column: '*',
        isWildcard: true,
        isExpression: false,
      });
      continue;
    }

    // Match optional AS alias or trailing identifier alias
    let exprPart = raw;
    let alias: string | undefined;

    const asMatch = raw.match(/^([\s\S]+?)\s+AS\s+("[^"]+"|`[^`]+`|[a-zA-Z_][a-zA-Z0-9_]*)$/i);
    if (asMatch) {
      exprPart = asMatch[1].trim();
      alias = asMatch[2].replace(/^["`]|["`]$/g, '');
    } else {
      // Check space-separated alias (only if no trailing operator)
      const implicitAliasMatch = raw.match(
        /^([a-zA-Z_][a-zA-Z0-9_.*]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)$/
      );
      if (
        implicitAliasMatch &&
        !SQL_KEYWORDS.has(implicitAliasMatch[2].toUpperCase())
      ) {
        exprPart = implicitAliasMatch[1].trim();
        alias = implicitAliasMatch[2].trim();
      }
    }

    const tableWildcard = exprPart.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\.\*$/);
    if (tableWildcard) {
      selectColumns.push({
        raw,
        tableOrAlias: tableWildcard[1],
        column: '*',
        alias,
        isWildcard: true,
        isExpression: false,
      });
      continue;
    }

    const qualifiedCol = exprPart.match(
      /^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/
    );
    if (qualifiedCol) {
      selectColumns.push({
        raw,
        tableOrAlias: qualifiedCol[1],
        column: qualifiedCol[2],
        alias,
        isWildcard: false,
        isExpression: false,
      });
      continue;
    }

    const bareCol = exprPart.match(/^([a-zA-Z_][a-zA-Z0-9_]*)$/);
    if (bareCol) {
      selectColumns.push({
        raw,
        column: bareCol[1],
        alias,
        isWildcard: false,
        isExpression: false,
      });
      continue;
    }

    selectColumns.push({
      raw,
      column: alias || exprPart,
      alias,
      isWildcard: false,
      isExpression: true,
    });
  }

  return { selectAll, selectColumns };
}

function findTopLevelKeywordIndex(
  sql: string,
  regex: RegExp,
  startFrom = 0
): { index: number; match: RegExpExecArray } | null {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

  // Build masked string where quoted strings and parenthesized groups become spaces
  const chars = sql.split('');
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      chars[i] = ' ';
      continue;
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      chars[i] = ' ';
      continue;
    }
    if (inSingle || inDouble) {
      chars[i] = ' ';
      continue;
    }
    if (ch === '(') {
      depth++;
      chars[i] = ' ';
      continue;
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      chars[i] = ' ';
      continue;
    }
    if (depth > 0) {
      chars[i] = ' ';
    }
  }

  const masked = chars.join('');
  const globalRegex = new RegExp(
    regex.source,
    regex.flags.includes('g') ? regex.flags : `${regex.flags}g`
  );
  globalRegex.lastIndex = startFrom;
  const match = globalRegex.exec(masked);
  if (!match) return null;
  return { index: match.index, match };
}

function resolveTableAndColumn(
  token: string,
  leftTable: string,
  leftAlias: string,
  rightTable: string,
  rightAlias: string
): { side: 'left' | 'right' | 'unknown'; column: string } {
  const parts = token.trim().replace(/["`]/g, '').split('.');
  if (parts.length === 2) {
    const [prefix, col] = parts;
    const pLower = prefix.toLowerCase();
    if (
      pLower === leftAlias.toLowerCase() ||
      pLower === leftTable.toLowerCase()
    ) {
      return { side: 'left', column: col };
    }
    if (
      pLower === rightAlias.toLowerCase() ||
      pLower === rightTable.toLowerCase()
    ) {
      return { side: 'right', column: col };
    }
    return { side: 'unknown', column: col };
  }

  // Unqualified column name — infer via schema metadata if unique
  const col = parts[0];
  const leftSchema = SCHEMA_METADATA.find(
    (t) => t.name.toLowerCase() === leftTable.toLowerCase()
  );
  const rightSchema = SCHEMA_METADATA.find(
    (t) => t.name.toLowerCase() === rightTable.toLowerCase()
  );
  const inLeft = leftSchema?.columns.some(
    (c) => c.name.toLowerCase() === col.toLowerCase()
  );
  const inRight = rightSchema?.columns.some(
    (c) => c.name.toLowerCase() === col.toLowerCase()
  );

  if (inLeft && !inRight) return { side: 'left', column: col };
  if (inRight && !inLeft) return { side: 'right', column: col };
  return { side: 'unknown', column: col };
}

export function parseSqlForVisualization(rawInput: string): ParsedQuery {
  const cleaned = stripSqlComments(rawInput).trim().replace(/;+\s*$/, '').trim();
  const normalizedSpace = cleaned.replace(/\s+/g, ' ').trim();

  if (!/^SELECT\b/i.test(normalizedSpace)) {
    return {
      isSelect: false,
      rawSql: rawInput,
      selectAll: false,
      selectColumns: [],
      fromTable: null,
      fromAlias: null,
      join: null,
      whereClause: null,
      orderByClause: null,
      limitClause: null,
      supportedForViz: false,
      vizUnsupportedReason:
        'Step-by-step visualization supports SELECT queries. Non-SELECT statements still execute in SQLite.',
    };
  }

  const fromHit = findTopLevelKeywordIndex(cleaned, /\bFROM\b/i, 6);
  if (!fromHit) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll: false,
      selectColumns: [],
      fromTable: null,
      fromAlias: null,
      join: null,
      whereClause: null,
      orderByClause: null,
      limitClause: null,
      supportedForViz: false,
      vizUnsupportedReason: 'Add a FROM clause to visualize table operations.',
    };
  }

  const selectText = cleaned.slice(6, fromHit.index).trim();
  const { selectAll, selectColumns } = parseSelectList(selectText);

  const afterFrom = cleaned.slice(fromHit.index + fromHit.match[0].length).trim();

  // Locate optional JOIN, WHERE, GROUP BY, ORDER BY, LIMIT boundaries in afterFrom
  const boundaryRegex =
    /\b(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i;

  const firstBoundary = findTopLevelKeywordIndex(afterFrom, boundaryRegex, 0);
  const fromPart = (firstBoundary
    ? afterFrom.slice(0, firstBoundary.index)
    : afterFrom
  ).trim();

  // Check for comma-separated implicit cross join
  if (fromPart.includes(',')) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll,
      selectColumns,
      fromTable: null,
      fromAlias: null,
      join: null,
      whereClause: null,
      orderByClause: null,
      limitClause: null,
      supportedForViz: false,
      vizUnsupportedReason:
        'Use explicit JOIN syntax (e.g. INNER JOIN or LEFT JOIN) to visualize table joins.',
    };
  }

  const fromTokens = fromPart.replace(/\s+AS\s+/i, ' ').trim().split(/\s+/);
  const fromTable = fromTokens[0]?.replace(/["`]/g, '') || null;
  const fromAlias =
    fromTokens[1] && !SQL_KEYWORDS.has(fromTokens[1].toUpperCase())
      ? fromTokens[1].replace(/["`]/g, '')
      : fromTable;

  if (!fromTable) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll,
      selectColumns,
      fromTable: null,
      fromAlias: null,
      join: null,
      whereClause: null,
      orderByClause: null,
      limitClause: null,
      supportedForViz: false,
      vizUnsupportedReason: 'Could not identify the source table in FROM.',
    };
  }

  let joinClause: JoinClause | null = null;
  let whereClause: string | null = null;
  let orderByClause: string | null = null;
  let limitClause: string | null = null;
  let hasGroupBy = false;
  let hasMultipleJoins = false;

  // Scan sequential clauses inside afterFrom
  let cursor = firstBoundary ? firstBoundary.index : afterFrom.length;
  while (cursor < afterFrom.length) {
    const currentHit = findTopLevelKeywordIndex(afterFrom, boundaryRegex, cursor);
    if (!currentHit) break;

    const kw = currentHit.match[1].replace(/\s+/g, ' ').toUpperCase();
    const contentStart = currentHit.index + currentHit.match[0].length;
    const nextHit = findTopLevelKeywordIndex(afterFrom, boundaryRegex, contentStart);
    const contentEnd = nextHit ? nextHit.index : afterFrom.length;
    const content = afterFrom.slice(contentStart, contentEnd).trim();

    if (kw.includes('JOIN')) {
      if (joinClause) {
        hasMultipleJoins = true;
      } else {
        let joinType: JoinType = 'INNER';
        if (kw.startsWith('LEFT')) joinType = 'LEFT';
        else if (kw.startsWith('RIGHT')) joinType = 'RIGHT';
        else if (kw.startsWith('CROSS')) joinType = 'CROSS';
        else if (kw.startsWith('FULL')) {
          return {
            isSelect: true,
            rawSql: rawInput,
            selectAll,
            selectColumns,
            fromTable,
            fromAlias,
            join: null,
            whereClause: null,
            orderByClause: null,
            limitClause: null,
            supportedForViz: false,
            vizUnsupportedReason:
              'Visualizer currently focuses on INNER JOIN, LEFT JOIN, RIGHT JOIN, and CROSS JOIN.',
          };
        }

        const onMatch = content.match(/^([\s\S]+?)\s+\bON\b\s+([\s\S]+)$/i);
        const targetPart = (onMatch ? onMatch[1] : content)
          .replace(/\s+AS\s+/i, ' ')
          .trim();
        const rightTokens = targetPart.split(/\s+/);
        const rightTable = rightTokens[0]?.replace(/["`]/g, '') || '';
        const rightAlias =
          rightTokens[1] && !SQL_KEYWORDS.has(rightTokens[1].toUpperCase())
            ? rightTokens[1].replace(/["`]/g, '')
            : rightTable;
        const rawOn = onMatch ? onMatch[2].trim() : '';

        let leftColumn = '';
        let rightColumn = '';

        if (rawOn) {
          const eqMatch = rawOn.match(
            /^([a-zA-Z_][a-zA-Z0-9_.]*)\s*=\s*([a-zA-Z_][a-zA-Z0-9_.]*)$/
          );
          if (eqMatch && fromAlias) {
            const sideA = resolveTableAndColumn(
              eqMatch[1],
              fromTable,
              fromAlias,
              rightTable,
              rightAlias
            );
            const sideB = resolveTableAndColumn(
              eqMatch[2],
              fromTable,
              fromAlias,
              rightTable,
              rightAlias
            );

            if (sideA.side === 'left' && sideB.side === 'right') {
              leftColumn = sideA.column;
              rightColumn = sideB.column;
            } else if (sideA.side === 'right' && sideB.side === 'left') {
              leftColumn = sideB.column;
              rightColumn = sideA.column;
            } else {
              leftColumn = sideA.column;
              rightColumn = sideB.column;
            }
          }
        }

        joinClause = {
          type: joinType,
          leftTable: fromTable,
          leftAlias: fromAlias || fromTable,
          rightTable,
          rightAlias,
          leftColumn,
          rightColumn,
          rawOn,
        };
      }
    } else if (kw === 'WHERE') {
      whereClause = content;
    } else if (kw === 'GROUP BY') {
      hasGroupBy = true;
    } else if (kw === 'ORDER BY') {
      orderByClause = content;
    } else if (kw === 'LIMIT') {
      limitClause = content;
    }

    cursor = contentEnd;
  }

  if (hasMultipleJoins) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll,
      selectColumns,
      fromTable,
      fromAlias,
      join: joinClause,
      whereClause,
      orderByClause,
      limitClause,
      supportedForViz: false,
      vizUnsupportedReason:
        'Side-by-side join animation visualizes 2-table joins; the query still executed cleanly in SQLite.',
    };
  }

  if (hasGroupBy) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll,
      selectColumns,
      fromTable,
      fromAlias,
      join: joinClause,
      whereClause,
      orderByClause,
      limitClause,
      supportedForViz: false,
      vizUnsupportedReason:
        'Aggregated GROUP BY results are shown in the Results Grid below; row-level animation applies to non-grouped queries.',
    };
  }

  const knownTables = new Set(SCHEMA_METADATA.map((t) => t.name.toLowerCase()));
  if (!knownTables.has(fromTable.toLowerCase())) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll,
      selectColumns,
      fromTable,
      fromAlias,
      join: joinClause,
      whereClause,
      orderByClause,
      limitClause,
      supportedForViz: false,
      vizUnsupportedReason: `Table "${fromTable}" is a custom or system table; step visualization works on "users" and "departments".`,
    };
  }

  if (joinClause && !knownTables.has(joinClause.rightTable.toLowerCase())) {
    return {
      isSelect: true,
      rawSql: rawInput,
      selectAll,
      selectColumns,
      fromTable,
      fromAlias,
      join: joinClause,
      whereClause,
      orderByClause,
      limitClause,
      supportedForViz: false,
      vizUnsupportedReason: `Joined table "${joinClause.rightTable}" is not in the core schema.`,
    };
  }

  return {
    isSelect: true,
    rawSql: rawInput,
    selectAll,
    selectColumns,
    fromTable,
    fromAlias,
    join: joinClause,
    whereClause,
    orderByClause,
    limitClause,
    supportedForViz: true,
  };
}
