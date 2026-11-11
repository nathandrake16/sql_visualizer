import { Challenge, ParsedQuery, QueryResult } from '@/types/sql';

export const CHALLENGES: Challenge[] = [
  {
    id: 'select-where',
    number: 1,
    title: 'Filtering with WHERE',
    category: 'WHERE',
    conceptTitle: 'Basic SELECT & WHERE Filtering',
    conceptSummary:
      'SQL evaluates FROM first to gather rows from a table, then WHERE to keep only rows matching your condition, and finally SELECT to pick the output columns.',
    conceptTip:
      'Notice the execution order: FROM -> WHERE -> SELECT. Even though SELECT is written first, filtering happens before columns are trimmed.',
    prompt:
      'Retrieve the name and role of all users who belong to department_id = 1 (Engineering).',
    hint: 'Use FROM users, filter rows with WHERE department_id = 1, and select name, role.',
    starterSql: `SELECT name, role, department_id
FROM users
WHERE department_id = 1;`,
    solutionSql: `SELECT name, role
FROM users
WHERE department_id = 1;`,
    validateQuery: (result: QueryResult) => {
      const names = result.rowObjects
        .map((r) => String(r.name ?? ''))
        .sort();
      const expected = ['Alice Chen', 'Priya Patel'];
      const hasRole = result.columns.some((c) => c.toLowerCase().includes('role'));
      const hasName = result.columns.some((c) => c.toLowerCase().includes('name'));
      if (
        names.length === 2 &&
        names[0] === expected[0] &&
        names[1] === expected[1] &&
        hasName &&
        hasRole
      ) {
        return {
          passed: true,
          feedback: 'Great! You filtered users down to the 2 Engineering members.',
        };
      }
      return {
        passed: false,
        feedback: `Expected 2 Engineering rows (Alice Chen, Priya Patel) with name and role columns; got ${result.rowCount} row(s).`,
      };
    },
  },
  {
    id: 'inner-join',
    number: 2,
    title: 'Matching with INNER JOIN',
    category: 'INNER JOIN',
    conceptTitle: 'How INNER JOIN Connects Two Tables',
    conceptSummary:
      'INNER JOIN pairs each row in the left table with rows in the right table where the ON condition matches. Rows without a match on either side are excluded.',
    conceptTip:
      'Watch Jordan Kim (department_id = NULL) and Research (id = 4) fade out — INNER JOIN keeps only overlapping pairs.',
    prompt:
      'List all employees who have an assigned department, returning each employee name and their department name.',
    hint: 'Join users and departments ON users.department_id = departments.id using INNER JOIN.',
    starterSql: `SELECT users.name AS employee, users.role, departments.name AS department
FROM users
INNER JOIN departments
  ON users.department_id = departments.id;`,
    solutionSql: `SELECT users.name AS employee, departments.name AS department
FROM users
INNER JOIN departments
  ON users.department_id = departments.id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const isInner = parsed?.join?.type === 'INNER';
      if (result.rowCount === 4 && result.columns.length >= 2 && isInner) {
        return {
          passed: true,
          feedback:
            'Spot on! All 4 matched employees appear, while Jordan Kim (NULL) and Research (0 users) are excluded.',
        };
      }
      if (result.rowCount === 4 && result.columns.length >= 2) {
        return {
          passed: true,
          feedback: 'Correct 4 matched rows returned!',
        };
      }
      return {
        passed: false,
        feedback: `Expected 4 matched employee-department rows using INNER JOIN; got ${result.rowCount} row(s).`,
      };
    },
  },
  {
    id: 'left-join',
    number: 3,
    title: 'Preserving Rows with LEFT JOIN',
    category: 'LEFT JOIN',
    conceptTitle: 'Basic SELECT, WHERE, and JOINs — LEFT JOIN',
    conceptSummary:
      'A LEFT JOIN keeps every row from the left table (users), attaching matching rows from the right table (departments). When no match exists, SQL fills the right-side columns with NULL.',
    conceptTip:
      'Try running the starter INNER JOIN first, then switch INNER JOIN to LEFT JOIN to watch Jordan Kim receive NULL department cells.',
    prompt:
      'Find all employees and their department names, including employees without a department.',
    hint: 'Change INNER JOIN to LEFT JOIN so users with department_id IS NULL (Jordan Kim) stay in the result.',
    starterSql: `SELECT
  u.name AS employee,
  u.role,
  d.name AS department,
  d.location
FROM users u
INNER JOIN departments d
  ON u.department_id = d.id;`,
    solutionSql: `SELECT
  u.name AS employee,
  u.role,
  d.name AS department,
  d.location
FROM users u
LEFT JOIN departments d
  ON u.department_id = d.id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasJordan = result.rowObjects.some((r) =>
        Object.values(r).some((v) => v === 'Jordan Kim')
      );
      const hasNullCell = result.rows.some((row) => row.some((v) => v === null));
      const isLeft = parsed?.join?.type === 'LEFT';
      if (result.rowCount === 5 && hasJordan && hasNullCell && isLeft) {
        return {
          passed: true,
          feedback:
            'Aha! LEFT JOIN preserved all 5 employees and injected NULL for Jordan Kim’s missing department.',
        };
      }
      if (parsed?.join?.type === 'INNER') {
        return {
          passed: false,
          feedback:
            'Currently using INNER JOIN (4 rows). Jordan Kim was dropped! Switch INNER JOIN to LEFT JOIN to include all employees.',
        };
      }
      return {
        passed: false,
        feedback: `Expected all 5 employees including Jordan Kim with NULL department fields; got ${result.rowCount} row(s).`,
      };
    },
  },
  {
    id: 'unassigned-departments',
    number: 4,
    title: 'Finding Missing Links (LEFT JOIN + WHERE)',
    category: 'ADVANCED',
    conceptTitle: 'Detecting Unmatched Records with IS NULL',
    conceptSummary:
      'Swap the left table to departments and LEFT JOIN users. Any department with no employees produces NULL user columns — which you can isolate with WHERE u.id IS NULL.',
    conceptTip:
      'In SQLite (which lacks native RIGHT JOIN in older dialects, though modern SQLite supports it), flipping table order with LEFT JOIN is the clearest pattern.',
    prompt:
      'Find all departments that currently have zero assigned employees.',
    hint: 'Start FROM departments d, LEFT JOIN users u ON d.id = u.department_id, and filter WHERE u.id IS NULL.',
    starterSql: `SELECT
  d.id AS dept_id,
  d.name AS department,
  d.location,
  u.name AS employee
FROM departments d
LEFT JOIN users u
  ON d.id = u.department_id
WHERE u.id IS NULL;`,
    solutionSql: `SELECT
  d.id AS dept_id,
  d.name AS department,
  d.location
FROM departments d
LEFT JOIN users u
  ON d.id = u.department_id
WHERE u.id IS NULL;`,
    validateQuery: (result: QueryResult) => {
      const hasResearch = result.rowObjects.some((r) =>
        Object.values(r).some((v) => v === 'Research')
      );
      if (result.rowCount === 1 && hasResearch) {
        return {
          passed: true,
          feedback:
            'Nailed it! Research (Zurich) has no matching users, so LEFT JOIN + WHERE u.id IS NULL isolates it cleanly.',
        };
      }
      return {
        passed: false,
        feedback: `Expected 1 row (Research in Zurich); got ${result.rowCount} row(s).`,
      };
    },
  },
];
