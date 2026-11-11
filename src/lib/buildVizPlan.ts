import type { Database } from 'sql.js';
import { SCHEMA_METADATA } from '@/data/seed';
import { ParsedQuery, SqlRow, SqlValue } from '@/types/sql';

export interface VizSourceRow {
  rid: number;
  data: SqlRow;
  joinKeyVal: SqlValue;
  hasPartner: boolean;
  keptByJoin: boolean;
  keptByWhere: boolean;
  colorIndex: number | null;
}

export interface VizJoinEdge {
  id: string;
  leftRid: number;
  rightRid: number;
  keyVal: SqlValue;
  colorIndex: number;
}

export interface VizMergedRow {
  id: string;
  leftRow: VizSourceRow | null;
  rightRow: VizSourceRow | null;
  isNullPaddedLeft: boolean;
  isNullPaddedRight: boolean;
  keptByWhere: boolean;
  colorIndex: number | null;
}

export interface VizColumnMeta {
  name: string;
  selected: boolean;
  isJoinKey: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
}

export interface VizSnapshot {
  supported: boolean;
  unsupportedReason?: string;
  parsed: ParsedQuery;
  mode: 'single' | 'join';
  leftTableName: string;
  leftAlias: string;
  leftColumns: VizColumnMeta[];
  leftRows: VizSourceRow[];
  rightTableName: string | null;
  rightAlias: string | null;
  rightColumns: VizColumnMeta[];
  rightRows: VizSourceRow[];
  edges: VizJoinEdge[];
  mergedRows: VizMergedRow[];
  hasWhere: boolean;
}

function normalizeColName(name: string): string {
  return name.trim().toLowerCase();
}

function getColumnsForTable(tableName: string): string[] {
  const schema = SCHEMA_METADATA.find(
    (t) => t.name.toLowerCase() === tableName.toLowerCase()
  );
  return schema ? schema.columns.map((c) => c.name) : [];
}

function isColumnSelected(
  parsed: ParsedQuery,
  tableName: string,
  tableAlias: string,
  colName: string,
  otherTableCols: string[]
): boolean {
  if (parsed.selectAll) return true;

  const tLower = tableName.toLowerCase();
  const aLower = tableAlias.toLowerCase();
  const cLower = colName.toLowerCase();

  for (const spec of parsed.selectColumns) {
    if (spec.isWildcard) {
      if (!spec.tableOrAlias) return true;
      const pLower = spec.tableOrAlias.toLowerCase();
      if (pLower === aLower || pLower === tLower) return true;
      continue;
    }

    if (spec.isExpression) {
      // Check if expression mentions tableAlias.colName or unique colName
      const qualifiedRegex = new RegExp(`\\b(?:${aLower}|${tLower})\\.${cLower}\\b`, 'i');
      if (qualifiedRegex.test(spec.raw)) return true;
      const bareRegex = new RegExp(`\\b${cLower}\\b`, 'i');
      if (
        bareRegex.test(spec.raw) &&
        !otherTableCols.some((oc) => oc.toLowerCase() === cLower)
      ) {
        return true;
      }
      continue;
    }

    if (spec.tableOrAlias) {
      const pLower = spec.tableOrAlias.toLowerCase();
      if (
        (pLower === aLower || pLower === tLower) &&
        spec.column.toLowerCase() === cLower
      ) {
        return true;
      }
    } else if (spec.column.toLowerCase() === cLower) {
      return true;
    }
  }

  return false;
}

function buildColumnMeta(
  tableName: string,
  tableAlias: string,
  parsed: ParsedQuery,
  joinKeyCol: string | null,
  otherTableCols: string[]
): VizColumnMeta[] {
  const schema = SCHEMA_METADATA.find(
    (t) => t.name.toLowerCase() === tableName.toLowerCase()
  );
  if (!schema) return [];

  return schema.columns.map((col) => ({
    name: col.name,
    selected: isColumnSelected(parsed, tableName, tableAlias, col.name, otherTableCols),
    isJoinKey:
      joinKeyCol !== null &&
      normalizeColName(col.name) === normalizeColName(joinKeyCol),
    isPrimaryKey: Boolean(col.isPrimaryKey),
    isForeignKey: Boolean(col.foreignKey),
  }));
}

function fetchTableRows(db: Database, tableName: string): Array<{ rid: number; data: SqlRow }> {
  const res = db.exec(`SELECT rowid AS __rid, * FROM "${tableName}"`);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map((rowVals) => {
    const rid = Number(rowVals[0]);
    const data: SqlRow = {};
    for (let i = 1; i < columns.length; i++) {
      data[columns[i]] = rowVals[i];
    }
    return { rid, data };
  });
}

export function buildVisualizationSnapshot(
  db: Database,
  parsed: ParsedQuery
): VizSnapshot {
  if (!parsed.supportedForViz || !parsed.fromTable) {
    return {
      supported: false,
      unsupportedReason: parsed.vizUnsupportedReason,
      parsed,
      mode: 'single',
      leftTableName: 'users',
      leftAlias: 'users',
      leftColumns: [],
      leftRows: [],
      rightTableName: null,
      rightAlias: null,
      rightColumns: [],
      rightRows: [],
      edges: [],
      mergedRows: [],
      hasWhere: Boolean(parsed.whereClause),
    };
  }

  const leftTableName = parsed.fromTable;
  const leftAlias = parsed.fromAlias || leftTableName;
  const rawLeftRows = fetchTableRows(db, leftTableName);

  // Single-table query (FROM + optional WHERE + SELECT)
  if (!parsed.join) {
    let keptRids: Set<number> | null = null;
    if (parsed.whereClause) {
      try {
        const aliasPart = leftAlias !== leftTableName ? `AS "${leftAlias}"` : '';
        const whereSql = `SELECT "${leftAlias}".rowid AS __rid FROM "${leftTableName}" ${aliasPart} WHERE ${parsed.whereClause}`;
        const whereRes = db.exec(whereSql);
        keptRids = new Set<number>(
          whereRes.length ? whereRes[0].values.map((v) => Number(v[0])) : []
        );
      } catch {
        keptRids = null;
      }
    }

    const leftRows: VizSourceRow[] = rawLeftRows.map(({ rid, data }) => ({
      rid,
      data,
      joinKeyVal: null,
      hasPartner: true,
      keptByJoin: true,
      keptByWhere: keptRids ? keptRids.has(rid) : true,
      colorIndex: null,
    }));

    return {
      supported: true,
      parsed,
      mode: 'single',
      leftTableName,
      leftAlias,
      leftColumns: buildColumnMeta(leftTableName, leftAlias, parsed, null, []),
      leftRows,
      rightTableName: null,
      rightAlias: null,
      rightColumns: [],
      rightRows: [],
      edges: [],
      mergedRows: [],
      hasWhere: Boolean(parsed.whereClause),
    };
  }

  // Two-table JOIN query
  const join = parsed.join;
  const rightTableName = join.rightTable;
  const rightAlias = join.rightAlias;
  const rawRightRows = fetchTableRows(db, rightTableName);

  const leftColNames = getColumnsForTable(leftTableName);
  const rightColNames = getColumnsForTable(rightTableName);

  const actualLeftKey =
    leftColNames.find((c) => c.toLowerCase() === join.leftColumn.toLowerCase()) ||
    join.leftColumn;
  const actualRightKey =
    rightColNames.find((c) => c.toLowerCase() === join.rightColumn.toLowerCase()) ||
    join.rightColumn;

  // Assign deterministic palette index per unique non-null join key value
  const keyColorMap = new Map<string, number>();
  let nextColorIdx = 0;

  const getKeyColor = (val: SqlValue): number | null => {
    if (val === null || val === undefined) return null;
    const k = String(val);
    if (!keyColorMap.has(k)) {
      keyColorMap.set(k, nextColorIdx++);
    }
    return keyColorMap.get(k)!;
  };

  // Pre-seed colors from right table (or primary key side) so department 1..4 get consistent colors
  for (const r of rawRightRows) {
    getKeyColor(r.data[actualRightKey] ?? null);
  }
  for (const l of rawLeftRows) {
    getKeyColor(l.data[actualLeftKey] ?? null);
  }

  const leftRows: VizSourceRow[] = rawLeftRows.map(({ rid, data }) => {
    const val = actualLeftKey ? (data[actualLeftKey] ?? null) : null;
    return {
      rid,
      data,
      joinKeyVal: val,
      hasPartner: false,
      keptByJoin: false,
      keptByWhere: false,
      colorIndex: getKeyColor(val),
    };
  });

  const rightRows: VizSourceRow[] = rawRightRows.map(({ rid, data }) => {
    const val = actualRightKey ? (data[actualRightKey] ?? null) : null;
    return {
      rid,
      data,
      joinKeyVal: val,
      hasPartner: false,
      keptByJoin: false,
      keptByWhere: false,
      colorIndex: getKeyColor(val),
    };
  });

  const edges: VizJoinEdge[] = [];
  const mergedRows: VizMergedRow[] = [];

  if (join.type === 'CROSS') {
    for (const l of leftRows) {
      l.hasPartner = rightRows.length > 0;
      l.keptByJoin = rightRows.length > 0;
      for (const r of rightRows) {
        r.hasPartner = true;
        r.keptByJoin = true;
        edges.push({
          id: `${l.rid}-${r.rid}`,
          leftRid: l.rid,
          rightRid: r.rid,
          keyVal: null,
          colorIndex: 0,
        });
        mergedRows.push({
          id: `${l.rid}-${r.rid}`,
          leftRow: l,
          rightRow: r,
          isNullPaddedLeft: false,
          isNullPaddedRight: false,
          keptByWhere: true,
          colorIndex: 0,
        });
      }
    }
  } else if (join.type === 'INNER') {
    for (const l of leftRows) {
      if (l.joinKeyVal === null || l.joinKeyVal === undefined) continue;
      const matches = rightRows.filter(
        (r) =>
          r.joinKeyVal !== null &&
          r.joinKeyVal !== undefined &&
          r.joinKeyVal === l.joinKeyVal
      );
      if (matches.length > 0) {
        l.hasPartner = true;
        l.keptByJoin = true;
        for (const r of matches) {
          r.hasPartner = true;
          r.keptByJoin = true;
          const colorIdx = l.colorIndex ?? r.colorIndex ?? 0;
          edges.push({
            id: `${l.rid}-${r.rid}`,
            leftRid: l.rid,
            rightRid: r.rid,
            keyVal: l.joinKeyVal,
            colorIndex: colorIdx,
          });
          mergedRows.push({
            id: `${l.rid}-${r.rid}`,
            leftRow: l,
            rightRow: r,
            isNullPaddedLeft: false,
            isNullPaddedRight: false,
            keptByWhere: true,
            colorIndex: colorIdx,
          });
        }
      }
    }
  } else if (join.type === 'LEFT') {
    for (const l of leftRows) {
      l.keptByJoin = true;
      const matches =
        l.joinKeyVal !== null && l.joinKeyVal !== undefined
          ? rightRows.filter(
              (r) =>
                r.joinKeyVal !== null &&
                r.joinKeyVal !== undefined &&
                r.joinKeyVal === l.joinKeyVal
            )
          : [];

      if (matches.length > 0) {
        l.hasPartner = true;
        for (const r of matches) {
          r.hasPartner = true;
          r.keptByJoin = true;
          const colorIdx = l.colorIndex ?? r.colorIndex ?? 0;
          edges.push({
            id: `${l.rid}-${r.rid}`,
            leftRid: l.rid,
            rightRid: r.rid,
            keyVal: l.joinKeyVal,
            colorIndex: colorIdx,
          });
          mergedRows.push({
            id: `${l.rid}-${r.rid}`,
            leftRow: l,
            rightRow: r,
            isNullPaddedLeft: false,
            isNullPaddedRight: false,
            keptByWhere: true,
            colorIndex: colorIdx,
          });
        }
      } else {
        l.hasPartner = false;
        mergedRows.push({
          id: `${l.rid}-null`,
          leftRow: l,
          rightRow: null,
          isNullPaddedLeft: false,
          isNullPaddedRight: true,
          keptByWhere: true,
          colorIndex: null,
        });
      }
    }
  } else if (join.type === 'RIGHT') {
    for (const r of rightRows) {
      r.keptByJoin = true;
      const matches =
        r.joinKeyVal !== null && r.joinKeyVal !== undefined
          ? leftRows.filter(
              (l) =>
                l.joinKeyVal !== null &&
                l.joinKeyVal !== undefined &&
                l.joinKeyVal === r.joinKeyVal
            )
          : [];

      if (matches.length > 0) {
        r.hasPartner = true;
        for (const l of matches) {
          l.hasPartner = true;
          l.keptByJoin = true;
          const colorIdx = r.colorIndex ?? l.colorIndex ?? 0;
          edges.push({
            id: `${l.rid}-${r.rid}`,
            leftRid: l.rid,
            rightRid: r.rid,
            keyVal: r.joinKeyVal,
            colorIndex: colorIdx,
          });
          mergedRows.push({
            id: `${l.rid}-${r.rid}`,
            leftRow: l,
            rightRow: r,
            isNullPaddedLeft: false,
            isNullPaddedRight: false,
            keptByWhere: true,
            colorIndex: colorIdx,
          });
        }
      } else {
        r.hasPartner = false;
        mergedRows.push({
          id: `null-${r.rid}`,
          leftRow: null,
          rightRow: r,
          isNullPaddedLeft: true,
          isNullPaddedRight: false,
          keptByWhere: true,
          colorIndex: null,
        });
      }
    }
  }

  // Evaluate WHERE clause against SQLite to determine exact surviving joined pairs
  if (parsed.whereClause) {
    try {
      const joinKeyword =
        join.type === 'LEFT'
          ? 'LEFT JOIN'
          : join.type === 'RIGHT'
            ? 'RIGHT JOIN'
            : join.type === 'CROSS'
              ? 'CROSS JOIN'
              : 'INNER JOIN';

      const onPart = join.rawOn ? `ON ${join.rawOn}` : '';
      const leftAs = leftAlias !== leftTableName ? `AS "${leftAlias}"` : '';
      const rightAs = rightAlias !== rightTableName ? `AS "${rightAlias}"` : '';

      const traceSql = `
        SELECT "${leftAlias}".rowid AS __lrid, "${rightAlias}".rowid AS __rrid
        FROM "${leftTableName}" ${leftAs}
        ${joinKeyword} "${rightTableName}" ${rightAs} ${onPart}
        WHERE ${parsed.whereClause}
      `;
      const traceRes = db.exec(traceSql);
      const survivingPairs = new Set<string>(
        traceRes.length
          ? traceRes[0].values.map(
              (v) => `${v[0] ?? 'null'}::${v[1] ?? 'null'}`
            )
          : []
      );

      for (const m of mergedRows) {
        const key = `${m.leftRow?.rid ?? 'null'}::${m.rightRow?.rid ?? 'null'}`;
        m.keptByWhere = survivingPairs.has(key);
        if (m.keptByWhere) {
          if (m.leftRow) m.leftRow.keptByWhere = true;
          if (m.rightRow) m.rightRow.keptByWhere = true;
        }
      }
    } catch {
      // Fallback: mark all merged rows kept if trace query fails
      for (const m of mergedRows) m.keptByWhere = true;
    }
  } else {
    for (const m of mergedRows) {
      m.keptByWhere = true;
      if (m.leftRow) m.leftRow.keptByWhere = true;
      if (m.rightRow) m.rightRow.keptByWhere = true;
    }
  }

  return {
    supported: true,
    parsed,
    mode: 'join',
    leftTableName,
    leftAlias,
    leftColumns: buildColumnMeta(
      leftTableName,
      leftAlias,
      parsed,
      actualLeftKey,
      rightColNames
    ),
    leftRows,
    rightTableName,
    rightAlias,
    rightColumns: buildColumnMeta(
      rightTableName,
      rightAlias,
      parsed,
      actualRightKey,
      leftColNames
    ),
    rightRows,
    edges,
    mergedRows,
    hasWhere: Boolean(parsed.whereClause),
  };
}
