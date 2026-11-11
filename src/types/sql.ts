export type SqlValue = string | number | Uint8Array | null;

export type SqlRow = Record<string, SqlValue>;

export interface ColumnDef {
  name: string;
  type: 'INTEGER' | 'TEXT';
  isPrimaryKey?: boolean;
  foreignKey?: {
    table: string;
    column: string;
  };
  nullable?: boolean;
  description: string;
}

export interface TableSchema {
  name: string;
  description: string;
  columns: ColumnDef[];
}

export interface QueryResult {
  columns: string[];
  rows: SqlValue[][];
  rowObjects: SqlRow[];
  executionTimeMs: number;
  rowCount: number;
}

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'CROSS';

export interface SelectColumnSpec {
  raw: string;
  tableOrAlias?: string;
  column: string;
  alias?: string;
  isWildcard: boolean;
  isExpression: boolean;
}

export interface JoinClause {
  type: JoinType;
  leftTable: string;
  leftAlias: string;
  rightTable: string;
  rightAlias: string;
  leftColumn: string;
  rightColumn: string;
  rawOn: string;
}

export interface ParsedQuery {
  isSelect: boolean;
  rawSql: string;
  selectAll: boolean;
  selectColumns: SelectColumnSpec[];
  fromTable: string | null;
  fromAlias: string | null;
  join: JoinClause | null;
  whereClause: string | null;
  orderByClause: string | null;
  limitClause: string | null;
  supportedForViz: boolean;
  vizUnsupportedReason?: string;
}

export type ChallengeCategory = 'SELECT' | 'WHERE' | 'INNER JOIN' | 'LEFT JOIN' | 'ADVANCED';

export interface Challenge {
  id: string;
  number: number;
  title: string;
  category: ChallengeCategory;
  conceptTitle: string;
  conceptSummary: string;
  conceptTip: string;
  prompt: string;
  hint: string;
  starterSql: string;
  solutionSql: string;
  expectedColumns?: string[];
  validateQuery?: (result: QueryResult, parsed: ParsedQuery | null) => {
    passed: boolean;
    feedback: string;
  };
}

export type VizStep = 'FROM' | 'JOIN' | 'WHERE' | 'SELECT';
