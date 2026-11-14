export type SqlValue = string | number | Uint8Array | null;

export type SqlRow = Record<string, SqlValue>;

export interface ColumnDef {
  name: string;
  type: 'INTEGER' | 'TEXT' | 'REAL';
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
  domain?: 'core' | 'ecommerce' | 'streaming' | 'fintech' | 'social';
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
  isWindowFunction?: boolean;
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

export interface WindowOrderSpec {
  column: string;
  direction: 'ASC' | 'DESC';
}

export interface WindowFrameSpec {
  type: 'ROWS' | 'RANGE';
  start: string;
  end: string;
  raw: string;
}

export interface WindowFunctionSpec {
  raw: string;
  funcName: string; // 'ROW_NUMBER' | 'RANK' | 'DENSE_RANK' | 'LEAD' | 'LAG' | 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'NTILE'
  funcArgs: string[];
  partitionBy: string[];
  orderBy: WindowOrderSpec[];
  frameSpec?: WindowFrameSpec;
  alias?: string;
}

export interface CteSpec {
  name: string;
  querySql: string;
  isRecursive?: boolean;
}

export interface SubquerySpec {
  type: 'WHERE_SCALAR' | 'WHERE_EXISTS' | 'WHERE_IN' | 'FROM_DERIVED' | 'SELECT_EXPR';
  operator?: string; // '=', '>', '<', '>=', '<=', '!=', 'IN', 'NOT IN', 'EXISTS'
  subquerySql: string;
  outerColumn?: string;
  isCorrelated: boolean;
  correlatedColumns?: string[];
  rawClause: string;
}

export type VizMode = 'single' | 'join' | 'window' | 'cte' | 'subquery';

export interface ParsedQuery {
  isSelect: boolean;
  rawSql: string;
  selectAll: boolean;
  selectColumns: SelectColumnSpec[];
  fromTable: string | null;
  fromAlias: string | null;
  join: JoinClause | null;
  whereClause: string | null;
  groupByClause?: string | null;
  havingClause?: string | null;
  orderByClause: string | null;
  limitClause: string | null;
  windowFunctions: WindowFunctionSpec[];
  ctes: CteSpec[];
  subqueries: SubquerySpec[];
  vizMode: VizMode;
  supportedForViz: boolean;
  vizUnsupportedReason?: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export type ChallengeCategory =
  | 'SELECT'
  | 'WHERE'
  | 'INNER JOIN'
  | 'LEFT JOIN'
  | 'WINDOW FUNCTIONS'
  | 'CTE'
  | 'SUBQUERIES'
  | 'CAPSTONE';

export type ProblemDomain = 'core' | 'ecommerce' | 'streaming' | 'fintech' | 'social';

export interface ExampleOutput {
  columns: string[];
  rows: SqlValue[][];
}

export interface Challenge {
  id: string;
  number: number;
  title: string;
  difficulty: Difficulty;
  company: string;
  category: ChallengeCategory;
  domain: ProblemDomain;
  conceptTitle: string;
  conceptSummary: string;
  conceptTip: string;
  prompt: string;
  requirements?: string[];
  exampleOutput?: ExampleOutput;
  hint: string;
  starterSql: string;
  solutionSql: string;
  solutionExplanation: string;
  expectedColumns?: string[];
  orderMatters?: boolean;
  validateQuery?: (result: QueryResult, parsed: ParsedQuery | null) => {
    passed: boolean;
    feedback: string;
  };
}

export type VizStep =
  | 'CTE'
  | 'FROM'
  | 'JOIN'
  | 'SUBQUERY'
  | 'WHERE'
  | 'GROUP_BY'
  | 'HAVING'
  | 'WINDOW_PARTITION'
  | 'WINDOW_SORT'
  | 'WINDOW_FRAME'
  | 'SELECT'
  | 'ORDER_BY'
  | 'LIMIT';
