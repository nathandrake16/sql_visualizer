import type { Database } from 'sql.js';
import { SCHEMA_METADATA } from '@/data/seed';
import { splitTopLevelCommas } from '@/lib/sqlParser';
import {
  ParsedQuery,
  SqlRow,
  SqlValue,
  SubquerySpec,
  VizMode,
  WindowFunctionSpec,
} from '@/types/sql';

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

export interface VizOrderByCol {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface VizGroupBucket {
  key: string;
  displayKey: string;
  colorIndex: number;
  rowCount: number;
  rows: VizSourceRow[];
  aggregates: Record<string, SqlValue>;
  keptByHaving: boolean;
}

// Window Function Visualization Data Types
export interface VizWindowRow {
  rowId: number;
  data: SqlRow;
  partitionKey: string;
  orderRank: number;
  windowVal: SqlValue;
  leadLagPointerRowId?: number | null;
  frameStartIdx?: number;
  frameEndIdx?: number;
}

export interface VizWindowPartition {
  key: string;
  displayKey: string;
  colorIndex: number;
  rows: VizWindowRow[];
}

export interface VizWindowSnapshot {
  functionSpec: WindowFunctionSpec;
  partitions: VizWindowPartition[];
  totalRows: number;
  hasPartitionBy: boolean;
  hasOrderBy: boolean;
  hasFrame: boolean;
}

// CTE Pipeline Visualization Data Types
export interface VizCteNode {
  name: string;
  querySql: string;
  columns: string[];
  rows: SqlValue[][];
  rowCount: number;
  upstreamCtes: string[];
}

export interface VizCteSnapshot {
  nodes: VizCteNode[];
  finalQuerySql: string;
}

// Subquery Visualization Data Types
export interface VizSubquerySnapshot {
  subquery: SubquerySpec;
  innerScalarValue?: SqlValue;
  innerValues?: SqlValue[];
  outerRows: Array<{
    rid: number;
    data: SqlRow;
    matched: boolean;
    outerVal?: SqlValue;
  }>;
}

export interface VizSnapshot {
  supported: boolean;
  unsupportedReason?: string;
  parsed: ParsedQuery;
  mode: VizMode;
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
  // GROUP BY & HAVING
  hasGroupBy: boolean;
  groupByColumns: string[];
  groupBuckets: VizGroupBucket[];
  hasHaving: boolean;
  havingClause?: string | null;
  // ORDER BY
  hasOrderBy: boolean;
  orderByColumns: VizOrderByCol[];
  sortedLeftRows: VizSourceRow[];
  sortedMergedRows: VizMergedRow[];
  // LIMIT
  hasLimit: boolean;
  limitCount: number | null;
  offsetCount: number | null;
  // Sub-snapshots
  windowSnapshot?: VizWindowSnapshot;
  cteSnapshot?: VizCteSnapshot;
  subquerySnapshot?: VizSubquerySnapshot;
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
  try {
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
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// WINDOW FUNCTION VISUALIZATION SNAPSHOT BUILDER
// -------------------------------------------------------------
function buildWindowSnapshot(
  db: Database,
  parsed: ParsedQuery,
  fromTable: string
): VizWindowSnapshot | undefined {
  if (parsed.windowFunctions.length === 0) return undefined;
  const winFn = parsed.windowFunctions[0];

  try {
    let cleanExpr = winFn.raw.replace(/;+\s*$/, '').trim();
    if (winFn.alias) {
      cleanExpr = cleanExpr
        .replace(new RegExp(`\\s+(?:AS\\s+)?["\`]?${winFn.alias}["\`]?$`, 'i'), '')
        .trim();
    }
    const wherePart = parsed.whereClause ? `WHERE ${parsed.whereClause}` : '';
    const traceSql = `SELECT rowid AS __rid, *, ${cleanExpr} AS __win_val FROM "${fromTable}" ${wherePart}`;
    const res = db.exec(traceSql);

    if (!res.length) return undefined;
    const { columns, values } = res[0];

    const allRows: VizWindowRow[] = values.map((rowVals) => {
      const rid = Number(rowVals[0]);
      const data: SqlRow = {};
      for (let i = 1; i < columns.length - 1; i++) {
        data[columns[i]] = rowVals[i];
      }
      const windowVal = rowVals[rowVals.length - 1];

      let pKey = 'All Records';
      if (winFn.partitionBy.length > 0) {
        pKey = winFn.partitionBy
          .map((col) => `${col}=${String(data[col] ?? 'NULL')}`)
          .join(', ');
      }

      return {
        rowId: rid,
        data,
        partitionKey: pKey,
        orderRank: 0,
        windowVal,
      };
    });

    const partitionMap = new Map<string, VizWindowRow[]>();
    for (const r of allRows) {
      if (!partitionMap.has(r.partitionKey)) {
        partitionMap.set(r.partitionKey, []);
      }
      partitionMap.get(r.partitionKey)!.push(r);
    }

    const partitions: VizWindowPartition[] = [];
    let colorIndex = 0;

    partitionMap.forEach((rows, key) => {
      rows.forEach((r, idx) => {
        r.orderRank = idx + 1;
        if (winFn.funcName === 'LEAD') {
          const target = rows[idx + 1];
          r.leadLagPointerRowId = target ? target.rowId : null;
        } else if (winFn.funcName === 'LAG') {
          const target = rows[idx - 1];
          r.leadLagPointerRowId = target ? target.rowId : null;
        }

        if (winFn.frameSpec) {
          r.frameStartIdx = Math.max(0, idx - 1);
          r.frameEndIdx = idx;
        }
      });

      partitions.push({
        key,
        displayKey: key,
        colorIndex: colorIndex++,
        rows,
      });
    });

    return {
      functionSpec: winFn,
      partitions,
      totalRows: allRows.length,
      hasPartitionBy: winFn.partitionBy.length > 0,
      hasOrderBy: winFn.orderBy.length > 0,
      hasFrame: Boolean(winFn.frameSpec),
    };
  } catch {
    return undefined;
  }
}

// -------------------------------------------------------------
// CTE PIPELINE VISUALIZATION SNAPSHOT BUILDER
// -------------------------------------------------------------
function buildCteSnapshot(db: Database, parsed: ParsedQuery): VizCteSnapshot | undefined {
  if (parsed.ctes.length === 0) return undefined;
  const nodes: VizCteNode[] = [];

  for (let i = 0; i < parsed.ctes.length; i++) {
    const cte = parsed.ctes[i];
    try {
      const priorWith = parsed.ctes
        .slice(0, i + 1)
        .map((c) => `${c.name} AS (${c.querySql})`)
        .join(',\n');
      const testSql = `WITH ${priorWith} SELECT * FROM ${cte.name} LIMIT 50`;
      const res = db.exec(testSql);

      const upstreamCtes = parsed.ctes
        .slice(0, i)
        .map((c) => c.name)
        .filter((name) => new RegExp(`\\b${name}\\b`, 'i').test(cte.querySql));

      if (res.length) {
        nodes.push({
          name: cte.name,
          querySql: cte.querySql,
          columns: res[0].columns,
          rows: res[0].values,
          rowCount: res[0].values.length,
          upstreamCtes,
        });
      }
    } catch {
      // Continue to next CTE node
    }
  }

  return {
    nodes,
    finalQuerySql: parsed.rawSql,
  };
}

// -------------------------------------------------------------
// SUBQUERY VISUALIZATION SNAPSHOT BUILDER
// -------------------------------------------------------------
function buildSubquerySnapshot(
  db: Database,
  parsed: ParsedQuery,
  fromTable: string
): VizSubquerySnapshot | undefined {
  if (parsed.subqueries.length === 0) return undefined;
  const sub = parsed.subqueries[0];

  try {
    let innerScalarValue: SqlValue | undefined;
    let innerValues: SqlValue[] | undefined;

    if (!sub.isCorrelated) {
      const innerRes = db.exec(sub.subquerySql);
      if (innerRes.length && innerRes[0].values.length > 0) {
        if (sub.type === 'WHERE_SCALAR') {
          innerScalarValue = innerRes[0].values[0][0];
        } else if (sub.type === 'WHERE_IN') {
          innerValues = innerRes[0].values.map((v) => v[0]);
        }
      }
    }

    const whereSql = parsed.whereClause ? `WHERE ${parsed.whereClause}` : '';
    const survivingRes = db.exec(`SELECT rowid FROM "${fromTable}" ${whereSql}`);
    const survivingRids = new Set<number>(
      survivingRes.length ? survivingRes[0].values.map((v) => Number(v[0])) : []
    );

    const rawRows = fetchTableRows(db, fromTable);
    const outerRows = rawRows.map((r) => ({
      rid: r.rid,
      data: r.data,
      matched: survivingRids.has(r.rid),
      outerVal: sub.outerColumn ? r.data[sub.outerColumn] : undefined,
    }));

    return {
      subquery: sub,
      innerScalarValue,
      innerValues,
      outerRows,
    };
  } catch {
    return undefined;
  }
}

// -------------------------------------------------------------
// HELPER CALCULATORS FOR ORDER BY, LIMIT, AND GROUP BY/HAVING
// -------------------------------------------------------------
export function parseOrderByColumns(rawClause: string | null): VizOrderByCol[] {
  if (!rawClause) return [];
  const parts = splitTopLevelCommas(rawClause);
  const out: VizOrderByCol[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/^([a-zA-Z0-9_.]+)(?:\s+(ASC|DESC))?$/i);
    if (match) {
      const col = match[1].split('.').pop() || match[1];
      out.push({
        column: col.replace(/["`]/g, '').trim(),
        direction: match[2]?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC',
      });
    }
  }
  return out;
}

export function parseLimitClause(rawClause: string | null): {
  limitCount: number | null;
  offsetCount: number | null;
} {
  if (!rawClause) return { limitCount: null, offsetCount: null };
  const trimmed = rawClause.trim();

  // Pattern: LIMIT x OFFSET y
  const offsetMatch = trimmed.match(/^(\d+)\s+OFFSET\s+(\d+)$/i);
  if (offsetMatch) {
    return {
      limitCount: parseInt(offsetMatch[1], 10),
      offsetCount: parseInt(offsetMatch[2], 10),
    };
  }

  // Pattern: LIMIT y, x (offset, count)
  const commaMatch = trimmed.match(/^(\d+)\s*,\s*(\d+)$/);
  if (commaMatch) {
    return {
      offsetCount: parseInt(commaMatch[1], 10),
      limitCount: parseInt(commaMatch[2], 10),
    };
  }

  // Pattern: LIMIT x
  const singleMatch = trimmed.match(/^(\d+)$/);
  if (singleMatch) {
    return {
      limitCount: parseInt(singleMatch[1], 10),
      offsetCount: null,
    };
  }

  return { limitCount: null, offsetCount: null };
}

function compareSqlValues(a: SqlValue, b: SqlValue, direction: 'ASC' | 'DESC'): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return direction === 'ASC' ? 1 : -1;
  if (b === null || b === undefined) return direction === 'ASC' ? -1 : 1;
  let cmp = 0;
  if (typeof a === 'number' && typeof b === 'number') {
    cmp = a - b;
  } else {
    cmp = String(a).localeCompare(String(b), undefined, { numeric: true });
  }
  return direction === 'DESC' ? -cmp : cmp;
}

export function getRowValue(row: VizSourceRow, colName: string): SqlValue {
  if (row.data[colName] !== undefined) return row.data[colName];
  const lower = colName.toLowerCase();
  for (const k of Object.keys(row.data)) {
    if (k.toLowerCase() === lower) return row.data[k];
  }
  return null;
}

export function sortRows(rows: VizSourceRow[], orderByCols: VizOrderByCol[]): VizSourceRow[] {
  if (orderByCols.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const ob of orderByCols) {
      const valA = getRowValue(a, ob.column);
      const valB = getRowValue(b, ob.column);
      const cmp = compareSqlValues(valA, valB, ob.direction);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

export function getMergedRowValue(row: VizMergedRow, colName: string): SqlValue {
  if (row.leftRow) {
    const val = getRowValue(row.leftRow, colName);
    if (val !== null && val !== undefined) return val;
  }
  if (row.rightRow) {
    const val = getRowValue(row.rightRow, colName);
    if (val !== null && val !== undefined) return val;
  }
  return null;
}

export function sortMergedRows(rows: VizMergedRow[], orderByCols: VizOrderByCol[]): VizMergedRow[] {
  if (orderByCols.length === 0) return [...rows];
  return [...rows].sort((a, b) => {
    for (const ob of orderByCols) {
      const valA = getMergedRowValue(a, ob.column);
      const valB = getMergedRowValue(b, ob.column);
      const cmp = compareSqlValues(valA, valB, ob.direction);
      if (cmp !== 0) return cmp;
    }
    return 0;
  });
}

export function buildGroupBuckets(
  db: Database,
  fromTable: string,
  whereClause: string | null,
  groupByClause: string | null,
  havingClause: string | null,
  sourceRows: VizSourceRow[]
): { groupBuckets: VizGroupBucket[]; groupByColumns: string[] } {
  if (!groupByClause) return { groupBuckets: [], groupByColumns: [] };

  const groupByColumns = splitTopLevelCommas(groupByClause).map((c) =>
    c.split('.').pop()!.replace(/["`]/g, '').trim()
  );

  const havingPassedKeys = new Set<string>();
  let hasHavingFilter = Boolean(havingClause);
  if (hasHavingFilter) {
    try {
      const whereSql = whereClause ? `WHERE ${whereClause}` : '';
      const testSql = `SELECT ${groupByColumns.map((c) => `"${c}"`).join(', ')} FROM "${fromTable}" ${whereSql} GROUP BY ${groupByClause} HAVING ${havingClause}`;
      const res = db.exec(testSql);
      if (res.length) {
        for (const vals of res[0].values) {
          const key = vals.map((v) => String(v ?? 'NULL')).join('::');
          havingPassedKeys.add(key);
        }
      }
    } catch {
      hasHavingFilter = false;
    }
  }

  const bucketMap = new Map<string, VizSourceRow[]>();
  for (const row of sourceRows) {
    if (!row.keptByWhere) continue;
    const key = groupByColumns
      .map((col) => String(getRowValue(row, col) ?? 'NULL'))
      .join('::');
    if (!bucketMap.has(key)) {
      bucketMap.set(key, []);
    }
    bucketMap.get(key)!.push(row);
  }

  const groupBuckets: VizGroupBucket[] = [];
  let colorIndex = 0;

  bucketMap.forEach((rowsInGroup, key) => {
    const displayParts = groupByColumns.map((col, idx) => {
      const val = key.split('::')[idx];
      return `${col}=${val}`;
    });
    const displayKey = displayParts.join(', ');

    const aggregates: Record<string, SqlValue> = {
      'COUNT(*)': rowsInGroup.length,
    };

    if (rowsInGroup.length > 0) {
      const firstRow = rowsInGroup[0].data;
      for (const [colName, val] of Object.entries(firstRow)) {
        if (typeof val === 'number') {
          const sum = rowsInGroup.reduce(
            (acc, r) => acc + (typeof r.data[colName] === 'number' ? (r.data[colName] as number) : 0),
            0
          );
          aggregates[`SUM(${colName})`] = sum;
          aggregates[`AVG(${colName})`] = Math.round((sum / rowsInGroup.length) * 100) / 100;
        }
      }
    }

    const keptByHaving = hasHavingFilter ? havingPassedKeys.has(key) : true;

    groupBuckets.push({
      key,
      displayKey,
      colorIndex: colorIndex++,
      rowCount: rowsInGroup.length,
      rows: rowsInGroup,
      aggregates,
      keptByHaving,
    });
  });

  return { groupBuckets, groupByColumns };
}

// -------------------------------------------------------------
// MAIN VISUALIZATION SNAPSHOT GENERATOR
// -------------------------------------------------------------
export function buildVisualizationSnapshot(
  db: Database,
  parsed: ParsedQuery
): VizSnapshot {
  const fromTable = parsed.fromTable || 'users';
  const fromAlias = parsed.fromAlias || fromTable;

  // Shared parsing for ORDER BY, LIMIT, and GROUP BY
  const hasOrderBy = Boolean(parsed.orderByClause);
  const orderByColumns = parseOrderByColumns(parsed.orderByClause);
  const hasLimit = Boolean(parsed.limitClause);
  const { limitCount, offsetCount } = parseLimitClause(parsed.limitClause);
  const hasGroupBy = Boolean(parsed.groupByClause);
  const hasHaving = Boolean(parsed.havingClause);

  // 1. Check CTE Mode
  if (parsed.vizMode === 'cte' && parsed.ctes.length > 0) {
    const cteSnapshot = buildCteSnapshot(db, parsed);
    if (cteSnapshot && cteSnapshot.nodes.length > 0) {
      const rawRows = fetchTableRows(db, fromTable);
      const leftRows: VizSourceRow[] = rawRows.map(({ rid, data }) => ({
        rid,
        data,
        joinKeyVal: null,
        hasPartner: true,
        keptByJoin: true,
        keptByWhere: true,
        colorIndex: null,
      }));
      const sortedLeftRows = sortRows(leftRows, orderByColumns);

      return {
        supported: true,
        parsed,
        mode: 'cte',
        leftTableName: fromTable,
        leftAlias: fromAlias,
        leftColumns: buildColumnMeta(fromTable, fromAlias, parsed, null, []),
        leftRows,
        rightTableName: null,
        rightAlias: null,
        rightColumns: [],
        rightRows: [],
        edges: [],
        mergedRows: [],
        hasWhere: Boolean(parsed.whereClause),
        hasGroupBy,
        groupByColumns: [],
        groupBuckets: [],
        hasHaving,
        havingClause: parsed.havingClause,
        hasOrderBy,
        orderByColumns,
        sortedLeftRows,
        sortedMergedRows: [],
        hasLimit,
        limitCount,
        offsetCount,
        cteSnapshot,
      };
    }
  }

  // 2. Check Window Function Mode
  if (parsed.vizMode === 'window' && parsed.windowFunctions.length > 0) {
    const windowSnapshot = buildWindowSnapshot(db, parsed, fromTable);
    if (windowSnapshot) {
      const rawRows = fetchTableRows(db, fromTable);
      let keptRids: Set<number> | null = null;
      if (parsed.whereClause) {
        try {
          const whereRes = db.exec(`SELECT rowid FROM "${fromTable}" WHERE ${parsed.whereClause}`);
          keptRids = new Set<number>(whereRes.length ? whereRes[0].values.map((v) => Number(v[0])) : []);
        } catch {
          keptRids = null;
        }
      }
      const leftRows: VizSourceRow[] = rawRows.map(({ rid, data }) => ({
        rid,
        data,
        joinKeyVal: null,
        hasPartner: true,
        keptByJoin: true,
        keptByWhere: keptRids ? keptRids.has(rid) : true,
        colorIndex: null,
      }));
      const sortedLeftRows = sortRows(leftRows.filter((r) => r.keptByWhere), orderByColumns);

      return {
        supported: true,
        parsed,
        mode: 'window',
        leftTableName: fromTable,
        leftAlias: fromAlias,
        leftColumns: buildColumnMeta(fromTable, fromAlias, parsed, null, []),
        leftRows,
        rightTableName: null,
        rightAlias: null,
        rightColumns: [],
        rightRows: [],
        edges: [],
        mergedRows: [],
        hasWhere: Boolean(parsed.whereClause),
        hasGroupBy,
        groupByColumns: [],
        groupBuckets: [],
        hasHaving,
        havingClause: parsed.havingClause,
        hasOrderBy,
        orderByColumns,
        sortedLeftRows,
        sortedMergedRows: [],
        hasLimit,
        limitCount,
        offsetCount,
        windowSnapshot,
      };
    }
  }

  // 3. Check Subquery Mode
  if (parsed.vizMode === 'subquery' && parsed.subqueries.length > 0) {
    const subquerySnapshot = buildSubquerySnapshot(db, parsed, fromTable);
    if (subquerySnapshot) {
      const leftRows: VizSourceRow[] = subquerySnapshot.outerRows.map((r) => ({
        rid: r.rid,
        data: r.data,
        joinKeyVal: null,
        hasPartner: true,
        keptByJoin: true,
        keptByWhere: r.matched,
        colorIndex: null,
      }));
      const sortedLeftRows = sortRows(leftRows.filter((r) => r.keptByWhere), orderByColumns);

      return {
        supported: true,
        parsed,
        mode: 'subquery',
        leftTableName: fromTable,
        leftAlias: fromAlias,
        leftColumns: buildColumnMeta(fromTable, fromAlias, parsed, null, []),
        leftRows,
        rightTableName: null,
        rightAlias: null,
        rightColumns: [],
        rightRows: [],
        edges: [],
        mergedRows: [],
        hasWhere: Boolean(parsed.whereClause),
        hasGroupBy,
        groupByColumns: [],
        groupBuckets: [],
        hasHaving,
        havingClause: parsed.havingClause,
        hasOrderBy,
        orderByColumns,
        sortedLeftRows,
        sortedMergedRows: [],
        hasLimit,
        limitCount,
        offsetCount,
        subquerySnapshot,
      };
    }
  }

  // 4. Single-table mode (or fallback when no JOIN)
  if (!parsed.join) {
    const rawLeftRows = fetchTableRows(db, fromTable);
    let keptRids: Set<number> | null = null;

    if (parsed.whereClause) {
      try {
        const aliasPart = fromAlias !== fromTable ? `AS "${fromAlias}"` : '';
        const whereSql = `SELECT "${fromAlias}".rowid AS __rid FROM "${fromTable}" ${aliasPart} WHERE ${parsed.whereClause}`;
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

    const sortedLeftRows = sortRows(
      leftRows.filter((r) => r.keptByWhere),
      orderByColumns
    );

    const { groupBuckets, groupByColumns } = buildGroupBuckets(
      db,
      fromTable,
      parsed.whereClause,
      parsed.groupByClause ?? null,
      parsed.havingClause ?? null,
      leftRows
    );

    return {
      supported: true,
      parsed,
      mode: 'single',
      leftTableName: fromTable,
      leftAlias: fromAlias,
      leftColumns: buildColumnMeta(fromTable, fromAlias, parsed, null, []),
      leftRows,
      rightTableName: null,
      rightAlias: null,
      rightColumns: [],
      rightRows: [],
      edges: [],
      mergedRows: [],
      hasWhere: Boolean(parsed.whereClause),
      hasGroupBy,
      groupByColumns,
      groupBuckets,
      hasHaving,
      havingClause: parsed.havingClause,
      hasOrderBy,
      orderByColumns,
      sortedLeftRows,
      sortedMergedRows: [],
      hasLimit,
      limitCount,
      offsetCount,
    };
  }

  // 5. Two-table JOIN mode
  const join = parsed.join;
  const leftTableName = fromTable;
  const leftAlias = fromAlias;
  const rightTableName = join.rightTable;
  const rightAlias = join.rightAlias;

  const rawLeftRows = fetchTableRows(db, leftTableName);
  const rawRightRows = fetchTableRows(db, rightTableName);

  const leftColNames = getColumnsForTable(leftTableName);
  const rightColNames = getColumnsForTable(rightTableName);

  const actualLeftKey =
    leftColNames.find((c) => c.toLowerCase() === join.leftColumn.toLowerCase()) ||
    join.leftColumn;
  const actualRightKey =
    rightColNames.find((c) => c.toLowerCase() === join.rightColumn.toLowerCase()) ||
    join.rightColumn;

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

  for (const r of rawRightRows) getKeyColor(r.data[actualRightKey] ?? null);
  for (const l of rawLeftRows) getKeyColor(l.data[actualLeftKey] ?? null);

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
        (r) => r.joinKeyVal !== null && r.joinKeyVal === l.joinKeyVal
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
          ? rightRows.filter((r) => r.joinKeyVal === l.joinKeyVal)
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
  }

  // Filter with WHERE if present
  if (parsed.whereClause) {
    try {
      const onPart = join.rawOn ? `ON ${join.rawOn}` : '';
      const leftAs = leftAlias !== leftTableName ? `AS "${leftAlias}"` : '';
      const rightAs = rightAlias !== rightTableName ? `AS "${rightAlias}"` : '';
      const traceSql = `
        SELECT "${leftAlias}".rowid AS __lrid, "${rightAlias}".rowid AS __rrid
        FROM "${leftTableName}" ${leftAs}
        ${join.type} JOIN "${rightTableName}" ${rightAs} ${onPart}
        WHERE ${parsed.whereClause}
      `;
      const traceRes = db.exec(traceSql);
      const survivingPairs = new Set<string>(
        traceRes.length
          ? traceRes[0].values.map((v) => `${v[0] ?? 'null'}::${v[1] ?? 'null'}`)
          : []
      );

      for (const m of mergedRows) {
        const key = `${m.leftRow?.rid ?? 'null'}::${m.rightRow?.rid ?? 'null'}`;
        m.keptByWhere = survivingPairs.has(key);
      }
    } catch {
      for (const m of mergedRows) m.keptByWhere = true;
    }
  } else {
    for (const m of mergedRows) m.keptByWhere = true;
  }

  const sortedMergedRows = sortMergedRows(
    mergedRows.filter((r) => r.keptByWhere),
    orderByColumns
  );

  return {
    supported: true,
    parsed,
    mode: 'join',
    leftTableName,
    leftAlias,
    leftColumns: buildColumnMeta(leftTableName, leftAlias, parsed, actualLeftKey, rightColNames),
    leftRows,
    rightTableName,
    rightAlias,
    rightColumns: buildColumnMeta(rightTableName, rightAlias, parsed, actualRightKey, leftColNames),
    rightRows,
    edges,
    mergedRows,
    hasWhere: Boolean(parsed.whereClause),
    hasGroupBy,
    groupByColumns: [],
    groupBuckets: [],
    hasHaving,
    havingClause: parsed.havingClause,
    hasOrderBy,
    orderByColumns,
    sortedLeftRows: [],
    sortedMergedRows,
    hasLimit,
    limitCount,
    offsetCount,
  };
}
