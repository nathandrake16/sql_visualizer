import { SCHEMA_METADATA } from '@/data/seed';
import {
  CteSpec,
  JoinClause,
  JoinType,
  ParsedQuery,
  SelectColumnSpec,
  SubquerySpec,
  VizMode,
  WindowFunctionSpec,
  WindowOrderSpec,
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

export function stripSqlComments(sql: string): string {
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

export function splitTopLevelCommas(input: string): string[] {
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

function findTopLevelKeywordIndex(
  sql: string,
  regex: RegExp,
  startFrom = 0
): { index: number; match: RegExpExecArray } | null {
  let depth = 0;
  let inSingle = false;
  let inDouble = false;

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

function parseWindowFunction(rawExpr: string): WindowFunctionSpec | null {
  const overMatch = rawExpr.match(
    /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s+OVER\s*\(([\s\S]*?)\)(?:\s+(?:AS\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?$/i
  );
  if (!overMatch) return null;

  const funcName = overMatch[1].toUpperCase();
  const rawArgs = overMatch[2].trim();
  const funcArgs = rawArgs ? splitTopLevelCommas(rawArgs) : [];
  const overBody = overMatch[3].trim();
  const alias = overMatch[4]?.trim();

  let partitionBy: string[] = [];
  const partHit = overBody.match(/\bPARTITION\s+BY\s+([\s\S]+?)(?=\bORDER\s+BY|\bROWS|\bRANGE|$)/i);
  if (partHit) {
    partitionBy = splitTopLevelCommas(partHit[1].trim()).map((s) => s.replace(/["`]/g, '').trim());
  }

  const orderBy: WindowOrderSpec[] = [];
  const orderHit = overBody.match(/\bORDER\s+BY\s+([\s\S]+?)(?=\bROWS|\bRANGE|$)/i);
  if (orderHit) {
    const rawOrderItems = splitTopLevelCommas(orderHit[1].trim());
    for (const item of rawOrderItems) {
      const match = item.match(/^([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?$/i);
      if (match) {
        orderBy.push({
          column: match[1].replace(/["`]/g, '').trim(),
          direction: match[2]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
        });
      }
    }
  }

  let frameSpec: WindowFunctionSpec['frameSpec'];
  const frameHit = overBody.match(/\b(ROWS|RANGE)\s+BETWEEN\s+([\s\S]+?)\s+AND\s+([\s\S]+?)$/i);
  if (frameHit) {
    frameSpec = {
      type: frameHit[1].toUpperCase() === 'RANGE' ? 'RANGE' : 'ROWS',
      start: frameHit[2].trim(),
      end: frameHit[3].trim(),
      raw: frameHit[0].trim(),
    };
  }

  return {
    raw: rawExpr,
    funcName,
    funcArgs,
    partitionBy,
    orderBy,
    frameSpec,
    alias,
  };
}

function parseSelectList(selectText: string): {
  selectAll: boolean;
  selectColumns: SelectColumnSpec[];
  windowFunctions: WindowFunctionSpec[];
} {
  const trimmed = selectText.trim();
  const cleanSelect = trimmed.replace(/^(DISTINCT|ALL)\s+/i, '').trim();
  const rawCols = splitTopLevelCommas(cleanSelect);
  const selectColumns: SelectColumnSpec[] = [];
  const windowFunctions: WindowFunctionSpec[] = [];
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

    const winFn = parseWindowFunction(raw);
    if (winFn) {
      windowFunctions.push(winFn);
      selectColumns.push({
        raw,
        column: winFn.alias || `${winFn.funcName}()`,
        alias: winFn.alias,
        isWildcard: false,
        isExpression: true,
        isWindowFunction: true,
      });
      continue;
    }

    let exprPart = raw;
    let alias: string | undefined;

    const asMatch = raw.match(/^([\s\S]+?)\s+AS\s+("[^"]+"|`[^`]+`|[a-zA-Z_][a-zA-Z0-9_]*)$/i);
    if (asMatch) {
      exprPart = asMatch[1].trim();
      alias = asMatch[2].replace(/^["`]|["`]$/g, '');
    } else {
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

  return { selectAll, selectColumns, windowFunctions };
}

function parseCtes(sql: string): { ctes: CteSpec[]; mainSql: string } {
  const matchWith = sql.match(/^\s*WITH\s+(RECURSIVE\s+)?/i);
  if (!matchWith) return { ctes: [], mainSql: sql };

  const isRecursive = Boolean(matchWith[1]);
  let cursor = matchWith[0].length;
  const ctes: CteSpec[] = [];

  while (cursor < sql.length) {
    const afterWith = sql.slice(cursor);
    const cteHead = afterWith.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+AS\s*\(/i);
    if (!cteHead) break;

    const cteName = cteHead[1];
    const bodyStart = cursor + cteHead[0].length;

    let depth = 1;
    let i = bodyStart;
    let inSingle = false;
    let inDouble = false;

    while (i < sql.length && depth > 0) {
      const ch = sql[i];
      if (!inDouble && ch === "'") inSingle = !inSingle;
      else if (!inSingle && ch === '"') inDouble = !inDouble;
      else if (!inSingle && !inDouble) {
        if (ch === '(') depth++;
        else if (ch === ')') depth--;
      }
      i++;
    }

    const querySql = sql.slice(bodyStart, i - 1).trim();
    ctes.push({ name: cteName, querySql, isRecursive });

    while (i < sql.length && /\s/.test(sql[i])) i++;
    if (sql[i] === ',') {
      cursor = i + 1;
    } else {
      cursor = i;
      break;
    }
  }

  const mainSql = sql.slice(cursor).trim();
  return { ctes, mainSql };
}

function parseSubqueries(
  whereClause: string | null,
  fromTable: string | null,
  fromAlias: string | null
): SubquerySpec[] {
  if (!whereClause) return [];
  const subqueries: SubquerySpec[] = [];

  const existsMatch = whereClause.match(/\b(NOT\s+EXISTS|EXISTS)\s*\((SELECT[\s\S]+?)\)/i);
  if (existsMatch) {
    const isCorrelated = Boolean(
      (fromAlias && new RegExp(`\\b${fromAlias}\\.`, 'i').test(existsMatch[2])) ||
      (fromTable && new RegExp(`\\b${fromTable}\\.`, 'i').test(existsMatch[2]))
    );
    subqueries.push({
      type: 'WHERE_EXISTS',
      operator: existsMatch[1].toUpperCase(),
      subquerySql: existsMatch[2].trim(),
      isCorrelated,
      rawClause: existsMatch[0],
    });
  }

  const inMatch = whereClause.match(/\b([a-zA-Z0-9_.]+)\s+(NOT\s+IN|IN)\s*\((SELECT[\s\S]+?)\)/i);
  if (inMatch) {
    const isCorrelated = Boolean(
      (fromAlias && new RegExp(`\\b${fromAlias}\\.`, 'i').test(inMatch[3])) ||
      (fromTable && new RegExp(`\\b${fromTable}\\.`, 'i').test(inMatch[3]))
    );
    subqueries.push({
      type: 'WHERE_IN',
      outerColumn: inMatch[1].trim(),
      operator: inMatch[2].toUpperCase(),
      subquerySql: inMatch[3].trim(),
      isCorrelated,
      rawClause: inMatch[0],
    });
  }

  const compMatch = whereClause.match(
    /\b([a-zA-Z0-9_.]+)\s*(=|>|<|>=|<=|!=)\s*\((SELECT[\s\S]+?)\)/i
  );
  if (compMatch) {
    const isCorrelated = Boolean(
      (fromAlias && new RegExp(`\\b${fromAlias}\\.`, 'i').test(compMatch[3])) ||
      (fromTable && new RegExp(`\\b${fromTable}\\.`, 'i').test(compMatch[3]))
    );
    subqueries.push({
      type: 'WHERE_SCALAR',
      outerColumn: compMatch[1].trim(),
      operator: compMatch[2].trim(),
      subquerySql: compMatch[3].trim(),
      isCorrelated,
      rawClause: compMatch[0],
    });
  }

  return subqueries;
}

export function parseSqlForVisualization(rawInput: string): ParsedQuery {
  const cleaned = stripSqlComments(rawInput).trim().replace(/;+\s*$/, '').trim();

  // 1. Detect and separate CTEs
  const { ctes, mainSql } = parseCtes(cleaned);
  const targetSql = mainSql || cleaned;
  const normalizedSpace = targetSql.replace(/\s+/g, ' ').trim();

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
      windowFunctions: [],
      ctes,
      subqueries: [],
      vizMode: 'single',
      supportedForViz: false,
      vizUnsupportedReason:
        'Step-by-step visualization supports SELECT queries. Non-SELECT statements still execute in SQLite.',
    };
  }

  const fromHit = findTopLevelKeywordIndex(targetSql, /\bFROM\b/i, 6);
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
      windowFunctions: [],
      ctes,
      subqueries: [],
      vizMode: 'single',
      supportedForViz: false,
      vizUnsupportedReason: 'Add a FROM clause to visualize table operations.',
    };
  }

  const selectText = targetSql.slice(6, fromHit.index).trim();
  const { selectAll, selectColumns, windowFunctions } = parseSelectList(selectText);

  const afterFrom = targetSql.slice(fromHit.index + fromHit.match[0].length).trim();
  const boundaryRegex =
    /\b(INNER\s+JOIN|LEFT\s+(?:OUTER\s+)?JOIN|RIGHT\s+(?:OUTER\s+)?JOIN|FULL\s+(?:OUTER\s+)?JOIN|CROSS\s+JOIN|JOIN|WHERE|GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b/i;

  const firstBoundary = findTopLevelKeywordIndex(afterFrom, boundaryRegex, 0);
  const fromPart = (firstBoundary ? afterFrom.slice(0, firstBoundary.index) : afterFrom).trim();

  const fromTokens = fromPart.replace(/\s+AS\s+/i, ' ').trim().split(/\s+/);
  const fromTable = fromTokens[0]?.replace(/["`]/g, '') || null;
  const fromAlias =
    fromTokens[1] && !SQL_KEYWORDS.has(fromTokens[1].toUpperCase())
      ? fromTokens[1].replace(/["`]/g, '')
      : fromTable;

  let joinClause: JoinClause | null = null;
  let whereClause: string | null = null;
  let groupByClause: string | null = null;
  let havingClause: string | null = null;
  let orderByClause: string | null = null;
  let limitClause: string | null = null;

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
      let joinType: JoinType = 'INNER';
      if (kw.startsWith('LEFT')) joinType = 'LEFT';
      else if (kw.startsWith('RIGHT')) joinType = 'RIGHT';
      else if (kw.startsWith('CROSS')) joinType = 'CROSS';

      const onMatch = content.match(/^([\s\S]+?)\s+\bON\b\s+([\s\S]+)$/i);
      const targetPart = (onMatch ? onMatch[1] : content).replace(/\s+AS\s+/i, ' ').trim();
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
        if (eqMatch) {
          const p1 = eqMatch[1].split('.').pop() || '';
          const p2 = eqMatch[2].split('.').pop() || '';
          leftColumn = p1;
          rightColumn = p2;
        }
      }

      joinClause = {
        type: joinType,
        leftTable: fromTable || '',
        leftAlias: fromAlias || fromTable || '',
        rightTable,
        rightAlias,
        leftColumn,
        rightColumn,
        rawOn,
      };
    } else if (kw === 'WHERE') {
      whereClause = content;
    } else if (kw === 'GROUP BY') {
      groupByClause = content;
    } else if (kw === 'HAVING') {
      havingClause = content;
    } else if (kw === 'ORDER BY') {
      orderByClause = content;
    } else if (kw === 'LIMIT') {
      limitClause = content;
    }

    cursor = contentEnd;
  }

  const subqueries = parseSubqueries(whereClause, fromTable, fromAlias);

  // Determine Primary Viz Mode
  let vizMode: VizMode = 'single';
  if (ctes.length > 0) {
    vizMode = 'cte';
  } else if (windowFunctions.length > 0) {
    vizMode = 'window';
  } else if (subqueries.length > 0) {
    vizMode = 'subquery';
  } else if (joinClause) {
    vizMode = 'join';
  }

  const knownTables = new Set(SCHEMA_METADATA.map((t) => t.name.toLowerCase()));
  for (const c of ctes) {
    knownTables.add(c.name.toLowerCase());
  }

  const isCustomTable = fromTable && !knownTables.has(fromTable.toLowerCase());

  return {
    isSelect: true,
    rawSql: rawInput,
    selectAll,
    selectColumns,
    fromTable,
    fromAlias,
    join: joinClause,
    whereClause,
    groupByClause,
    havingClause,
    orderByClause,
    limitClause,
    windowFunctions,
    ctes,
    subqueries,
    vizMode,
    supportedForViz: !isCustomTable,
    vizUnsupportedReason: isCustomTable
      ? `Table "${fromTable}" is not in the active schemas.`
      : undefined,
  };
}
