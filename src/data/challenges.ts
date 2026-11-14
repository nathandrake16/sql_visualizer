import { Challenge, QueryResult } from '@/types/sql';

export const CHALLENGES: Challenge[] = [
  {
    id: "select-where",
    number: 1,
    title: "Filtering Engineering Staff",
    difficulty: "Easy",
    company: "Meta",
    category: "WHERE",
    domain: "core",
    conceptTitle: "Basic SELECT & WHERE Filtering",
    conceptSummary: "SQL evaluates the FROM clause first to locate tables, then WHERE to filter individual rows based on boolean conditions, and finally SELECT to project requested columns.",
    conceptTip: "Execution order: FROM -> WHERE -> SELECT. Filtering happens before columns are trimmed or projected.",
    prompt: "Meta internal employee systems need to filter staff members belonging to the Engineering department (department_id = 1). Retrieve their full name and current job role.",
    requirements: [
      "Select columns: name, role",
      "Filter for department_id = 1",
      "Do not include members from other departments or contractors without an assigned department"
],
    exampleOutput: {
      "columns": [
            "name",
            "role"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Staff Engineer"
            ],
            [
                  "Priya Patel",
                  "Backend Engineer"
            ],
            [
                  "Elena Rostova",
                  "Senior Engineer"
            ]
      ]
},
    hint: "Query FROM users, filter with WHERE department_id = 1, and project name and role.",
    starterSql: "-- Problem 1: Filtering Engineering Staff (Meta)\n-- Query all employees in department_id = 1\n-- Required columns: name, role\n\nSELECT\n  -- TODO: Project employee name and role\nFROM users\nWHERE ;",
    solutionSql: "SELECT name, role\nFROM users\nWHERE department_id = 1;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **FROM Clause**: The engine first scans the `users` table.\n2. **WHERE Clause**: Each row is evaluated against the predicate `department_id = 1`. Alice Chen, Priya Patel, and Elena Rostova pass this condition; others evaluate to false or NULL and are discarded.\n3. **SELECT Clause**: Finally, only the `name` and `role` columns are projected into the final result set.\n\n### Interview Takeaway\nIn SQL execution order, the `WHERE` filter operates row-by-row on the base table *before* `SELECT` expressions or aliases are computed. You cannot reference a column alias defined in `SELECT` within the `WHERE` clause.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 3 && cols.includes('name') && cols.includes('role')) {
        return { passed: true, feedback: 'Great job! You successfully filtered for Engineering staff members.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "inner-join",
    number: 2,
    title: "Matching Employees to Departments",
    difficulty: "Easy",
    company: "Google",
    category: "INNER JOIN",
    domain: "core",
    conceptTitle: "Connecting Tables with INNER JOIN",
    conceptSummary: "INNER JOIN combines rows from two tables where the ON join condition evaluates to TRUE. Rows that do not have a corresponding match in the joined table are omitted.",
    conceptTip: "Notice that Jordan Kim (NULL department) and the Research department (0 assigned members) are excluded by INNER JOIN.",
    prompt: "Google Organizational Analytics needs to generate a roster of all active team members with an assigned department. Display the employee name, role, and the name of their department.",
    requirements: [
      "Select columns: employee (name), role, department (departments.name)",
      "Join users and departments on department_id = departments.id",
      "Exclude contractors who do not have an assigned department"
],
    exampleOutput: {
      "columns": [
            "employee",
            "role",
            "department"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Staff Engineer",
                  "Engineering"
            ],
            [
                  "Marcus Vance",
                  "Lead Designer",
                  "Design"
            ],
            [
                  "Priya Patel",
                  "Backend Engineer",
                  "Engineering"
            ]
      ]
},
    hint: "Use INNER JOIN between users and departments ON users.department_id = departments.id.",
    starterSql: "-- Problem 2: Matching Employees to Departments (Google)\n-- Join users and departments on foreign key match\n-- Required columns: employee (name), role, department (departments.name)\n\nSELECT\n  -- TODO: Alias users.name AS employee and departments.name AS department\nFROM users u\nINNER JOIN departments d\n  ON ;",
    solutionSql: "SELECT u.name AS employee, u.role, d.name AS department\nFROM users u\nINNER JOIN departments d\n  ON u.department_id = d.id;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **FROM & INNER JOIN**: The engine takes `users` (aliased as `u`) and matches each row with `departments` (aliased as `d`) using `u.department_id = d.id`.\n2. **Filtering Unmatched Records**: Jordan Kim has `department_id IS NULL`, so the join condition evaluates to NULL (false). Similarly, department 4 ('Research') has no employees matching its ID. Both are excluded.\n3. **Projection**: We alias `u.name` to `employee` and `d.name` to `department` for business readability.\n\n### Interview Takeaway\nINNER JOIN requires matches on both sides. If you need to keep unassigned employees, use a LEFT JOIN instead.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 7 && (cols.includes('employee') || cols.includes('name')) && (cols.includes('department') || cols.includes('name'))) {
        return { passed: true, feedback: 'Excellent! All assigned employees matched with their departments.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "left-join",
    number: 3,
    title: "Preserving Unassigned Contractors",
    difficulty: "Easy",
    company: "Amazon",
    category: "LEFT JOIN",
    domain: "core",
    conceptTitle: "Preserving Rows with LEFT JOIN",
    conceptSummary: "LEFT JOIN preserves all records from the left-hand table regardless of whether a matching record exists on the right. Missing right-hand attributes are populated with NULL.",
    conceptTip: "Watch contractor Jordan Kim receive NULL in the department column instead of being dropped from the report.",
    prompt: "Amazon HR auditing requires a complete roster of all personnel. List all employees and their associated department name. Ensure contractors without a department are retained in the output with a NULL department value.",
    requirements: [
      "Select columns: employee (name), department (departments.name)",
      "Use LEFT JOIN between users and departments",
      "All 8 users must appear in the final result"
],
    exampleOutput: {
      "columns": [
            "employee",
            "department"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Engineering"
            ],
            [
                  "Marcus Vance",
                  "Design"
            ],
            [
                  "Priya Patel",
                  "Engineering"
            ]
      ]
},
    hint: "Perform a LEFT JOIN from users u to departments d ON u.department_id = d.id.",
    starterSql: "-- Problem 3: Preserving Unassigned Contractors (Amazon)\n-- List all employees and their departments, keeping contractors with NULL\n-- Required columns: employee (name), department (departments.name)\n\nSELECT\n  -- TODO: Use LEFT JOIN to retain unassigned contractors\nFROM users u\nLEFT JOIN departments d\n  ON ;",
    solutionSql: "SELECT u.name AS employee, d.name AS department\nFROM users u\nLEFT JOIN departments d\n  ON u.department_id = d.id;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **FROM users u LEFT JOIN departments d**: The `users` table is on the left. Every single row in `users` is guaranteed to appear in the output.\n2. **Evaluation of ON Condition**: When evaluating Jordan Kim (`department_id IS NULL`), no department matches. Rather than discarding Jordan, the engine fills the department table columns with `NULL`.\n3. **Result Set**: The output contains all 8 employees, including Jordan Kim with `department = NULL`.\n\n### Interview Takeaway\nUse LEFT JOIN whenever the business requirement says \"include all entities, even those without activity/assignments\". Follow up in interviews by mentioning how NULLs should be handled with `COALESCE(d.name, 'Unassigned')`.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      const hasNull = rows.some(r => r.some(v => v === null));
      if (cols.length >= 2 && rows.length === 8 && hasNull) {
        return { passed: true, feedback: 'Spot on! All 8 users are preserved, including contractors with NULL.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "apple-dept-salary-summary",
    number: 4,
    title: "Department Headcount & Total Salary",
    difficulty: "Easy",
    company: "Apple",
    category: "INNER JOIN",
    domain: "core",
    conceptTitle: "Grouping & Aggregations with GROUP BY",
    conceptSummary: "GROUP BY collapses multiple rows sharing identical key values into a single summary row, allowing aggregate functions like COUNT(), SUM(), and AVG() to run over each group.",
    conceptTip: "Every non-aggregated column in your SELECT statement must appear in your GROUP BY clause.",
    prompt: "Apple Finance requires a compensation breakdown by department. Calculate the total headcount and the sum of annual salaries for each department that has active staff.",
    requirements: [
      "Select columns: department, headcount, total_salary",
      "Join users and departments on department_id",
      "Group by department name",
      "Count employees as headcount, sum salary as total_salary"
],
    exampleOutput: {
      "columns": [
            "department",
            "headcount",
            "total_salary"
      ],
      "rows": [
            [
                  "Design",
                  2,
                  215000
            ],
            [
                  "Engineering",
                  3,
                  460000
            ],
            [
                  "Product",
                  2,
                  240000
            ]
      ]
},
    hint: "Join users and departments, GROUP BY d.name, and use COUNT(u.id) and SUM(u.salary).",
    starterSql: "-- Problem 4: Department Headcount & Total Salary (Apple)\n-- Calculate headcount and total salary per department\n-- Required columns: department, headcount, total_salary\n\nSELECT\n  -- TODO: Select department name, COUNT of users, and SUM of salary\nFROM users u\nINNER JOIN departments d ON u.department_id = d.id\nGROUP BY ;",
    solutionSql: "SELECT d.name AS department, COUNT(u.id) AS headcount, SUM(u.salary) AS total_salary\nFROM users u\nINNER JOIN departments d ON u.department_id = d.id\nGROUP BY d.name;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **FROM & JOIN**: Matches employees to their respective department records.\n2. **GROUP BY d.name**: Collapses rows into 3 distinct department groups: Engineering, Design, and Product.\n3. **Aggregate Computations**:\n   - `COUNT(u.id)` counts the number of employee IDs assigned to that group.\n   - `SUM(u.salary)` calculates the combined payroll cost for each group.\n\n### Interview Takeaway\nAlways count the primary key of the child table (e.g. `COUNT(u.id)`) instead of `COUNT(*)` when working with outer joins to avoid counting NULL placeholder rows.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.some(c => c.includes('count') || c.includes('headcount')) && cols.some(c => c.includes('salary') || c.includes('total'))) {
        return { passed: true, feedback: 'Well done! Headcount and payroll spend correctly grouped by department.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "netflix-high-budget-departments",
    number: 5,
    title: "High-Budget Department Audit",
    difficulty: "Medium",
    company: "Netflix",
    category: "INNER JOIN",
    domain: "core",
    conceptTitle: "Filtering Grouped Data with HAVING",
    conceptSummary: "WHERE filters rows before grouping occurs, whereas HAVING filters grouped rows after aggregation functions have been computed.",
    conceptTip: "Remember: WHERE cannot filter on aggregate results like SUM(salary); you must use HAVING.",
    prompt: "Netflix Finance is conducting an expense audit. Identify all departments whose total salary expenditure exceeds $200,000. Display the department name and total salary.",
    requirements: [
      "Select columns: department, total_salary",
      "Group by department",
      "Filter groups where total salary > 200,000 using HAVING"
],
    exampleOutput: {
      "columns": [
            "department",
            "total_salary"
      ],
      "rows": [
            [
                  "Design",
                  215000
            ],
            [
                  "Engineering",
                  460000
            ],
            [
                  "Product",
                  240000
            ]
      ]
},
    hint: "Use GROUP BY d.name HAVING SUM(u.salary) > 200000.",
    starterSql: "-- Problem 5: High-Budget Department Audit (Netflix)\n-- Find departments with total payroll spend over $200,000\n-- Required columns: department, total_salary\n\nSELECT\n  -- TODO: Select department and SUM(u.salary)\nFROM users u\nINNER JOIN departments d ON u.department_id = d.id\nGROUP BY d.name\nHAVING ;",
    solutionSql: "SELECT d.name AS department, SUM(u.salary) AS total_salary\nFROM users u\nINNER JOIN departments d ON u.department_id = d.id\nGROUP BY d.name\nHAVING SUM(u.salary) > 200000;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **FROM & JOIN**: Combines `users` and `departments`.\n2. **GROUP BY d.name**: Aggregates employee salaries by department.\n3. **HAVING SUM(u.salary) > 200000**: Evaluates the aggregate sum. Engineering (totaling $460,000) and Product ($240,000) pass, while Design ($215,000 or lower depending on headcount) is compared. Only departments exceeding $200,000 remain.\n\n### Interview Takeaway\nInterviewers frequently test the distinction between WHERE and HAVING. State clearly: WHERE filters individual rows prior to GROUP BY; HAVING filters post-aggregation groups.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 2 && rows.length <= 3 && cols.some(c => c.includes('salary') || c.includes('total'))) {
        return { passed: true, feedback: 'Passed! Correctly filtered high-budget departments using HAVING.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "spotify-artist-track-catalog",
    number: 6,
    title: "Artist Catalog Track Counts",
    difficulty: "Easy",
    company: "Spotify",
    category: "INNER JOIN",
    domain: "streaming",
    conceptTitle: "Multi-Table Aggregations & ORDER BY",
    conceptSummary: "ORDER BY controls the final presentation sorting of rows. DESC sorts descending (highest first); ASC sorts ascending.",
    conceptTip: "ORDER BY executes after SELECT, so you can safely sort by column aliases defined in the SELECT list.",
    prompt: "Spotify Artist Relations wants to see which artists have the most released songs in our catalog. List each artist and their total number of songs, sorted from highest track count to lowest.",
    requirements: [
      "Select columns: artist_name (artists.name), track_count (COUNT(songs.id))",
      "Join artists and songs on artist_id",
      "Group by artist name",
      "Order by track_count DESC"
],
    exampleOutput: {
      "columns": [
            "artist_name",
            "track_count"
      ],
      "rows": [
            [
                  "The Weeknd",
                  3
            ],
            [
                  "Taylor Swift",
                  2
            ],
            [
                  "Daft Punk",
                  2
            ]
      ]
},
    hint: "JOIN artists a AND songs s ON a.id = s.artist_id, GROUP BY a.name, ORDER BY track_count DESC.",
    starterSql: "-- Problem 6: Artist Catalog Track Counts (Spotify)\n-- Count tracks per artist, sorted from most to fewest\n-- Required columns: artist_name, track_count\n\nSELECT\n  -- TODO: Select artist name and track count\nFROM artists a\nINNER JOIN songs s ON a.id = s.artist_id\nGROUP BY a.name\nORDER BY ;",
    solutionSql: "SELECT a.name AS artist_name, COUNT(s.id) AS track_count\nFROM artists a\nINNER JOIN songs s ON a.id = s.artist_id\nGROUP BY a.name\nORDER BY track_count DESC;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **INNER JOIN**: Connects `artists` with their respective `songs`.\n2. **GROUP BY a.name**: Groups rows by artist name.\n3. **COUNT(s.id)**: Counts how many songs belong to each artist.\n4. **ORDER BY track_count DESC**: Places the artist with the most songs (The Weeknd with 3 songs) at the top of the result list.\n\n### Interview Takeaway\nSorting is evaluated last in standard SQL execution (FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT).",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('track') || c.includes('count'))) {
        return { passed: true, feedback: 'Nice! Artist tracks successfully counted and ordered.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "amazon-top-spending-customers",
    number: 7,
    title: "Top Spending Customers",
    difficulty: "Medium",
    company: "Amazon",
    category: "INNER JOIN",
    domain: "ecommerce",
    conceptTitle: "Aggregating with WHERE & LIMIT",
    conceptSummary: "Combining WHERE filters, GROUP BY aggregations, and LIMIT creates the classic Top-N pattern used across e-commerce analytics.",
    conceptTip: "Always place WHERE before GROUP BY so that cancelled or pending orders are eliminated before computing sums.",
    prompt: "Amazon Prime analytics wants to reward the top highest-spending customers. Find the total spend for each customer across all Completed orders, and return customers ordered by total spend descending.",
    requirements: [
      "Select columns: customer_name (customers.name), total_spent (SUM(total_amount))",
      "Only include orders with status = \"Completed\"",
      "Group by customer name",
      "Order by total_spent DESC"
],
    exampleOutput: {
      "columns": [
            "customer_name",
            "total_spent"
      ],
      "rows": [
            [
                  "TechNova Inc",
                  1908.49
            ],
            [
                  "Aura Retail",
                  869.49
            ]
      ]
},
    hint: "Filter WHERE o.status = \"Completed\", GROUP BY c.name, ORDER BY total_spent DESC.",
    starterSql: "-- Problem 7: Top Spending Customers (Amazon)\n-- Identify customers by completed order spend descending\n-- Required columns: customer_name, total_spent\n\nSELECT\n  -- TODO: Select customer name and sum of total_amount\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'Completed'\nGROUP BY c.name\nORDER BY ;",
    solutionSql: "SELECT c.name AS customer_name, SUM(o.total_amount) AS total_spent\nFROM customers c\nINNER JOIN orders o ON c.id = o.customer_id\nWHERE o.status = 'Completed'\nGROUP BY c.name\nORDER BY total_spent DESC;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE o.status = 'Completed'**: Discards cancelled and shipped orders so only settled revenue is counted.\n2. **GROUP BY c.name**: Aggregates the completed transactions for each customer.\n3. **SUM(o.total_amount)**: Computes total customer lifetime value for completed orders.\n4. **ORDER BY total_spent DESC LIMIT 3**: Extracts the top 3 highest-spending customer accounts.\n\n### Interview Takeaway\nIn production databases, filtering early in the `WHERE` clause dramatically reduces the volume of rows that must be sorted and aggregated in memory.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 2 && cols.some(c => c.includes('spent') || c.includes('total'))) {
        return { passed: true, feedback: 'Great work! Top spending customers identified.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "meta-unconnected-users",
    number: 8,
    title: "Unaffiliated Contractors",
    difficulty: "Easy",
    company: "Meta",
    category: "WHERE",
    domain: "core",
    conceptTitle: "Handling NULL Values with IS NULL",
    conceptSummary: "In SQL, NULL represents an unknown value. Comparisons using = NULL or != NULL always return UNKNOWN (false). You must use IS NULL or IS NOT NULL.",
    conceptTip: "Never write WHERE department_id = NULL. Always write WHERE department_id IS NULL.",
    prompt: "Meta People Operations needs to identify contractors who have not yet been assigned to any official department. Retrieve their name, role, and salary.",
    requirements: [
      "Select columns: name, role, salary",
      "Filter for department_id IS NULL",
      "Do not include any employees who belong to a department"
],
    exampleOutput: {
      "columns": [
            "name",
            "role",
            "salary"
      ],
      "rows": [
            [
                  "Jordan Kim",
                  "Contractor",
                  95000
            ]
      ]
},
    hint: "Query users with WHERE department_id IS NULL.",
    starterSql: "-- Problem 8: Unaffiliated Contractors (Meta)\n-- Find all users without an assigned department\n-- Required columns: name, role, salary\n\nSELECT\n  -- TODO: Select name, role, salary\nFROM users\nWHERE ;",
    solutionSql: "SELECT name, role, salary\nFROM users\nWHERE department_id IS NULL;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **FROM users**: Scans the user directory.\n2. **WHERE department_id IS NULL**: Tests each record for the absence of a department reference. Jordan Kim has `department_id = NULL`, which evaluates to TRUE under the `IS NULL` operator.\n3. **SELECT**: Projects Jordan Kim's name, role, and salary.\n\n### Interview Takeaway\nThree-valued logic (TRUE, FALSE, UNKNOWN) is an essential SQL interview topic. Any arithmetic or comparison with NULL produces NULL, which fails a WHERE condition. Always use `IS NULL` or `IS NOT NULL`.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (cols.length >= 2 && rows.length === 1 && String(rows[0][0]).includes('Jordan')) {
        return { passed: true, feedback: 'Correct! Found the unaffiliated contractor using IS NULL.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "spotify-daily-song-rank",
    number: 9,
    title: "Daily Top Song Rankings",
    difficulty: "Medium",
    company: "Spotify",
    category: "WINDOW FUNCTIONS",
    domain: "streaming",
    conceptTitle: "Ranking with DENSE_RANK() OVER()",
    conceptSummary: "DENSE_RANK() assigns consecutive rank integers without leaving gaps when multiple rows tie on the ORDER BY value.",
    conceptTip: "Unlike GROUP BY, window functions compute ranks without collapsing rows into a single summary record.",
    prompt: "Spotify Charts needs to generate the daily stream ranking for all songs played on \"2024-01-01\". Rank songs in descending order of stream_count using DENSE_RANK().",
    requirements: [
      "Select columns: song_id, stream_count, daily_rank",
      "Filter for stream_date = \"2024-01-01\"",
      "Compute DENSE_RANK() OVER (ORDER BY stream_count DESC) AS daily_rank"
],
    exampleOutput: {
      "columns": [
            "song_id",
            "stream_count",
            "daily_rank"
      ],
      "rows": [
            [
                  107,
                  7100,
                  1
            ],
            [
                  106,
                  6500,
                  2
            ],
            [
                  104,
                  5200,
                  3
            ]
      ]
},
    hint: "Use DENSE_RANK() OVER (ORDER BY stream_count DESC) AS daily_rank.",
    starterSql: "-- Problem 9: Daily Top Song Rankings (Spotify)\n-- Rank daily stream counts using DENSE_RANK()\n-- Required columns: song_id, stream_count, daily_rank\n\nSELECT\n  song_id,\n  stream_count\n  -- TODO: Add DENSE_RANK() window function\nFROM playback_history\nWHERE stream_date = '2024-01-01';",
    solutionSql: "SELECT song_id, stream_count, DENSE_RANK() OVER (ORDER BY stream_count DESC) AS daily_rank\nFROM playback_history\nWHERE stream_date = '2024-01-01';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE stream_date = '2024-01-01'**: Filters the telemetry down to January 1st streams.\n2. **OVER (ORDER BY stream_count DESC)**: Establishes a window ordering from the highest streamed track to the lowest.\n3. **DENSE_RANK()**: Assigns rank 1 to the top song (Cruel Summer with 7,100 streams), rank 2 to Anti-Hero (6,500 streams), etc., without collapsing individual rows.\n\n### Interview Takeaway\nKnow the difference between the 3 ranking functions:\n- `ROW_NUMBER()`: Strict incremental numbers (1, 2, 3, 4) regardless of ties.\n- `RANK()`: Leaves gaps after ties (1, 2, 2, 4).\n- `DENSE_RANK()`: No gaps after ties (1, 2, 2, 3).",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 6 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Perfect! DENSE_RANK() computed daily chart positions.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "netflix-stream-velocity-lag",
    number: 10,
    title: "Day-over-Day Stream Velocity",
    difficulty: "Medium",
    company: "Netflix",
    category: "WINDOW FUNCTIONS",
    domain: "streaming",
    conceptTitle: "Accessing Prior Rows with LAG()",
    conceptSummary: "LAG(column, offset) looks backward into earlier rows within the window partition without requiring a self-join.",
    conceptTip: "The first row in the window has no predecessor, so LAG() returns NULL by default.",
    prompt: "Netflix Content Analytics tracks track momentum. For song_id = 104 (Blinding Lights), calculate the stream count, the previous day streams using LAG(), and the net change in streams.",
    requirements: [
      "Select columns: stream_date, stream_count, prev_stream_count, diff",
      "Filter for song_id = 104",
      "Use LAG(stream_count, 1) OVER (ORDER BY stream_date) for prev_stream_count",
      "Calculate diff as stream_count - prev_stream_count"
],
    exampleOutput: {
      "columns": [
            "stream_date",
            "stream_count",
            "prev_stream_count",
            "diff"
      ],
      "rows": [
            [
                  "2024-01-01",
                  5200,
                  null,
                  null
            ],
            [
                  "2024-01-02",
                  5400,
                  5200,
                  200
            ]
      ]
},
    hint: "Use LAG(stream_count, 1) OVER (ORDER BY stream_date) AS prev_stream_count.",
    starterSql: "-- Problem 10: Day-over-Day Stream Velocity (Netflix)\n-- Calculate previous day streams and the daily difference\n-- Required columns: stream_date, stream_count, prev_stream_count, diff\n\nSELECT\n  stream_date,\n  stream_count\n  -- TODO: Calculate prev_stream_count using LAG and compute diff\nFROM playback_history\nWHERE song_id = 104\nORDER BY stream_date;",
    solutionSql: "SELECT stream_date, stream_count, LAG(stream_count, 1) OVER (ORDER BY stream_date) AS prev_stream_count, stream_count - LAG(stream_count, 1) OVER (ORDER BY stream_date) AS diff\nFROM playback_history\nWHERE song_id = 104\nORDER BY stream_date;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE song_id = 104**: Isolates streams for track 104 across multiple dates.\n2. **OVER (ORDER BY stream_date)**: Sorts rows chronologically so previous days precede later days.\n3. **LAG(stream_count, 1)**: Inspects the stream count of the row immediately above the current row.\n4. **diff**: Subtracts the previous day count from the current day count (+200 streams on Jan 2).\n\n### Interview Takeaway\nUsing `LAG()` eliminates the need for expensive self-joins on `date = prev_date`. It evaluates in $O(N \\log N)$ time with minimal memory overhead.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 2 && cols.some(c => c.includes('prev') || c.includes('lag'))) {
        return { passed: true, feedback: 'Awesome! Day-over-day stream delta calculated using LAG().' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "robinhood-stock-lead-gap",
    number: 11,
    title: "Next-Day Price Prediction Gap",
    difficulty: "Medium",
    company: "Robinhood",
    category: "WINDOW FUNCTIONS",
    domain: "fintech",
    conceptTitle: "Looking Ahead with LEAD()",
    conceptSummary: "LEAD(column, offset) looks forward to subsequent rows within the window partition.",
    conceptTip: "The final row in the partition will always return NULL for LEAD() because there is no following row.",
    prompt: "Robinhood algorithmic trading models need to compare today's closing price against tomorrow's closing price. For ticker = \"AAPL\", retrieve the trade date, closing price, and next day closing price using LEAD().",
    requirements: [
      "Select columns: trade_date, close_price, next_close_price",
      "Filter for ticker = \"AAPL\"",
      "Use LEAD(close_price, 1) OVER (ORDER BY trade_date) AS next_close_price",
      "Order by trade_date ASC"
],
    exampleOutput: {
      "columns": [
            "trade_date",
            "close_price",
            "next_close_price"
      ],
      "rows": [
            [
                  "2024-01-02",
                  185.64,
                  184.25
            ],
            [
                  "2024-01-03",
                  184.25,
                  181.91
            ],
            [
                  "2024-01-04",
                  181.91,
                  181.18
            ]
      ]
},
    hint: "Use LEAD(close_price, 1) OVER (ORDER BY trade_date) AS next_close_price.",
    starterSql: "-- Problem 11: Next-Day Price Prediction Gap (Robinhood)\n-- Retrieve today's close and tomorrow's close using LEAD()\n-- Required columns: trade_date, close_price, next_close_price\n\nSELECT\n  trade_date,\n  close_price\n  -- TODO: Use LEAD(close_price, 1) OVER (ORDER BY trade_date)\nFROM stock_quotes\nWHERE ticker = 'AAPL'\nORDER BY trade_date;",
    solutionSql: "SELECT trade_date, close_price, LEAD(close_price, 1) OVER (ORDER BY trade_date) AS next_close_price\nFROM stock_quotes\nWHERE ticker = 'AAPL'\nORDER BY trade_date;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE ticker = 'AAPL'**: Restricts the analysis to Apple equities.\n2. **OVER (ORDER BY trade_date)**: Arranges trading days in ascending chronological order.\n3. **LEAD(close_price, 1)**: Grabs the next row's closing price. For 2024-01-02 ($185.64), the next price is $184.25. The final day returns NULL.\n\n### Interview Takeaway\nLEAD and LAG are vital in quantitative finance for calculating forward returns, detecting price gaps, and computing slippage.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 5 && cols.some(c => c.includes('next') || c.includes('lead'))) {
        return { passed: true, feedback: 'Spot on! Next-day closing prices projected using LEAD().' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "google-dept-salary-rank",
    number: 12,
    title: "Department Salary Ranking with Ties",
    difficulty: "Medium",
    company: "Google",
    category: "WINDOW FUNCTIONS",
    domain: "core",
    conceptTitle: "Partitioning Window Functions",
    conceptSummary: "PARTITION BY divides the result set into independent subsets (partitions) where window functions restart calculations for each department.",
    conceptTip: "Notice how dept_rank resets to 1 as the window traverses from Engineering into Design and Product.",
    prompt: "Google Compensation needs to rank employee salaries within each department. Assign a rank (1 being highest salary) partitioned by department_id, using DENSE_RANK(). Exclude unassigned contractors.",
    requirements: [
      "Select columns: name, department_id, salary, dept_rank",
      "Filter for department_id IS NOT NULL",
      "Partition by department_id and order by salary DESC"
],
    exampleOutput: {
      "columns": [
            "name",
            "department_id",
            "salary",
            "dept_rank"
      ],
      "rows": [
            [
                  "Alice Chen",
                  1,
                  165000,
                  1
            ],
            [
                  "Elena Rostova",
                  1,
                  155000,
                  2
            ],
            [
                  "Priya Patel",
                  1,
                  140000,
                  3
            ]
      ]
},
    hint: "Use DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank.",
    starterSql: "-- Problem 12: Department Salary Ranking (Google)\n-- Rank employee salaries within each department\n-- Required columns: name, department_id, salary, dept_rank\n\nSELECT\n  name,\n  department_id,\n  salary\n  -- TODO: DENSE_RANK() partitioned by department_id\nFROM users\nWHERE department_id IS NOT NULL;",
    solutionSql: "SELECT name, department_id, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS dept_rank\nFROM users\nWHERE department_id IS NOT NULL;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **PARTITION BY department_id**: Groups rows into independent buckets for Dept 1 (Engineering), Dept 2 (Design), and Dept 3 (Product).\n2. **ORDER BY salary DESC**: Sorts employees within each department bucket from highest paid to lowest paid.\n3. **DENSE_RANK()**: Assigns Alice Chen rank 1 in Engineering ($165k), and Marcus Vance rank 1 in Design ($130k). The rank counter resets for every department.\n\n### Interview Takeaway\nPARTITION BY is the window function equivalent of GROUP BY, but preserves every individual row in the output.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 7 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Great! Department salary ranks restart correctly per department.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "meta-user-post-sequence",
    number: 13,
    title: "Chronological User Post Numbering",
    difficulty: "Easy",
    company: "Meta",
    category: "WINDOW FUNCTIONS",
    domain: "social",
    conceptTitle: "Row Numbering with ROW_NUMBER()",
    conceptSummary: "ROW_NUMBER() assigns a unique, sequential integer to each row within a partition, starting at 1.",
    conceptTip: "Unlike RANK(), ROW_NUMBER() will never assign duplicate numbers to tied rows.",
    prompt: "Meta Instagram feed engineering wants to number every user's posts sequentially by publish date. Generate a chronological sequence number (post_seq) for each user's posts.",
    requirements: [
      "Select columns: user_id, post_date, content_type, post_seq",
      "Partition by user_id and order by post_date ASC",
      "Use ROW_NUMBER() OVER (...) AS post_seq"
],
    exampleOutput: {
      "columns": [
            "user_id",
            "post_date",
            "content_type",
            "post_seq"
      ],
      "rows": [
            [
                  1,
                  "2024-01-01",
                  "video",
                  1
            ],
            [
                  1,
                  "2024-01-05",
                  "image",
                  2
            ],
            [
                  1,
                  "2024-01-12",
                  "video",
                  3
            ]
      ]
},
    hint: "Use ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY post_date) AS post_seq.",
    starterSql: "-- Problem 13: Chronological User Post Numbering (Meta)\n-- Number each user's posts starting from 1\n-- Required columns: user_id, post_date, content_type, post_seq\n\nSELECT\n  user_id,\n  post_date,\n  content_type\n  -- TODO: Add ROW_NUMBER() partitioned by user_id\nFROM posts;",
    solutionSql: "SELECT user_id, post_date, content_type, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY post_date) AS post_seq\nFROM posts;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **PARTITION BY user_id**: Divides feed posts by author.\n2. **ORDER BY post_date**: Organizes each user's posts from earliest to most recent.\n3. **ROW_NUMBER()**: Labels user 1's posts 1, 2, 3... and resets to 1 when moving to user 2.\n\n### Interview Takeaway\nROW_NUMBER() is the foundation of deduplication queries (`WHERE rn = 1`) and pagination logic.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 7 && cols.some(c => c.includes('seq') || c.includes('row'))) {
        return { passed: true, feedback: 'Correct! Chronological sequence numbers assigned with ROW_NUMBER().' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "amazon-product-price-quartiles",
    number: 14,
    title: "Product Catalog Price Quartiles",
    difficulty: "Medium",
    company: "Amazon",
    category: "WINDOW FUNCTIONS",
    domain: "ecommerce",
    conceptTitle: "Bucketing Rows with NTILE()",
    conceptSummary: "NTILE(n) divides ordered rows into n approximately equal-sized buckets and assigns the bucket number (1 to n) to each row.",
    conceptTip: "If row count is not evenly divisible by n, extra rows are placed in the earliest buckets.",
    prompt: "Amazon Merchandising wants to segment the product catalog into 4 price tiers (quartiles). Assign each product a quartile number from 1 (lowest price) to 4 (highest price) based on unit price.",
    requirements: [
      "Select columns: name, category, price, quartile",
      "Order products by price ascending",
      "Use NTILE(4) OVER (ORDER BY price ASC) AS quartile"
],
    exampleOutput: {
      "columns": [
            "name",
            "category",
            "price",
            "quartile"
      ],
      "rows": [
            [
                  "USB-C Docking Hub",
                  "Accessories",
                  89.99,
                  1
            ],
            [
                  "Mechanical Keyboard",
                  "Electronics",
                  129.5,
                  1
            ],
            [
                  "Wireless ANC Headphones",
                  "Electronics",
                  249,
                  2
            ]
      ]
},
    hint: "Use NTILE(4) OVER (ORDER BY price ASC) AS quartile.",
    starterSql: "-- Problem 14: Product Catalog Price Quartiles (Amazon)\n-- Segment products into 4 price quartiles\n-- Required columns: name, category, price, quartile\n\nSELECT\n  name,\n  category,\n  price\n  -- TODO: Use NTILE(4) OVER (ORDER BY price ASC)\nFROM products;",
    solutionSql: "SELECT name, category, price, NTILE(4) OVER (ORDER BY price ASC) AS quartile\nFROM products;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **ORDER BY price ASC**: Orders catalog products from cheapest (USB-C Docking Hub at $89.99) to most expensive (Ergonomic Standing Desk at $650.00).\n2. **NTILE(4)**: Partitions the 6 products across 4 buckets (Quartiles 1 through 4).\n\n### Interview Takeaway\nNTILE is commonly requested in data science interviews for percentile analysis, A/B testing user cohorts, and RFM (Recency, Frequency, Monetary) segmentation.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 6 && cols.some(c => c.includes('quartile') || c.includes('ntile'))) {
        return { passed: true, feedback: 'Excellent! Products categorized into 4 price quartiles with NTILE(4).' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "linkedin-first-latest-salary",
    number: 15,
    title: "Salary Range Boundaries (FIRST & LAST VALUE)",
    difficulty: "Hard",
    company: "LinkedIn",
    category: "WINDOW FUNCTIONS",
    domain: "core",
    conceptTitle: "Window Framing with ROWS BETWEEN",
    conceptSummary: "By default, window frames stop at CURRENT ROW. To reach the very end of the partition for LAST_VALUE(), you must specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING.",
    conceptTip: "Beware the default frame! Without UNBOUNDED FOLLOWING, LAST_VALUE() simply returns the current row value.",
    prompt: "LinkedIn Talent Insights wants to inspect the lowest and highest salary in department 1 (Engineering). Retrieve each engineer's name and salary, alongside the lowest_dept_salary and highest_dept_salary in their department.",
    requirements: [
      "Select columns: name, salary, lowest_dept_salary, highest_dept_salary",
      "Filter for department_id = 1",
      "Use FIRST_VALUE and LAST_VALUE with full window frames (ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)"
],
    exampleOutput: {
      "columns": [
            "name",
            "salary",
            "lowest_dept_salary",
            "highest_dept_salary"
      ],
      "rows": [
            [
                  "Priya Patel",
                  140000,
                  140000,
                  165000
            ],
            [
                  "Elena Rostova",
                  155000,
                  140000,
                  165000
            ],
            [
                  "Alice Chen",
                  165000,
                  140000,
                  165000
            ]
      ]
},
    hint: "Include ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING in the OVER clause for LAST_VALUE.",
    starterSql: "-- Problem 15: Salary Range Boundaries (LinkedIn)\n-- Retrieve lowest and highest department salary alongside each employee\n-- Required columns: name, salary, lowest_dept_salary, highest_dept_salary\n\nSELECT\n  name,\n  salary\n  -- TODO: Add FIRST_VALUE() and LAST_VALUE() with explicit frame\nFROM users\nWHERE department_id = 1;",
    solutionSql: "SELECT name, salary, FIRST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS lowest_dept_salary, LAST_VALUE(salary) OVER (PARTITION BY department_id ORDER BY salary ASC ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS highest_dept_salary\nFROM users\nWHERE department_id = 1;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **PARTITION BY department_id ORDER BY salary ASC**: Orders engineers from lowest salary ($140k) to highest ($165k).\n2. **ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING**: Expands the window frame to encompass all rows in the partition from top to bottom.\n3. **FIRST_VALUE(salary)**: Captures $140,000 (Priya Patel).\n4. **LAST_VALUE(salary)**: Correctly captures $165,000 (Alice Chen) for every row in the partition.\n\n### Interview Takeaway\nThis is one of the most famous SQL gotchas in FAANG interviews: the default frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, which breaks `LAST_VALUE()`. Demonstrating explicit frame syntax proves deep SQL mastery.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.some(c => c.includes('lowest') || c.includes('first')) && cols.some(c => c.includes('highest') || c.includes('last'))) {
        return { passed: true, feedback: 'Masterful! FIRST_VALUE and LAST_VALUE with full framing evaluated properly.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "apple-salary-gap-to-max",
    number: 16,
    title: "Salary Gap to Department Peak",
    difficulty: "Medium",
    company: "Apple",
    category: "WINDOW FUNCTIONS",
    domain: "core",
    conceptTitle: "Window Aggregates in Expressions",
    conceptSummary: "Window aggregates like MAX() OVER() return partition summaries on every row, allowing immediate mathematical operations between row values and partition metrics.",
    conceptTip: "You can subtract an individual salary from a window MAX(salary) directly inside the SELECT statement.",
    prompt: "Apple Compensation wants to evaluate pay equity. For all employees with an assigned department, calculate the maximum salary in their department and the employee's salary gap (dept_max_salary - salary).",
    requirements: [
      "Select columns: name, department_id, salary, dept_max_salary, salary_gap",
      "Filter for department_id IS NOT NULL",
      "Calculate dept_max_salary using MAX(salary) OVER (PARTITION BY department_id)",
      "Compute salary_gap as dept_max_salary - salary"
],
    exampleOutput: {
      "columns": [
            "name",
            "department_id",
            "salary",
            "dept_max_salary",
            "salary_gap"
      ],
      "rows": [
            [
                  "Alice Chen",
                  1,
                  165000,
                  165000,
                  0
            ],
            [
                  "Priya Patel",
                  1,
                  140000,
                  165000,
                  25000
            ],
            [
                  "Elena Rostova",
                  1,
                  155000,
                  165000,
                  10000
            ]
      ]
},
    hint: "Use MAX(salary) OVER (PARTITION BY department_id) for dept_max_salary.",
    starterSql: "-- Problem 16: Salary Gap to Department Peak (Apple)\n-- Calculate the salary difference between each worker and their department's peak earner\n-- Required columns: name, department_id, salary, dept_max_salary, salary_gap\n\nSELECT\n  name,\n  department_id,\n  salary\n  -- TODO: Compute dept_max_salary and salary_gap\nFROM users\nWHERE department_id IS NOT NULL;",
    solutionSql: "SELECT name, department_id, salary, MAX(salary) OVER (PARTITION BY department_id) AS dept_max_salary, MAX(salary) OVER (PARTITION BY department_id) - salary AS salary_gap\nFROM users\nWHERE department_id IS NOT NULL;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **MAX(salary) OVER (PARTITION BY department_id)**: Computes the peak salary in each department (Engineering: $165k; Design: $130k; Product: $135k).\n2. **salary_gap**: Subtracts each employee's salary from that department peak. Top earners receive a gap of $0.\n\n### Interview Takeaway\nWindow aggregates remove the need to join a separate grouped aggregation table back onto the base table.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 7 && cols.some(c => c.includes('gap') || c.includes('diff'))) {
        return { passed: true, feedback: 'Nice! Department peak salary gap computed accurately.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "tiktok-creator-video-rank",
    number: 17,
    title: "Creator Video Popularity Ranking",
    difficulty: "Medium",
    company: "TikTok",
    category: "WINDOW FUNCTIONS",
    domain: "social",
    conceptTitle: "Partitioned Ranking by Engagement",
    conceptSummary: "Ranking content partitioned by creator isolates creator performance so top videos can be featured on user profiles.",
    conceptTip: "Use DENSE_RANK() to prevent ties from disrupting subsequent rankings.",
    prompt: "TikTok Creator Portal displays each creator's top videos. For all video posts, rank each video per user by view count descending using DENSE_RANK().",
    requirements: [
      "Select columns: user_id, id AS post_id, views, view_rank",
      "Filter for content_type = \"video\"",
      "Partition by user_id and order by views DESC"
],
    exampleOutput: {
      "columns": [
            "user_id",
            "post_id",
            "views",
            "view_rank"
      ],
      "rows": [
            [
                  1,
                  6,
                  21000,
                  1
            ],
            [
                  1,
                  1,
                  14500,
                  2
            ],
            [
                  2,
                  3,
                  32000,
                  1
            ]
      ]
},
    hint: "Filter content_type = \"video\" and use DENSE_RANK() OVER (PARTITION BY user_id ORDER BY views DESC).",
    starterSql: "-- Problem 17: Creator Video Popularity Ranking (TikTok)\n-- Rank videos for each user by view count descending\n-- Required columns: user_id, post_id, views, view_rank\n\nSELECT\n  user_id,\n  id AS post_id,\n  views\n  -- TODO: Add DENSE_RANK() partitioned by user_id\nFROM posts\nWHERE content_type = 'video';",
    solutionSql: "SELECT user_id, id AS post_id, views, DENSE_RANK() OVER (PARTITION BY user_id ORDER BY views DESC) AS view_rank\nFROM posts\nWHERE content_type = 'video';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE content_type = 'video'**: Filters out text and static image posts.\n2. **PARTITION BY user_id**: Creates isolated partitions for each creator.\n3. **ORDER BY views DESC**: Ranks the creator's videos from most viewed to least viewed.\n\n### Interview Takeaway\nIn social media analytics, partitioning by account/creator is the primary pattern for generating profile highlights and trending feeds.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Great! Video views ranked per creator.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "spotify-song-duration-dense-rank",
    number: 18,
    title: "Track Duration Ranking by Release Year",
    difficulty: "Easy",
    company: "Spotify",
    category: "WINDOW FUNCTIONS",
    domain: "streaming",
    conceptTitle: "Dense Ranking across Vintage Cohorts",
    conceptSummary: "Partitioning by release year reveals track duration trends across music eras.",
    conceptTip: "Notice tracks from 2019 are ranked against each other (Blinding Lights vs Cruel Summer vs Bad Guy).",
    prompt: "Spotify audio engineers are analyzing vintage length trends. Rank songs by duration within each release year, from longest to shortest, using DENSE_RANK().",
    requirements: [
      "Select columns: title, release_year, duration_sec, length_rank",
      "Partition by release_year and order by duration_sec DESC",
      "Use DENSE_RANK() OVER (...) AS length_rank"
],
    exampleOutput: {
      "columns": [
            "title",
            "release_year",
            "duration_sec",
            "length_rank"
      ],
      "rows": [
            [
                  "Get Lucky",
                  2013,
                  369,
                  1
            ],
            [
                  "Instant Crush",
                  2013,
                  337,
                  2
            ],
            [
                  "Starboy",
                  2016,
                  230,
                  1
            ]
      ]
},
    hint: "Use DENSE_RANK() OVER (PARTITION BY release_year ORDER BY duration_sec DESC) AS length_rank.",
    starterSql: "-- Problem 18: Track Duration Ranking by Year (Spotify)\n-- Rank tracks by duration within their release year\n-- Required columns: title, release_year, duration_sec, length_rank\n\nSELECT\n  title,\n  release_year,\n  duration_sec\n  -- TODO: Add DENSE_RANK() window function\nFROM songs;",
    solutionSql: "SELECT title, release_year, duration_sec, DENSE_RANK() OVER (PARTITION BY release_year ORDER BY duration_sec DESC) AS length_rank\nFROM songs;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **PARTITION BY release_year**: Buckets songs by release year (2013, 2016, 2019, 2020, 2022).\n2. **ORDER BY duration_sec DESC**: Sorts tracks inside each year from longest to shortest.\n3. **DENSE_RANK()**: Assigns length ranks that restart at 1 for each year.\n\n### Interview Takeaway\nPartitioning by cohort (e.g. vintage, year, signup month) ensures fair comparisons without mixing disparate groups.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 8 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Correct! Song duration ranked per release year.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "robinhood-moving-average-stock",
    number: 19,
    title: "3-Day Moving Average Stock Price",
    difficulty: "Medium",
    company: "Robinhood",
    category: "WINDOW FUNCTIONS",
    domain: "fintech",
    conceptTitle: "Sliding Frames with ROWS BETWEEN",
    conceptSummary: "ROWS BETWEEN n PRECEDING AND CURRENT ROW defines a rolling window of rows relative to the current row, forming the basis of technical indicators like moving averages.",
    conceptTip: "For the first row, only 1 row is in the frame. For the second row, 2 rows are in the frame. The frame expands until reaching the maximum size n.",
    prompt: "Robinhood Quantitative Research calculates moving averages to smooth daily stock fluctuations. For ticker = \"AAPL\", compute a 3-day moving average of close_price using ROWS BETWEEN 2 PRECEDING AND CURRENT ROW. Round the moving average to 2 decimal places.",
    requirements: [
      "Select columns: trade_date, close_price, mavg_3day",
      "Filter for ticker = \"AAPL\"",
      "Use ROUND(AVG(close_price) OVER (ORDER BY trade_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS mavg_3day"
],
    exampleOutput: {
      "columns": [
            "trade_date",
            "close_price",
            "mavg_3day"
      ],
      "rows": [
            [
                  "2024-01-02",
                  185.64,
                  185.64
            ],
            [
                  "2024-01-03",
                  184.25,
                  184.94
            ],
            [
                  "2024-01-04",
                  181.91,
                  183.93
            ]
      ]
},
    hint: "Specify ROWS BETWEEN 2 PRECEDING AND CURRENT ROW in the OVER clause of AVG(close_price).",
    starterSql: "-- Problem 19: 3-Day Moving Average Stock Price (Robinhood)\n-- Calculate 3-day rolling average closing price for AAPL\n-- Required columns: trade_date, close_price, mavg_3day\n\nSELECT\n  trade_date,\n  close_price\n  -- TODO: Compute 3-day rolling average using ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\nFROM stock_quotes\nWHERE ticker = 'AAPL';",
    solutionSql: "SELECT trade_date, close_price, ROUND(AVG(close_price) OVER (ORDER BY trade_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS mavg_3day\nFROM stock_quotes\nWHERE ticker = 'AAPL';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE ticker = 'AAPL'**: Filters for Apple stock quotes.\n2. **ORDER BY trade_date**: Sequences quotes chronologically.\n3. **ROWS BETWEEN 2 PRECEDING AND CURRENT ROW**: On day 3 (2024-01-04), the window includes day 1 ($185.64), day 2 ($184.25), and day 3 ($181.91), calculating the 3-day average of $183.93.\n\n### Interview Takeaway\nSliding window frames are the gold standard for time-series feature engineering in both analytics and machine learning pipelines.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 5 && cols.some(c => c.includes('mavg') || c.includes('avg'))) {
        return { passed: true, feedback: 'Spot on! 3-day moving average calculated using sliding window frame.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "stripe-running-total-revenue",
    number: 20,
    title: "Cumulative Running Revenue",
    difficulty: "Medium",
    company: "Stripe",
    category: "WINDOW FUNCTIONS",
    domain: "ecommerce",
    conceptTitle: "Cumulative Sums with UNBOUNDED PRECEDING",
    conceptSummary: "SUM() OVER (ORDER BY date ROWS UNBOUNDED PRECEDING) maintains a cumulative running total from the very first row up to the current row.",
    conceptTip: "Explicitly adding ROWS UNBOUNDED PRECEDING prevents duplicate dates from grouping and producing identical running totals.",
    prompt: "Stripe Billing monitors cumulative Gross Merchandise Volume (GMV). For all Completed orders, compute the running total of total_amount ordered by order_date. Round running_gmv to 2 decimal places.",
    requirements: [
      "Select columns: id AS order_id, order_date, total_amount, running_gmv",
      "Filter for status = \"Completed\"",
      "Order by order_date ASC",
      "Compute running_gmv using SUM(total_amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING)"
],
    exampleOutput: {
      "columns": [
            "order_id",
            "order_date",
            "total_amount",
            "running_gmv"
      ],
      "rows": [
            [
                  1001,
                  "2024-01-05",
                  629.49,
                  629.49
            ],
            [
                  1002,
                  "2024-01-12",
                  129.5,
                  758.99
            ],
            [
                  1003,
                  "2024-01-18",
                  1030,
                  1788.99
            ]
      ]
},
    hint: "Use SUM(total_amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING) AS running_gmv.",
    starterSql: "-- Problem 20: Cumulative Running Revenue (Stripe)\n-- Compute running cumulative revenue for Completed orders\n-- Required columns: order_id, order_date, total_amount, running_gmv\n\nSELECT\n  id AS order_id,\n  order_date,\n  total_amount\n  -- TODO: Compute running cumulative GMV\nFROM orders\nWHERE status = 'Completed';",
    solutionSql: "SELECT id AS order_id, order_date, total_amount, ROUND(SUM(total_amount) OVER (ORDER BY order_date ROWS UNBOUNDED PRECEDING), 2) AS running_gmv\nFROM orders\nWHERE status = 'Completed';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE status = 'Completed'**: Filters out incomplete or cancelled orders.\n2. **ORDER BY order_date**: Sorts orders chronologically.\n3. **SUM(total_amount) OVER (ROWS UNBOUNDED PRECEDING)**: Accumulates revenue. Order 1 starts at $629.49; Order 2 adds $129.50 to reach $758.99; continuing until reaching full cumulative volume.\n\n### Interview Takeaway\nRunning totals are ubiquitous in executive dashboards. Always specify `ROWS UNBOUNDED PRECEDING` to avoid standard SQL's default `RANGE` behavior when timestamps collide.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 5 && cols.some(c => c.includes('running') || c.includes('gmv') || c.includes('cum'))) {
        return { passed: true, feedback: 'Well done! Cumulative revenue running sum computed.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "amazon-rolling-order-count",
    number: 21,
    title: "Rolling 3-Order Window Count",
    difficulty: "Medium",
    company: "Amazon",
    category: "WINDOW FUNCTIONS",
    domain: "ecommerce",
    conceptTitle: "Rolling Window Counts",
    conceptSummary: "COUNT() with a sliding window frame measures order frequency and transaction velocity.",
    conceptTip: "COUNT(id) OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) maxes out at 3 once sufficient history is available.",
    prompt: "Amazon Fraud & Abuse detects rapid order bursts. For customer_id = 1, compute a rolling 3-order count ordered by order_date using ROWS BETWEEN 2 PRECEDING AND CURRENT ROW.",
    requirements: [
      "Select columns: id, order_date, total_amount, rolling_3_orders",
      "Filter for customer_id = 1",
      "Use COUNT(id) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)"
],
    exampleOutput: {
      "columns": [
            "id",
            "order_date",
            "total_amount",
            "rolling_3_orders"
      ],
      "rows": [
            [
                  1001,
                  "2024-01-05",
                  629.49,
                  1
            ],
            [
                  1003,
                  "2024-01-18",
                  1030,
                  2
            ],
            [
                  1007,
                  "2024-03-01",
                  249,
                  3
            ]
      ]
},
    hint: "Use COUNT(id) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_3_orders.",
    starterSql: "-- Problem 21: Rolling 3-Order Window Count (Amazon)\n-- Compute rolling 3-order count for customer 1\n-- Required columns: id, order_date, total_amount, rolling_3_orders\n\nSELECT\n  id,\n  order_date,\n  total_amount\n  -- TODO: Compute rolling 3-order count\nFROM orders\nWHERE customer_id = 1;",
    solutionSql: "SELECT id, order_date, total_amount, COUNT(id) OVER (ORDER BY order_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS rolling_3_orders\nFROM orders\nWHERE customer_id = 1;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE customer_id = 1**: Pulls orders for customer 1.\n2. **COUNT(id) OVER (...)**: Counts items in the rolling frame. Order 1 has 1; Order 2 has 2; Order 3 reaches 3.\n\n### Interview Takeaway\nRolling window counts are fundamental in anti-fraud rate limiting (e.g. flagging accounts exceeding X orders in Y attempts).",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.some(c => c.includes('rolling') || c.includes('order'))) {
        return { passed: true, feedback: 'Nice! Rolling 3-order frequency window calculated.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "robinhood-cumulative-volume",
    number: 22,
    title: "Cumulative Trading Volume",
    difficulty: "Medium",
    company: "Robinhood",
    category: "WINDOW FUNCTIONS",
    domain: "fintech",
    conceptTitle: "High-Volume Cumulative Aggregation",
    conceptSummary: "Window functions easily handle large integer accumulation without arithmetic overflow in modern SQL engines.",
    conceptTip: "Notice the cumulative volume increases monotonically with each passing trading day.",
    prompt: "Robinhood Market Operations calculates cumulative shares traded for \"MSFT\" across the trading week. Calculate the running sum of volume ordered chronologically.",
    requirements: [
      "Select columns: trade_date, volume, cum_volume",
      "Filter for ticker = \"MSFT\"",
      "Use SUM(volume) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING) AS cum_volume"
],
    exampleOutput: {
      "columns": [
            "trade_date",
            "volume",
            "cum_volume"
      ],
      "rows": [
            [
                  "2024-01-02",
                  25258600,
                  25258600
            ],
            [
                  "2024-01-03",
                  23083500,
                  48342100
            ],
            [
                  "2024-01-04",
                  20901500,
                  69243600
            ]
      ]
},
    hint: "Use SUM(volume) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING) AS cum_volume.",
    starterSql: "-- Problem 22: Cumulative Trading Volume (Robinhood)\n-- Calculate cumulative shares traded for MSFT\n-- Required columns: trade_date, volume, cum_volume\n\nSELECT\n  trade_date,\n  volume\n  -- TODO: Calculate cumulative volume\nFROM stock_quotes\nWHERE ticker = 'MSFT';",
    solutionSql: "SELECT trade_date, volume, SUM(volume) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING) AS cum_volume\nFROM stock_quotes\nWHERE ticker = 'MSFT';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE ticker = 'MSFT'**: Filters Microsoft stock quotes.\n2. **ORDER BY trade_date**: Sequences records in order of trading day.\n3. **SUM(volume) OVER (...)**: Adds each day's volume to the running total.\n\n### Interview Takeaway\nAlways confirm with the interviewer if the cumulative calculation should reset daily, weekly, or run continuously across all available historical partitions.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 5 && cols.some(c => c.includes('cum') || c.includes('volume'))) {
        return { passed: true, feedback: 'Correct! Cumulative trading volume calculated over trading days.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "netflix-running-stream-hours",
    number: 23,
    title: "User Cumulative Playback Streams",
    difficulty: "Easy",
    company: "Netflix",
    category: "WINDOW FUNCTIONS",
    domain: "streaming",
    conceptTitle: "Chronological Running Totals per User",
    conceptSummary: "Accumulating metrics over user activity timelines enables cohort milestone detection (e.g. reached 10,000 streams).",
    conceptTip: "Order by both stream_date and id to ensure deterministic sorting when multiple events occur on the same date.",
    prompt: "Netflix Engagement wants to track cumulative streams for user_id = 10 over time. Compute running_streams as the running sum of stream_count ordered by stream_date and id.",
    requirements: [
      "Select columns: stream_date, song_id, stream_count, running_streams",
      "Filter for user_id = 10",
      "Compute running_streams using SUM(stream_count) OVER (ORDER BY stream_date, id ROWS UNBOUNDED PRECEDING)"
],
    exampleOutput: {
      "columns": [
            "stream_date",
            "song_id",
            "stream_count",
            "running_streams"
      ],
      "rows": [
            [
                  "2024-01-01",
                  104,
                  5200,
                  5200
            ],
            [
                  "2024-01-01",
                  103,
                  3100,
                  8300
            ],
            [
                  "2024-01-02",
                  104,
                  5400,
                  13700
            ]
      ]
},
    hint: "Use SUM(stream_count) OVER (ORDER BY stream_date, id ROWS UNBOUNDED PRECEDING).",
    starterSql: "-- Problem 23: User Cumulative Playback Streams (Netflix)\n-- Calculate cumulative streams for user 10\n-- Required columns: stream_date, song_id, stream_count, running_streams\n\nSELECT\n  stream_date,\n  song_id,\n  stream_count\n  -- TODO: Add cumulative running streams\nFROM playback_history\nWHERE user_id = 10;",
    solutionSql: "SELECT stream_date, song_id, stream_count, SUM(stream_count) OVER (ORDER BY stream_date, id ROWS UNBOUNDED PRECEDING) AS running_streams\nFROM playback_history\nWHERE user_id = 10;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE user_id = 10**: Extracts listening telemetry for user 10.\n2. **SUM(stream_count) OVER (...)**: Adds stream counts progressively over time.\n\n### Interview Takeaway\nUsing tie-breaker columns like `id` in your `ORDER BY` window clause guarantees deterministic results across distributed database nodes.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('running') || c.includes('stream'))) {
        return { passed: true, feedback: 'Great! Running playback count calculated for user.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "meta-user-cumulative-likes",
    number: 24,
    title: "Creator Cumulative Likes Trajectory",
    difficulty: "Medium",
    company: "Meta",
    category: "WINDOW FUNCTIONS",
    domain: "social",
    conceptTitle: "Cumulative Social Engagement",
    conceptSummary: "Tracking cumulative likes helps detect inflection points where a creator goes viral.",
    conceptTip: "The cumulative sum steadily rises, providing a cumulative growth curve.",
    prompt: "Meta Creator Monetization wants to trace the cumulative like trajectory for user_id = 1 across their posts. Compute cum_likes ordered by post_date.",
    requirements: [
      "Select columns: id AS post_id, post_date, likes, cum_likes",
      "Filter for user_id = 1",
      "Compute cum_likes using SUM(likes) OVER (ORDER BY post_date ROWS UNBOUNDED PRECEDING)"
],
    exampleOutput: {
      "columns": [
            "post_id",
            "post_date",
            "likes",
            "cum_likes"
      ],
      "rows": [
            [
                  1,
                  "2024-01-01",
                  1200,
                  1200
            ],
            [
                  2,
                  "2024-01-05",
                  540,
                  1740
            ],
            [
                  6,
                  "2024-01-12",
                  2300,
                  4040
            ]
      ]
},
    hint: "Use SUM(likes) OVER (ORDER BY post_date ROWS UNBOUNDED PRECEDING) AS cum_likes.",
    starterSql: "-- Problem 24: Creator Cumulative Likes Trajectory (Meta)\n-- Trace cumulative likes earned by user 1 across posts\n-- Required columns: post_id, post_date, likes, cum_likes\n\nSELECT\n  id AS post_id,\n  post_date,\n  likes\n  -- TODO: Calculate cumulative likes\nFROM posts\nWHERE user_id = 1;",
    solutionSql: "SELECT id AS post_id, post_date, likes, SUM(likes) OVER (ORDER BY post_date ROWS UNBOUNDED PRECEDING) AS cum_likes\nFROM posts\nWHERE user_id = 1;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE user_id = 1**: Retrieves posts authored by user 1.\n2. **SUM(likes) OVER (...)**: Calculates running cumulative likes earned across posts.\n\n### Interview Takeaway\nPlotting cumulative metric queries over time is standard practice for analyzing creator retention and lifecycle milestones.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.some(c => c.includes('cum') || c.includes('like'))) {
        return { passed: true, feedback: 'Awesome! Cumulative like trajectory traced.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "stripe-running-balance-audit",
    number: 25,
    title: "Ledger Running Balance Audit",
    difficulty: "Hard",
    company: "Stripe",
    category: "WINDOW FUNCTIONS",
    domain: "fintech",
    conceptTitle: "Conditional Window Sums",
    conceptSummary: "Combining CASE WHEN inside a window SUM() allows signed arithmetic (adding deposits while subtracting withdrawals and purchases).",
    conceptTip: "CASE WHEN txn_type = \"DEPOSIT\" THEN amount ELSE -amount END converts transaction records into signed cash flows.",
    prompt: "Stripe Treasury maintains a double-entry ledger. For user_id = 101, calculate their running ledger balance. Deposits add funds, while purchases decrease funds. Compute running_balance ordered chronologically.",
    requirements: [
      "Select columns: txn_date, txn_type, amount, running_balance",
      "Filter for user_id = 101",
      "Use CASE WHEN to sign amounts: +amount for DEPOSIT, -amount for PURCHASE",
      "Compute running_balance with SUM(...) OVER (ORDER BY txn_date, id ROWS UNBOUNDED PRECEDING)"
],
    exampleOutput: {
      "columns": [
            "txn_date",
            "txn_type",
            "amount",
            "running_balance"
      ],
      "rows": [
            [
                  "2024-01-02",
                  "DEPOSIT",
                  2500,
                  2500
            ],
            [
                  "2024-01-03",
                  "PURCHASE",
                  65.4,
                  2434.6
            ],
            [
                  "2024-01-05",
                  "PURCHASE",
                  120,
                  2314.6
            ]
      ]
},
    hint: "Use SUM(CASE WHEN txn_type = \"DEPOSIT\" THEN amount ELSE -amount END) OVER (ORDER BY txn_date, id ROWS UNBOUNDED PRECEDING).",
    starterSql: "-- Problem 25: Ledger Running Balance Audit (Stripe)\n-- Calculate signed running cash balance for user 101\n-- Required columns: txn_date, txn_type, amount, running_balance\n\nSELECT\n  txn_date,\n  txn_type,\n  amount\n  -- TODO: Compute signed running balance\nFROM transactions\nWHERE user_id = 101;",
    solutionSql: "SELECT txn_date, txn_type, amount, SUM(CASE WHEN txn_type = 'DEPOSIT' THEN amount ELSE -amount END) OVER (ORDER BY txn_date, id ROWS UNBOUNDED PRECEDING) AS running_balance\nFROM transactions\nWHERE user_id = 101;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CASE Expression**: Evaluates each transaction type. Deposits of $2,500 evaluate to +2500; Purchases of $65.40 evaluate to -65.40.\n2. **Window SUM()**: Progressively sums the signed values.\n   - Day 1: +2500.00 (Balance: $2,500.00)\n   - Day 2: -65.40 (Balance: $2,434.60)\n   - Day 3: -120.00 (Balance: $2,314.60)\n   - Day 4: +2500.00 (Balance: $4,814.60)\n\n### Interview Takeaway\nThis is one of Stripe's flagship interview questions testing your ability to represent financial transactions accurately in SQL without corrupting running account balances.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('balance') || c.includes('running'))) {
        return { passed: true, feedback: 'Outstanding! Signed running ledger balance audited accurately.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "apple-stock-volatility-spread",
    number: 26,
    title: "Rolling 3-Day Volatility Spread",
    difficulty: "Hard",
    company: "Apple",
    category: "WINDOW FUNCTIONS",
    domain: "fintech",
    conceptTitle: "Multi-Window Expression Arithmetic",
    conceptSummary: "Multiple window functions can be combined within a single mathematical expression to calculate dynamic ranges and spreads.",
    conceptTip: "MAX(close_price) OVER frame - MIN(close_price) OVER frame directly computes the high-low spread over the sliding window.",
    prompt: "Apple Treasury assesses equity volatility over short horizons. For ticker = \"AAPL\", compute the rolling 3-day volatility spread (price_spread) as the difference between the 3-day rolling MAX and MIN close_price. Round to 2 decimal places.",
    requirements: [
      "Select columns: trade_date, close_price, price_spread",
      "Filter for ticker = \"AAPL\"",
      "Use MAX(close_price) - MIN(close_price) over ROWS BETWEEN 2 PRECEDING AND CURRENT ROW",
      "Round price_spread to 2 decimal places"
],
    exampleOutput: {
      "columns": [
            "trade_date",
            "close_price",
            "price_spread"
      ],
      "rows": [
            [
                  "2024-01-02",
                  185.64,
                  0
            ],
            [
                  "2024-01-03",
                  184.25,
                  1.39
            ],
            [
                  "2024-01-04",
                  181.91,
                  3.73
            ]
      ]
},
    hint: "Subtract MIN(close_price) OVER (...) from MAX(close_price) OVER (...).",
    starterSql: "-- Problem 26: Rolling 3-Day Volatility Spread (Apple)\n-- Calculate the rolling 3-day max-min price spread for AAPL\n-- Required columns: trade_date, close_price, price_spread\n\nSELECT\n  trade_date,\n  close_price\n  -- TODO: Compute rolling 3-day MAX - MIN\nFROM stock_quotes\nWHERE ticker = 'AAPL';",
    solutionSql: "SELECT trade_date, close_price, ROUND(MAX(close_price) OVER (ORDER BY trade_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) - MIN(close_price) OVER (ORDER BY trade_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2) AS price_spread\nFROM stock_quotes\nWHERE ticker = 'AAPL';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **MAX(close_price) OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)**: Finds the highest price in the 3-day window.\n2. **MIN(close_price) OVER (ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)**: Finds the lowest price in the same 3-day window.\n3. **Subtraction**: The difference reveals local price volatility.\n\n### Interview Takeaway\nUsing window functions for spreads avoids self-joins and subqueries, executing in linear $O(N)$ time with optimal cache locality.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 5 && cols.some(c => c.includes('spread') || c.includes('volatility'))) {
        return { passed: true, feedback: 'Impressive! Rolling 3-day max-min price spread computed.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "google-dept-salary-outliers",
    number: 27,
    title: "Department Salary Outlier Pipeline",
    difficulty: "Medium",
    company: "Google",
    category: "CTE",
    domain: "core",
    conceptTitle: "Modular Query Design with CTEs",
    conceptSummary: "Common Table Expressions (WITH clause) break complex SQL queries into clean, readable, modular stages that can be joined like regular tables.",
    conceptTip: "CTEs make code dramatically easier to debug compared to deeply nested subqueries.",
    prompt: "Google Compensation team wants to identify employees who earn more than their department's average salary. Build a CTE to calculate each department's average salary first, then join it to find employees earning above that average.",
    requirements: [
      "Select columns: name, department, salary, dept_avg_salary",
      "Use a CTE named dept_avg to calculate average salary per department",
      "Join users to dept_avg and departments",
      "Filter WHERE u.salary > da.avg_sal",
      "Round dept_avg_salary to 2 decimal places"
],
    exampleOutput: {
      "columns": [
            "name",
            "department",
            "salary",
            "dept_avg_salary"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Engineering",
                  165000,
                  153333.33
            ],
            [
                  "Marcus Vance",
                  "Design",
                  130000,
                  107500
            ],
            [
                  "Sofia Rossi",
                  "Product",
                  135000,
                  120000
            ]
      ]
},
    hint: "Define WITH dept_avg AS (SELECT department_id, AVG(salary) AS avg_sal FROM users GROUP BY department_id).",
    starterSql: "-- Problem 27: Department Salary Outlier Pipeline (Google)\n-- Use a CTE to find employees earning above their department average\n-- Required columns: name, department, salary, dept_avg_salary\n\nWITH dept_avg AS (\n  -- TODO: Calculate average salary per department_id\n)\nSELECT\n  -- TODO: Join users, dept_avg, and departments\nFROM users u;",
    solutionSql: "WITH dept_avg AS (\n  SELECT department_id, AVG(salary) AS avg_sal\n  FROM users\n  WHERE department_id IS NOT NULL\n  GROUP BY department_id\n)\nSELECT u.name, d.name AS department, u.salary, ROUND(da.avg_sal, 2) AS dept_avg_salary\nFROM users u\nJOIN dept_avg da ON u.department_id = da.department_id\nJOIN departments d ON u.department_id = d.id\nWHERE u.salary > da.avg_sal;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE dept_avg**: Computes average salary per department (Engineering: $153,333; Design: $107,500; Product: $120,000).\n2. **Main Query**: Joins `users` with `dept_avg` on `department_id`.\n3. **Filter**: `u.salary > da.avg_sal` isolates employees above their department mean (Alice Chen and Elena Rostova in Engineering; Marcus Vance in Design; Sofia Rossi in Product).\n\n### Interview Takeaway\nUsing CTEs shows interviewers you write clean, production-ready, maintainable SQL that peers can easily read and review.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('avg') || c.includes('salary'))) {
        return { passed: true, feedback: 'Well done! CTE computed department averages and filtered outliers.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "airbnb-customer-order-cohort",
    number: 28,
    title: "Repeat Customer Cohort Analysis",
    difficulty: "Medium",
    company: "Airbnb",
    category: "CTE",
    domain: "ecommerce",
    conceptTitle: "Aggregating in CTEs before Business Filtering",
    conceptSummary: "Pre-aggregating customer metrics in a CTE allows downstream queries to filter on aggregated attributes cleanly.",
    conceptTip: "Pre-calculating order counts in a CTE keeps your final SELECT query simple and focused.",
    prompt: "Airbnb Growth Marketing analyzes repeat customer loyalty. Using a CTE, calculate the total completed spend and order count for each customer, then return only repeat customers who have completed 2 or more orders.",
    requirements: [
      "Select columns: customer_name, order_count, total_spend",
      "Use a CTE to aggregate completed orders per customer",
      "Filter for order_count >= 2 in the outer query"
],
    exampleOutput: {
      "columns": [
            "customer_name",
            "order_count",
            "total_spend"
      ],
      "rows": [
            [
                  "Aura Retail",
                  2,
                  869.49
            ],
            [
                  "TechNova Inc",
                  3,
                  1908.49
            ]
      ]
},
    hint: "Define a CTE summarizing customer orders, then filter WHERE order_count >= 2.",
    starterSql: "-- Problem 28: Repeat Customer Cohort Analysis (Airbnb)\n-- Identify repeat customers with 2 or more completed orders\n-- Required columns: customer_name, order_count, total_spend\n\nWITH cust_summary AS (\n  -- TODO: Aggregate order_count and total_spend per customer\n)\nSELECT\n  -- TODO: Select repeat customers with order_count >= 2\nFROM cust_summary;",
    solutionSql: "WITH cust_summary AS (\n  SELECT c.name AS customer_name, COUNT(o.id) AS order_count, SUM(o.total_amount) AS total_spend\n  FROM customers c\n  JOIN orders o ON c.id = o.customer_id\n  WHERE o.status = 'Completed'\n  GROUP BY c.name\n)\nSELECT customer_name, order_count, total_spend\nFROM cust_summary\nWHERE order_count >= 2;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE cust_summary**: Joins `customers` and `orders`, filters for 'Completed', and computes count and total spend.\n2. **Main Query**: Filters `WHERE order_count >= 2`. TechNova Inc (3 orders) and Aura Retail (2 orders) qualify.\n\n### Interview Takeaway\nCohort queries are standard in growth engineering. Structuring them with CTEs makes adding extra metrics (like average order value or first purchase date) effortless.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 2 && cols.some(c => c.includes('order_count') || c.includes('count'))) {
        return { passed: true, feedback: 'Great! Repeat customer cohort isolated via CTE.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "spotify-artist-stream-pipeline",
    number: 29,
    title: "Artist Global Stream Leaderboard",
    difficulty: "Medium",
    company: "Spotify",
    category: "CTE",
    domain: "streaming",
    conceptTitle: "Multi-Stage Analytical Pipeline",
    conceptSummary: "Combining CTE aggregation with window ranking functions enables clean, multi-stage data pipelines.",
    conceptTip: "First summarize total streams per artist in the CTE, then rank the artists in the outer query.",
    prompt: "Spotify Billboard charts compiles the global artist leaderboard. Using a CTE, calculate the total streams across all songs for each artist, then rank the artists by total streams using DENSE_RANK().",
    requirements: [
      "Select columns: artist_name, total_streams, artist_rank",
      "Stage 1 (CTE): Aggregate streams per artist",
      "Stage 2: Rank artists by total_streams descending using DENSE_RANK()"
],
    exampleOutput: {
      "columns": [
            "artist_name",
            "total_streams",
            "artist_rank"
      ],
      "rows": [
            [
                  "Taylor Swift",
                  20400,
                  1
            ],
            [
                  "The Weeknd",
                  17800,
                  2
            ],
            [
                  "Daft Punk",
                  7700,
                  3
            ]
      ]
},
    hint: "Aggregate SUM(stream_count) per artist in a CTE, then use DENSE_RANK() OVER (ORDER BY total_streams DESC).",
    starterSql: "-- Problem 29: Artist Global Stream Leaderboard (Spotify)\n-- Aggregate streams per artist in a CTE, then rank them\n-- Required columns: artist_name, total_streams, artist_rank\n\nWITH artist_streams AS (\n  -- TODO: Aggregate total streams per artist\n)\nSELECT\n  -- TODO: Select artist, total streams, and DENSE_RANK()\nFROM artist_streams;",
    solutionSql: "WITH artist_streams AS (\n  SELECT a.name AS artist_name, SUM(p.stream_count) AS total_streams\n  FROM artists a\n  JOIN songs s ON a.id = s.artist_id\n  JOIN playback_history p ON s.id = p.song_id\n  GROUP BY a.name\n)\nSELECT artist_name, total_streams, DENSE_RANK() OVER (ORDER BY total_streams DESC) AS artist_rank\nFROM artist_streams;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE artist_streams**: Joins artists, songs, and playback history to calculate total streams per artist (Taylor Swift: 20,400 streams; The Weeknd: 12,400 streams; Daft Punk: 7,700 streams; Billie Eilish: 3,900 streams).\n2. **Main Query**: Ranks the aggregated artist totals from 1 to 4 using `DENSE_RANK()`.\n\n### Interview Takeaway\nAttempting to rank and aggregate in a single SELECT without a CTE or subquery often leads to invalid SQL syntax. Isolating aggregation into a CTE makes the query simple and valid.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Excellent! Multi-stage pipeline aggregated streams and ranked artists.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "amazon-deduplicate-latest-order",
    number: 30,
    title: "Customer Order Deduplication",
    difficulty: "Medium",
    company: "Amazon",
    category: "CTE",
    domain: "ecommerce",
    conceptTitle: "Deduplication with CTE & ROW_NUMBER()",
    conceptSummary: "The universal pattern for deduplicating records in SQL: rank records with ROW_NUMBER() in a CTE, then filter WHERE rn = 1 in the outer query.",
    conceptTip: "Remember: You cannot write WHERE ROW_NUMBER() = 1 directly because window functions execute after WHERE. A CTE is required.",
    prompt: "Amazon Order Processing needs to find only the single most recent order placed by each customer. Use a CTE with ROW_NUMBER() partitioned by customer_id and ordered by order_date descending to return each customer's latest order.",
    requirements: [
      "Select columns: customer_id, id AS order_id, order_date, total_amount",
      "Use a CTE to assign rn = ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC)",
      "Filter WHERE rn = 1 in the outer query"
],
    exampleOutput: {
      "columns": [
            "customer_id",
            "order_id",
            "order_date",
            "total_amount"
      ],
      "rows": [
            [
                  1,
                  1007,
                  "2024-03-01",
                  249
            ],
            [
                  2,
                  1006,
                  "2024-02-20",
                  739.99
            ],
            [
                  3,
                  1004,
                  "2024-02-02",
                  380
            ]
      ]
},
    hint: "Assign ROW_NUMBER() partitioned by customer_id in the CTE, then select WHERE rn = 1.",
    starterSql: "-- Problem 30: Customer Order Deduplication (Amazon)\n-- Find the single latest order per customer using a CTE\n-- Required columns: customer_id, order_id, order_date, total_amount\n\nWITH ranked_orders AS (\n  -- TODO: Assign ROW_NUMBER() partitioned by customer_id ordered by order_date DESC\n)\nSELECT\n  -- TODO: Filter WHERE rn = 1\nFROM ranked_orders;",
    solutionSql: "WITH ranked_orders AS (\n  SELECT customer_id, id, order_date, total_amount, ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date DESC) AS rn\n  FROM orders\n)\nSELECT customer_id, id AS order_id, order_date, total_amount\nFROM ranked_orders\nWHERE rn = 1;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE ranked_orders**: Partitions orders by customer, numbering them chronologically backwards so the latest order always receives `rn = 1`.\n2. **Main Query**: Filters `WHERE rn = 1`, retaining exactly one most recent order per customer.\n\n### Interview Takeaway\nThis is perhaps the single most common SQL interview pattern in existence. Interviewers expect you to write this pattern effortlessly.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('order'))) {
        return { passed: true, feedback: 'Classic FAANG pattern! Deduplicated latest orders with ROW_NUMBER() = 1.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "meta-bidirectional-friendships",
    number: 31,
    title: "Mutual Friend Graph Degree Count",
    difficulty: "Hard",
    company: "Meta",
    category: "CTE",
    domain: "social",
    conceptTitle: "Bidirectional Graph Modeling with UNION ALL in CTE",
    conceptSummary: "Friendship tables typically store edges in one direction (user1 < user2). Using UNION ALL inside a CTE normalizes the graph in both directions to count total degree per user.",
    conceptTip: "UNION ALL preserves both directions (A->B and B->A) without the performance penalty of duplicate elimination.",
    prompt: "Meta Social Graph team needs to calculate the total number of friends for every user. Since friendships are bidirectional, use a CTE with UNION ALL to mirror friendships (user1 -> user2 and user2 -> user1), then count total friends per user.",
    requirements: [
      "Select columns: user_id, friend_count",
      "In a CTE, UNION ALL user1_id, user2_id and user2_id, user1_id",
      "Group by user_id and count friends",
      "Order by friend_count DESC"
],
    exampleOutput: {
      "columns": [
            "user_id",
            "friend_count"
      ],
      "rows": [
            [
                  4,
                  2
            ],
            [
                  3,
                  2
            ],
            [
                  2,
                  2
            ]
      ]
},
    hint: "UNION ALL (SELECT user1_id, user2_id FROM friendships) with (SELECT user2_id, user1_id FROM friendships).",
    starterSql: "-- Problem 31: Mutual Friend Graph Degree Count (Meta)\n-- Mirror friendship edges in a CTE, then count friends per user\n-- Required columns: user_id, friend_count\n\nWITH all_edges AS (\n  -- TODO: UNION ALL user1->user2 and user2->user1\n)\nSELECT\n  -- TODO: Group by user_id and count friends\nFROM all_edges;",
    solutionSql: "WITH all_edges AS (\n  SELECT user1_id AS user_id, user2_id AS friend_id FROM friendships\n  UNION ALL\n  SELECT user2_id AS user_id, user1_id AS friend_id FROM friendships\n)\nSELECT user_id, COUNT(friend_id) AS friend_count\nFROM all_edges\nGROUP BY user_id\nORDER BY friend_count DESC;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE all_edges**: Takes table friendships (storing 1-2, 1-3, 2-4, 3-4) and unrolls both directions using `UNION ALL`.\n2. **Main Query**: Groups by `user_id` and counts edges. Users 1, 2, 3, and 4 each have 2 friends in this connected graph.\n\n### Interview Takeaway\nGraph modeling is a favorite topic in Meta and LinkedIn interviews. Storing undirected edges canonically and unfolding them via `UNION ALL` is the standard industry approach.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('friend'))) {
        return { passed: true, feedback: 'Fantastic! Bidirectional social graph edges unrolled and counted with UNION ALL.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "uber-surge-pricing-pipeline",
    number: 32,
    title: "Daily Price Movement Volatility Pipeline",
    difficulty: "Medium",
    company: "Uber",
    category: "CTE",
    domain: "fintech",
    conceptTitle: "Lag Calculation Pipeline via CTE",
    conceptSummary: "Calculating daily percentage shifts requires looking back with LAG() in a CTE before applying downstream percentage threshold filters.",
    conceptTip: "You cannot filter on window results directly in WHERE; wrapping LAG() in a CTE solves this cleanly.",
    prompt: "Uber Treasury analyzes stock price shifts. Using a CTE, calculate the previous day close_price for \"MSFT\", and in the outer query compute the percentage change ((close_price - prev_price) / prev_price * 100). Filter out the initial day where prev_price is NULL.",
    requirements: [
      "Select columns: trade_date, close_price, prev_price, pct_change",
      "Use a CTE to get prev_price using LAG(close_price, 1)",
      "Filter WHERE prev_price IS NOT NULL",
      "Round pct_change to 2 decimal places"
],
    exampleOutput: {
      "columns": [
            "trade_date",
            "close_price",
            "prev_price",
            "pct_change"
      ],
      "rows": [
            [
                  "2024-01-03",
                  370.6,
                  370.87,
                  -0.07
            ],
            [
                  "2024-01-04",
                  367.94,
                  370.6,
                  -0.72
            ],
            [
                  "2024-01-05",
                  367.75,
                  367.94,
                  -0.05
            ]
      ]
},
    hint: "Compute LAG in CTE, then calculate ROUND(((close_price - prev_price) / prev_price) * 100, 2).",
    starterSql: "-- Problem 32: Daily Price Movement Pipeline (Uber)\n-- Calculate daily percentage price shift for MSFT\n-- Required columns: trade_date, close_price, prev_price, pct_change\n\nWITH price_shifts AS (\n  -- TODO: Get previous day price using LAG()\n)\nSELECT\n  -- TODO: Calculate pct_change and filter prev_price IS NOT NULL\nFROM price_shifts;",
    solutionSql: "WITH price_shifts AS (\n  SELECT trade_date, close_price, LAG(close_price, 1) OVER (ORDER BY trade_date) AS prev_price\n  FROM stock_quotes\n  WHERE ticker = 'MSFT'\n)\nSELECT trade_date, close_price, prev_price, ROUND(((close_price - prev_price) / prev_price) * 100, 2) AS pct_change\nFROM price_shifts\nWHERE prev_price IS NOT NULL;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE price_shifts**: Sequences Microsoft closing prices and fetches the previous trading day's price with `LAG()`.\n2. **Main Query**: Computes percentage price change. On Jan 8, price jumps from $367.75 to $374.69 (+1.89%).\n\n### Interview Takeaway\nFinancial volatility and day-over-day growth rates require this exact CTE + LAG architecture.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('pct') || c.includes('change'))) {
        return { passed: true, feedback: 'Great! Percentage price change pipeline computed cleanly.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "stripe-high-volume-users",
    number: 33,
    title: "Power User Net Volume Pipeline",
    difficulty: "Medium",
    company: "Stripe",
    category: "CTE",
    domain: "fintech",
    conceptTitle: "Filtering Aggregated Accounts via CTE",
    conceptSummary: "Pre-aggregating multi-transaction accounts into a CTE simplifies user segmentation and risk screening.",
    conceptTip: "Net volume is calculated as deposits minus purchases.",
    prompt: "Stripe Risk identifies high-activity accounts. Using a CTE, aggregate the total transaction count and net volume (deposits minus purchases) for each user. Return users who have at least 3 transactions.",
    requirements: [
      "Select columns: user_id, txn_count, net_volume",
      "Compute net volume as SUM(DEPOSIT) - SUM(PURCHASE)",
      "Filter for txn_count >= 3 in the outer query",
      "Round net_volume to 2 decimal places"
],
    exampleOutput: {
      "columns": [
            "user_id",
            "txn_count",
            "net_volume"
      ],
      "rows": [
            [
                  101,
                  4,
                  4814.6
            ],
            [
                  102,
                  3,
                  3564.8
            ]
      ]
},
    hint: "In CTE, use SUM(CASE WHEN txn_type = \"DEPOSIT\" THEN amount ELSE -amount END).",
    starterSql: "-- Problem 33: Power User Net Volume Pipeline (Stripe)\n-- Aggregate transaction count and net volume per user\n-- Required columns: user_id, txn_count, net_volume\n\nWITH user_txns AS (\n  -- TODO: Group by user_id and compute count and net volume\n)\nSELECT\n  -- TODO: Filter users with txn_count >= 3\nFROM user_txns;",
    solutionSql: "WITH user_txns AS (\n  SELECT user_id, COUNT(id) AS txn_count, SUM(CASE WHEN txn_type = 'DEPOSIT' THEN amount ELSE -amount END) AS net_volume\n  FROM transactions\n  GROUP BY user_id\n)\nSELECT user_id, txn_count, ROUND(net_volume, 2) AS net_volume\nFROM user_txns\nWHERE txn_count >= 3;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE user_txns**: Groups transactions by user and calculates transaction frequency and net volume.\n2. **Outer Query**: Filters for power users (`txn_count >= 3`). Users 101 and 102 qualify.\n\n### Interview Takeaway\nUsing CTEs allows you to reuse aggregated metrics or feed them into secondary scoring models seamlessly.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 2 && cols.some(c => c.includes('volume') || c.includes('count'))) {
        return { passed: true, feedback: 'Nice! Power user transaction count and net volume filtered.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "stripe-category-spend-share",
    number: 34,
    title: "Merchant Category Spend Contribution Share",
    difficulty: "Hard",
    company: "Stripe",
    category: "CTE",
    domain: "fintech",
    conceptTitle: "Multi-CTE Composition",
    conceptSummary: "Multiple CTEs can be defined sequentially (WITH cte1 AS (...), cte2 AS (...)) and combined in the final query to compute percentages of grand totals.",
    conceptTip: "Cross-joining a summary CTE with a single-row grand total CTE makes ratio calculations trivial.",
    prompt: "Stripe Merchant Analytics assesses payment category distribution. Build a two-stage CTE: CTE 1 aggregates total purchase spend by category (txn_type = \"PURCHASE\"); CTE 2 calculates the overall grand total purchase spend. In the main query, return each category, category spend, and its percentage share of overall purchase spend (pct_of_total rounded to 2 decimals), ordered by category spend descending.",
    requirements: [
      "Select columns: category, category_spend, pct_of_total",
      "Stage 1 CTE: Aggregate total spend per category where txn_type = \"PURCHASE\"",
      "Stage 2 CTE: Sum overall purchase spend across categories",
      "Final Query: Calculate (category_spend / overall_spend) * 100 rounded to 2 decimals",
      "Order by category_spend DESC"
],
    exampleOutput: {
      "columns": [
            "category",
            "category_spend",
            "pct_of_total"
      ],
      "rows": [
            [
                  "Electronics",
                  350,
                  56.4
            ],
            [
                  "Utilities",
                  120,
                  19.34
            ],
            [
                  "Dining",
                  85.2,
                  13.73
            ]
      ]
},
    hint: "Define two comma-separated CTEs: cat_spend and grand_total, then cross join them in SELECT.",
    starterSql: "-- Problem 34: Merchant Category Spend Share (Stripe)\n-- Calculate category spend and percentage share of grand total\n-- Required columns: category, category_spend, pct_of_total\n\nWITH cat_spend AS (\n  -- TODO: Aggregate spend by category for txn_type = 'PURCHASE'\n), grand_total AS (\n  -- TODO: Calculate grand total spend from cat_spend\n)\nSELECT\n  -- TODO: Compute category_spend and pct_of_total\nFROM cat_spend c, grand_total g\nORDER BY category_spend DESC;",
    solutionSql: "WITH cat_spend AS (\n  SELECT category, SUM(amount) AS total_spend\n  FROM transactions\n  WHERE txn_type = 'PURCHASE'\n  GROUP BY category\n), grand_total AS (\n  SELECT SUM(total_spend) AS overall_spend FROM cat_spend\n)\nSELECT c.category, ROUND(c.total_spend, 2) AS category_spend, ROUND((c.total_spend / g.overall_spend) * 100, 2) AS pct_of_total\nFROM cat_spend c, grand_total g\nORDER BY category_spend DESC;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE cat_spend**: Aggregates purchase transactions grouped by merchant category.\n2. **CTE grand_total**: Takes `cat_spend` and computes a single-value grand total ($620.60).\n3. **Main Query**: Cross-joins the two CTEs to divide each category total by the grand total, outputting exact contribution percentages (Electronics: 56.39%; Utilities: 19.34%; Dining: 13.73%; Groceries: 10.54%).\n\n### Interview Takeaway\nStructuring executive reporting queries with chained CTEs separates aggregation logic from presentation math, preventing complex code entanglements.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 2 && cols.some(c => c.includes('pct') || c.includes('total'))) {
        return { passed: true, feedback: 'Superb! Chained CTEs calculated category percentage share.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "google-above-company-avg-salary",
    number: 35,
    title: "Above-Average Salary Earners",
    difficulty: "Easy",
    company: "Google",
    category: "SUBQUERIES",
    domain: "core",
    conceptTitle: "Uncorrelated Scalar Subqueries in WHERE",
    conceptSummary: "An uncorrelated scalar subquery runs exactly once, evaluates to a single value, and drops into the outer query's comparison operator.",
    conceptTip: "The inner (SELECT AVG(salary) FROM users) evaluates to approximately $129,375 before the outer query filters.",
    prompt: "Google Compensation team wants to find all employees whose salary exceeds the company-wide average salary. Use a scalar subquery in the WHERE clause.",
    requirements: [
      "Select columns: name, role, salary",
      "Use WHERE salary > (SELECT AVG(salary) FROM users)",
      "Do not hardcode numeric averages"
],
    exampleOutput: {
      "columns": [
            "name",
            "role",
            "salary"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Staff Engineer",
                  165000
            ],
            [
                  "Marcus Vance",
                  "Lead Designer",
                  130000
            ],
            [
                  "Priya Patel",
                  "Backend Engineer",
                  140000
            ]
      ]
},
    hint: "Write WHERE salary > (SELECT AVG(salary) FROM users).",
    starterSql: "-- Problem 35: Above-Average Salary Earners (Google)\n-- Find employees earning more than the company average\n-- Required columns: name, role, salary\n\nSELECT\n  name,\n  role,\n  salary\nFROM users\nWHERE salary > (\n  -- TODO: Subquery computing average salary\n);",
    solutionSql: "SELECT name, role, salary\nFROM users\nWHERE salary > (SELECT AVG(salary) FROM users);",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Inner Subquery**: Evaluates `SELECT AVG(salary) FROM users`, returning $129,375.\n2. **Outer Query**: Filters the `users` table to keep only employees with salary > 129,375 (Alice Chen, Marcus Vance, Priya Patel, Sofia Rossi, Elena Rostova).\n\n### Interview Takeaway\nScalar subqueries are simple and fast because the query planner evaluates the subquery only once as a constant.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 5 && cols.includes('salary')) {
        return { passed: true, feedback: 'Correct! Scalar subquery filtered above company average earners.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "meta-above-dept-avg-salary",
    number: 36,
    title: "Above Department Average Earners",
    difficulty: "Medium",
    company: "Meta",
    category: "SUBQUERIES",
    domain: "core",
    conceptTitle: "Correlated Subqueries",
    conceptSummary: "A correlated subquery references columns from the outer query, causing it to be re-evaluated for each candidate row of the outer table.",
    conceptTip: "Notice the inner query references u.department_id from the outer row.",
    prompt: "Meta Compensation wants to identify employees who earn more than their department's average salary. Use a correlated subquery in the WHERE clause.",
    requirements: [
      "Select columns: name, role, salary, department_id",
      "Exclude users with department_id IS NULL",
      "Use a correlated subquery comparing salary to department average"
],
    exampleOutput: {
      "columns": [
            "name",
            "role",
            "salary",
            "department_id"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Staff Engineer",
                  165000,
                  1
            ],
            [
                  "Marcus Vance",
                  "Lead Designer",
                  130000,
                  2
            ],
            [
                  "Sofia Rossi",
                  "Product Manager",
                  135000,
                  3
            ]
      ]
},
    hint: "WHERE u.salary > (SELECT AVG(u2.salary) FROM users u2 WHERE u2.department_id = u.department_id).",
    starterSql: "-- Problem 36: Above Department Average Earners (Meta)\n-- Find employees earning above their department average using a correlated subquery\n-- Required columns: name, role, salary, department_id\n\nSELECT\n  u.name,\n  u.role,\n  u.salary,\n  u.department_id\nFROM users u\nWHERE u.department_id IS NOT NULL\n  AND u.salary > (\n    -- TODO: Correlated subquery referencing u.department_id\n  );",
    solutionSql: "SELECT u.name, u.role, u.salary, u.department_id\nFROM users u\nWHERE u.department_id IS NOT NULL AND u.salary > (SELECT AVG(u2.salary) FROM users u2 WHERE u2.department_id = u.department_id);",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Outer Row Scan**: Iterates through each user row.\n2. **Correlated Subquery**: For Alice (Dept 1), computes average salary for Dept 1 ($153,333). Alice ($165k) is above average and passes.\n3. **Execution**: Repeats for Marcus Vance ($130k vs Design average $107.5k), etc.\n\n### Interview Takeaway\nCorrelated subqueries demonstrate your understanding of row-by-row outer loop execution. Mention that modern query optimizers often rewrite correlated subqueries into hash joins for efficiency.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.includes('salary')) {
        return { passed: true, feedback: 'Great job! Correlated subquery filtered above department average earners.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "amazon-customers-without-orders",
    number: 37,
    title: "Inactive Customers (NOT EXISTS)",
    difficulty: "Easy",
    company: "Amazon",
    category: "SUBQUERIES",
    domain: "ecommerce",
    conceptTitle: "Existence Testing with NOT EXISTS",
    conceptSummary: "NOT EXISTS returns TRUE if the correlated subquery returns zero rows. The engine short-circuits as soon as a single match is found.",
    conceptTip: "NOT EXISTS handles NULL values gracefully, unlike NOT IN which can fail if the subquery returns any NULLs.",
    prompt: "Amazon Marketing wants to send re-engagement emails to registered customers who have never placed an order. Retrieve their customer id, name, and country using NOT EXISTS.",
    requirements: [
      "Select columns: id, name, country",
      "Use WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id)",
      "Return only customers with zero orders"
],
    exampleOutput: {
      "columns": [
            "id",
            "name",
            "country"
      ],
      "rows": [
            [
                  5,
                  "Beacon Health",
                  "Canada"
            ]
      ]
},
    hint: "Use WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id).",
    starterSql: "-- Problem 37: Inactive Customers (Amazon)\n-- Find customers who have never placed an order using NOT EXISTS\n-- Required columns: id, name, country\n\nSELECT\n  c.id,\n  c.name,\n  c.country\nFROM customers c\nWHERE NOT EXISTS (\n  -- TODO: Correlated subquery checking for matching customer_id in orders\n);",
    solutionSql: "SELECT c.id, c.name, c.country\nFROM customers c\nWHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Outer Query**: Scans the `customers` table.\n2. **NOT EXISTS Subquery**: For each customer, checks the `orders` table. Beacon Health (id = 5) has never placed an order, so the subquery yields zero rows. NOT EXISTS evaluates to TRUE.\n3. **Result**: Beacon Health is returned.\n\n### Interview Takeaway\nAlways prefer `NOT EXISTS` over `NOT IN` in SQL interviews. If the subquery column contains even a single NULL, `NOT IN` evaluates to UNKNOWN and returns zero results!",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (cols.length >= 2 && rows.length === 1 && String(rows[0][1]).includes('Beacon')) {
        return { passed: true, feedback: 'Spot on! Inactive customer identified using NOT EXISTS.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "spotify-unstreamed-songs",
    number: 38,
    title: "Catalog Songs with Zero Streams",
    difficulty: "Easy",
    company: "Spotify",
    category: "SUBQUERIES",
    domain: "streaming",
    conceptTitle: "Exclusion with NOT IN Subquery",
    conceptSummary: "WHERE id NOT IN (SELECT foreign_key ...) filters for records whose identifier is absent from the target reference table.",
    conceptTip: "Use SELECT DISTINCT song_id in the subquery to eliminate duplicates and speed up lookup.",
    prompt: "Spotify Content Operations wants to audit catalog tracks that have logged zero streams in playback history. Find the id, title, and release_year of all songs that do not appear in playback_history.",
    requirements: [
      "Select columns: id, title, release_year",
      "Use WHERE id NOT IN (SELECT DISTINCT song_id FROM playback_history)",
      "Return unstreamed songs"
],
    exampleOutput: {
      "columns": [
            "id",
            "title",
            "release_year"
      ],
      "rows": [
            [
                  109,
                  "Ocean Eyes",
                  2016
            ]
      ]
},
    hint: "Use WHERE id NOT IN (SELECT DISTINCT song_id FROM playback_history).",
    starterSql: "-- Problem 38: Catalog Songs with Zero Streams (Spotify)\n-- Find songs that have never been streamed\n-- Required columns: id, title, release_year\n\nSELECT\n  id,\n  title,\n  release_year\nFROM songs\nWHERE id NOT IN (\n  -- TODO: Subquery selecting streamed song_ids\n);",
    solutionSql: "SELECT id, title, release_year\nFROM songs\nWHERE id NOT IN (SELECT DISTINCT song_id FROM playback_history);",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Subquery**: Collects all unique `song_id` values present in `playback_history` (101, 102, 103, 104, 105, 106, 107, 108).\n2. **Outer Query**: Evaluates all catalog songs. If any song has never been streamed, it is returned. In our seed data, every seeded track has at least one stream, so this cleanly verifies catalog completeness.\n\n### Interview Takeaway\nBe prepared to explain when to use NOT IN vs NOT EXISTS vs LEFT JOIN / IS NULL.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (cols.includes('title')) {
        return { passed: true, feedback: 'Nice! Unstreamed songs evaluated using NOT IN subquery.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "netflix-top-category-views",
    number: 39,
    title: "Posts Exceeding Content-Type Average Likes",
    difficulty: "Medium",
    company: "Netflix",
    category: "SUBQUERIES",
    domain: "social",
    conceptTitle: "Correlated Aggregate Subqueries",
    conceptSummary: "Comparing an individual row's metric against the average for its own category using a correlated subquery.",
    conceptTip: "Notice the inner query matches p2.content_type = p.content_type to calculate the category-specific benchmark.",
    prompt: "Netflix Social Media monitors post resonance. Find all social posts where the number of likes exceeds the average likes received by posts of the same content_type. Retrieve the post id, content_type, views, and likes.",
    requirements: [
      "Select columns: id, content_type, views, likes",
      "Compare p.likes > (average likes for that post's content_type)",
      "Use a correlated subquery"
],
    exampleOutput: {
      "columns": [
            "id",
            "content_type",
            "views",
            "likes"
      ],
      "rows": [
            [
                  3,
                  "video",
                  32000,
                  4800
            ],
            [
                  5,
                  "image",
                  9400,
                  890
            ],
            [
                  7,
                  "video",
                  45000,
                  5600
            ]
      ]
},
    hint: "Use WHERE p.likes > (SELECT AVG(p2.likes) FROM posts p2 WHERE p2.content_type = p.content_type).",
    starterSql: "-- Problem 39: Above-Average Likes per Content-Type (Netflix)\n-- Find posts earning more likes than their content_type average\n-- Required columns: id, content_type, views, likes\n\nSELECT\n  p.id,\n  p.content_type,\n  p.views,\n  p.likes\nFROM posts p\nWHERE p.likes > (\n  -- TODO: Correlated subquery computing AVG(likes) for p.content_type\n);",
    solutionSql: "SELECT p.id, p.content_type, p.views, p.likes\nFROM posts p\nWHERE p.likes > (SELECT AVG(p2.likes) FROM posts p2 WHERE p2.content_type = p.content_type);",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Correlated Evaluation**: For each video post, the subquery calculates average likes across video posts (average ~3,475 likes).\n2. **Filter**: Post 3 (4,800 likes) and Post 7 (5,600 likes) exceed the video average. For image posts, Post 5 (890 likes) exceeds the image average (715 likes).\n\n### Interview Takeaway\nThis pattern tests whether you can dynamically benchmark entities against their peer group rather than a blunt global average.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.includes('likes')) {
        return { passed: true, feedback: 'Correct! Correlated subquery filtered posts exceeding content-type average likes.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "apple-dept-multi-seniors",
    number: 40,
    title: "Departments with Multiple High Earners",
    difficulty: "Medium",
    company: "Apple",
    category: "SUBQUERIES",
    domain: "core",
    conceptTitle: "Subqueries with GROUP BY & HAVING in WHERE",
    conceptSummary: "Subqueries can contain their own GROUP BY and HAVING clauses, filtering primary keys before passing them to the outer IN clause.",
    conceptTip: "The subquery returns a list of department_ids that meet the senior headcount threshold.",
    prompt: "Apple Organization Planning wants to identify departments that employ at least 2 staff members earning $140,000 or more. Retrieve the department id, name, and location using an IN subquery.",
    requirements: [
      "Select columns: id, name, location",
      "Subquery: Find department_id from users where salary >= 140000 having count >= 2",
      "Outer query: Select departments with id IN (...) "
],
    exampleOutput: {
      "columns": [
            "id",
            "name",
            "location"
      ],
      "rows": [
            [
                  1,
                  "Engineering",
                  "San Francisco"
            ]
      ]
},
    hint: "WHERE d.id IN (SELECT department_id FROM users WHERE salary >= 140000 GROUP BY department_id HAVING COUNT(*) >= 2).",
    starterSql: "-- Problem 40: Departments with Multiple High Earners (Apple)\n-- Find departments with at least 2 employees earning >= $140k\n-- Required columns: id, name, location\n\nSELECT\n  d.id,\n  d.name,\n  d.location\nFROM departments d\nWHERE d.id IN (\n  -- TODO: Subquery returning department_ids with >= 2 high earners\n);",
    solutionSql: "SELECT d.id, d.name, d.location\nFROM departments d\nWHERE d.id IN (SELECT department_id FROM users WHERE salary >= 140000 GROUP BY department_id HAVING COUNT(*) >= 2);",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Subquery**: Filters users with salary >= 140,000 (Alice Chen $165k, Priya Patel $140k, Elena Rostova $155k in Engineering).\n2. **HAVING COUNT(*) >= 2**: Engineering has 3 high earners, qualifying it for inclusion.\n3. **Outer Query**: Returns Department 1 (Engineering, San Francisco).\n\n### Interview Takeaway\nUsing a subquery in an `IN` clause avoids row duplication that can occur when joining one-to-many relationships without an explicit DISTINCT or GROUP BY.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (cols.length >= 2 && rows.length === 1 && String(rows[0][1]).includes('Engineering')) {
        return { passed: true, feedback: 'Awesome! Departments with multiple senior earners isolated via HAVING in subquery.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "linkedin-active-connections",
    number: 41,
    title: "High-Impact Video Creators",
    difficulty: "Medium",
    company: "LinkedIn",
    category: "SUBQUERIES",
    domain: "social",
    conceptTitle: "Filtering Users by Activity Thresholds",
    conceptSummary: "Filtering outer entities based on whether they meet a threshold condition inside a child event table.",
    conceptTip: "Use subquery IN to qualify user_ids before aggregating their total views.",
    prompt: "LinkedIn Creator Network wants to identify creators who have published at least one video that surpassed 20,000 views. For these qualifying creators, report their user_id and total video views across all their video posts.",
    requirements: [
      "Select columns: user_id, total_video_views (SUM(views))",
      "Filter for user_id IN (subquery finding users with a video > 20000 views)",
      "Group by user_id"
],
    exampleOutput: {
      "columns": [
            "user_id",
            "total_video_views"
      ],
      "rows": [
            [
                  1,
                  35500
            ],
            [
                  2,
                  32000
            ],
            [
                  4,
                  45000
            ]
      ]
},
    hint: "WHERE user_id IN (SELECT DISTINCT user_id FROM posts WHERE content_type = \"video\" AND views > 20000).",
    starterSql: "-- Problem 41: High-Impact Video Creators (LinkedIn)\n-- Find users with at least one 20k+ view video and sum their video views\n-- Required columns: user_id, total_video_views\n\nSELECT\n  user_id,\n  SUM(views) AS total_video_views\nFROM posts\nWHERE content_type = 'video'\n  AND user_id IN (\n    -- TODO: Subquery finding users with any video > 20000 views\n  )\nGROUP BY user_id;",
    solutionSql: "SELECT user_id, SUM(views) AS total_video_views\nFROM posts\nWHERE content_type = 'video' AND user_id IN (SELECT DISTINCT user_id FROM posts WHERE content_type = 'video' AND views > 20000)\nGROUP BY user_id;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Subquery**: Finds users who have achieved a 20k+ video view (Users 1, 2, and 4).\n2. **Outer Query**: Computes total video views for these qualifying creators.\n\n### Interview Takeaway\nTwo-stage criteria (qualifying on a single outlier event, then summarizing all events) is a recurring interview design question.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.some(c => c.includes('view'))) {
        return { passed: true, feedback: 'Well done! High-impact video creators identified and summarized.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "robinhood-large-transactions",
    number: 42,
    title: "Above-User-Average Purchase Transactions",
    difficulty: "Medium",
    company: "Robinhood",
    category: "SUBQUERIES",
    domain: "fintech",
    conceptTitle: "Correlated Anomaly Detection",
    conceptSummary: "Comparing an individual transaction against that user's personal average purchase history.",
    conceptTip: "Notice the inner query matches t2.user_id = t.user_id and filters for txn_type = \"PURCHASE\".",
    prompt: "Robinhood Fraud Engineering flags potential anomalous purchases. Find all purchase transactions where the amount is greater than the user's own average purchase amount using a correlated subquery.",
    requirements: [
      "Select columns: id, user_id, amount, category",
      "Filter for txn_type = \"PURCHASE\"",
      "Amount must be > user's average purchase amount"
],
    exampleOutput: {
      "columns": [
            "id",
            "user_id",
            "amount",
            "category"
      ],
      "rows": [
            [
                  3,
                  101,
                  120,
                  "Utilities"
            ],
            [
                  5,
                  102,
                  350,
                  "Electronics"
            ]
      ]
},
    hint: "WHERE t.txn_type = \"PURCHASE\" AND t.amount > (SELECT AVG(t2.amount) FROM transactions t2 WHERE t2.user_id = t.user_id AND t2.txn_type = \"PURCHASE\").",
    starterSql: "-- Problem 42: Above-User-Average Purchases (Robinhood)\n-- Find purchases that exceed the user's personal average purchase\n-- Required columns: id, user_id, amount, category\n\nSELECT\n  t.id,\n  t.user_id,\n  t.amount,\n  t.category\nFROM transactions t\nWHERE t.txn_type = 'PURCHASE'\n  AND t.amount > (\n    -- TODO: Correlated subquery computing user's average purchase amount\n  );",
    solutionSql: "SELECT t.id, t.user_id, t.amount, t.category\nFROM transactions t\nWHERE t.txn_type = 'PURCHASE' AND t.amount > (SELECT AVG(t2.amount) FROM transactions t2 WHERE t2.user_id = t.user_id AND t2.txn_type = 'PURCHASE');",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Outer Filter**: Evaluates each purchase transaction.\n2. **Correlated Subquery**: For user 101, average purchase is ($65.40 + $120.00) / 2 = $92.70. Transaction 3 ($120.00 Utilities) exceeds $92.70.\n3. For user 102, average purchase is ($350.00 + $85.20) / 2 = $217.60. Transaction 5 ($350.00 Electronics) exceeds $217.60.\n\n### Interview Takeaway\nPersonalized baselines are critical in fraud detection because a $500 purchase may be routine for one user but highly anomalous for another.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 2 && cols.includes('amount')) {
        return { passed: true, feedback: 'Correct! Correlated subquery detected above-user-average purchases.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "meta-user-activity-streaks",
    number: 43,
    title: "Activity Intervals & Inactivity Lags",
    difficulty: "Hard",
    company: "Meta",
    category: "CAPSTONE",
    domain: "social",
    conceptTitle: "Date Interval Analysis with CTE & LAG()",
    conceptSummary: "Analyzing intervals between consecutive user actions forms the foundation of user retention and churn models.",
    conceptTip: "LAG(post_date, 1) OVER (ORDER BY post_date) brings the prior timestamp onto the current row.",
    prompt: "Meta User Retention Capstone: Analyze posting frequency for user_id = 1. Using a CTE with LAG(), retrieve the post id, current post_date, and the previous post_date (prev_date) for user 1.",
    requirements: [
      "Select columns: id, post_date, prev_date",
      "Filter for user_id = 1",
      "Use a CTE and LAG(post_date, 1) OVER (ORDER BY post_date) AS prev_date"
],
    exampleOutput: {
      "columns": [
            "id",
            "post_date",
            "prev_date"
      ],
      "rows": [
            [
                  1,
                  "2024-01-01",
                  null
            ],
            [
                  2,
                  "2024-01-05",
                  "2024-01-01"
            ],
            [
                  6,
                  "2024-01-12",
                  "2024-01-05"
            ]
      ]
},
    hint: "In CTE, use LAG(post_date, 1) OVER (ORDER BY post_date) AS prev_date.",
    starterSql: "-- Problem 43: Activity Intervals & Inactivity Lags (Meta)\n-- Retrieve post date and previous post date for user 1\n-- Required columns: id, post_date, prev_date\n\nWITH post_lags AS (\n  -- TODO: Use LAG(post_date, 1) OVER (ORDER BY post_date)\n)\nSELECT\n  -- TODO: Project id, post_date, prev_date\nFROM post_lags;",
    solutionSql: "WITH post_lags AS (\n  SELECT id, post_date, LAG(post_date, 1) OVER (ORDER BY post_date) AS prev_date\n  FROM posts\n  WHERE user_id = 1\n)\nSELECT id, post_date, prev_date\nFROM post_lags;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE post_lags**: Filters for user 1 and sequences their posts chronologically.\n2. **LAG()**: Fetches the previous post date. Post 1 ('2024-01-01') has no predecessor (NULL); Post 2 ('2024-01-05') yields '2024-01-01'; Post 6 ('2024-01-12') yields '2024-01-05'.\n\n### Interview Takeaway\nCalculating intervals between consecutive actions is the standard LeetCode/DataLemur pattern for finding streaks and sessions.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 3 && cols.some(c => c.includes('prev'))) {
        return { passed: true, feedback: 'Great! Activity intervals and lags tracked.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "tiktok-viral-engagement-ratio",
    number: 44,
    title: "Viral Video Engagement Ratio Leaderboard",
    difficulty: "Hard",
    company: "TikTok",
    category: "CAPSTONE",
    domain: "social",
    conceptTitle: "Ratio Math, Casting, & Global Window Ranking",
    conceptSummary: "Casting integers to REAL prevents integer division truncation, and ranking ratios surfaces top-performing content regardless of raw view volume.",
    conceptTip: "CAST(likes AS REAL) / views * 100 calculates percentage engagement.",
    prompt: "TikTok Data Science Capstone: Raw view counts can be deceptive; viral quality is measured by engagement rate (likes divided by views * 100). For all video posts, calculate the engagement rate rounded to 2 decimal places, and rank all videos globally using DENSE_RANK() by engagement rate descending.",
    requirements: [
      "Select columns: id, user_id, views, likes, engagement_rate, viral_rank",
      "Filter for content_type = \"video\"",
      "Calculate engagement_rate = ROUND((CAST(likes AS REAL) / views) * 100, 2)",
      "Rank videos by engagement_rate DESC using DENSE_RANK()"
],
    exampleOutput: {
      "columns": [
            "id",
            "user_id",
            "views",
            "likes",
            "engagement_rate",
            "viral_rank"
      ],
      "rows": [
            [
                  3,
                  2,
                  32000,
                  4800,
                  15,
                  1
            ],
            [
                  7,
                  4,
                  45000,
                  5600,
                  12.44,
                  2
            ],
            [
                  6,
                  1,
                  21000,
                  2300,
                  10.95,
                  3
            ]
      ]
},
    hint: "In a CTE, compute engagement_rate with CAST, then rank by engagement_rate DESC in the main query.",
    starterSql: "-- Problem 44: Viral Video Engagement Ratio (TikTok)\n-- Compute engagement rate and rank videos globally\n-- Required columns: id, user_id, views, likes, engagement_rate, viral_rank\n\nWITH video_stats AS (\n  -- TODO: Compute engagement_rate = (CAST(likes AS REAL) / views) * 100\n)\nSELECT\n  -- TODO: Add DENSE_RANK() by engagement_rate DESC\nFROM video_stats;",
    solutionSql: "WITH video_stats AS (\n  SELECT id, user_id, views, likes, ROUND((CAST(likes AS REAL) / views) * 100, 2) AS engagement_rate\n  FROM posts\n  WHERE content_type = 'video'\n)\nSELECT id, user_id, views, likes, engagement_rate, DENSE_RANK() OVER (ORDER BY engagement_rate DESC) AS viral_rank\nFROM video_stats;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE video_stats**: Filters for video content and computes `(likes / views) * 100`. Video 3 (user 2) has a 15.00% engagement rate; Video 7 (user 4) has 12.44%; Video 6 has 10.95%; Video 1 has 8.28%.\n2. **Main Query**: Ranks the videos globally. Video 3 takes rank 1.\n\n### Interview Takeaway\nAlways cast integer columns before division in SQL to prevent silent truncation to 0. Demonstrating this awareness is a big plus in FAANG technical interviews.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Terrific! Viral video engagement ratio computed and ranked.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "amazon-clv-customer-tiers",
    number: 45,
    title: "Customer Lifetime Value (CLV) Segmentation",
    difficulty: "Hard",
    company: "Amazon",
    category: "CAPSTONE",
    domain: "ecommerce",
    conceptTitle: "Aggregation into Quantile Bucketing",
    conceptSummary: "Aggregating lifetime customer spend in a CTE and segmenting customers into quantiles with NTILE() drives automated tiering.",
    conceptTip: "NTILE(2) segments customers into Tier 1 (VIP) and Tier 2 (Standard).",
    prompt: "Amazon Principal BI Capstone: Calculate Customer Lifetime Value (CLV) as total completed order spend for each customer. Then, segment all active purchasing customers into 2 tiers using NTILE(2) based on total spend descending (1 = top spenders, 2 = standard spenders).",
    requirements: [
      "Select columns: customer_id, customer_name, total_spend, spending_tier",
      "CTE: Aggregate completed spend per customer",
      "Main Query: Assign NTILE(2) OVER (ORDER BY total_spend DESC) AS spending_tier"
],
    exampleOutput: {
      "columns": [
            "customer_id",
            "customer_name",
            "total_spend",
            "spending_tier"
      ],
      "rows": [
            [
                  1,
                  "TechNova Inc",
                  1908.49,
                  1
            ],
            [
                  2,
                  "Aura Retail",
                  869.49,
                  2
            ]
      ]
},
    hint: "Aggregate spend per customer in a CTE, then use NTILE(2) OVER (ORDER BY total_spend DESC) AS spending_tier.",
    starterSql: "-- Problem 45: Customer Lifetime Value Segmentation (Amazon)\n-- Aggregate CLV and segment customers into 2 tiers with NTILE(2)\n-- Required columns: customer_id, customer_name, total_spend, spending_tier\n\nWITH cust_spend AS (\n  -- TODO: Aggregate total completed spend per customer\n)\nSELECT\n  -- TODO: Apply NTILE(2) over total_spend DESC\nFROM cust_spend;",
    solutionSql: "WITH cust_spend AS (\n  SELECT c.id AS customer_id, c.name AS customer_name, ROUND(SUM(o.total_amount), 2) AS total_spend\n  FROM customers c\n  JOIN orders o ON c.id = o.customer_id\n  WHERE o.status = 'Completed'\n  GROUP BY c.id, c.name\n)\nSELECT customer_id, customer_name, total_spend, NTILE(2) OVER (ORDER BY total_spend DESC) AS spending_tier\nFROM cust_spend;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE cust_spend**: Sums completed orders per customer (TechNova Inc: $1,908.49; Aura Retail: $869.49).\n2. **Main Query**: Uses `NTILE(2)` to bucket customers into Spending Tier 1 and Tier 2.\n\n### Interview Takeaway\nCustomer segmentation via NTILE is a frequent interview case study for e-commerce, banking, and SaaS companies.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 2 && cols.some(c => c.includes('tier'))) {
        return { passed: true, feedback: 'Awesome! CLV quantified and customers segmented into tiers with NTILE(2).' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "citadel-vwap-quant-metric",
    number: 46,
    title: "Real-Time VWAP (Volume-Weighted Average Price)",
    difficulty: "Hard",
    company: "Citadel",
    category: "CAPSTONE",
    domain: "fintech",
    conceptTitle: "Cumulative Ratio Metrics",
    conceptSummary: "VWAP is defined as SUM(price * volume) / SUM(volume) computed continuously over an intraday or multi-day cumulative window.",
    conceptTip: "Both the numerator and denominator use cumulative window sums over UNBOUNDED PRECEDING.",
    prompt: "Citadel Quantitative Research Capstone: Calculate the daily cumulative Volume-Weighted Average Price (VWAP) for \"AAPL\". VWAP is computed as: cumulative SUM(close_price * volume) divided by cumulative SUM(volume) ordered by trade_date. Round VWAP to 2 decimal places.",
    requirements: [
      "Select columns: trade_date, close_price, volume, vwap",
      "Filter for ticker = \"AAPL\"",
      "Use cumulative window functions for both SUM(close_price * volume) and SUM(volume)",
      "Round vwap to 2 decimal places"
],
    exampleOutput: {
      "columns": [
            "trade_date",
            "close_price",
            "volume",
            "vwap"
      ],
      "rows": [
            [
                  "2024-01-02",
                  185.64,
                  82488700,
                  185.64
            ],
            [
                  "2024-01-03",
                  184.25,
                  58414500,
                  185.06
            ],
            [
                  "2024-01-04",
                  181.91,
                  71983600,
                  184
            ]
      ]
},
    hint: "Divide SUM(close_price * volume) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING) by SUM(volume) OVER (...).",
    starterSql: "-- Problem 46: Real-Time VWAP (Citadel)\n-- Compute cumulative Volume-Weighted Average Price for AAPL\n-- Required columns: trade_date, close_price, volume, vwap\n\nSELECT\n  trade_date,\n  close_price,\n  volume\n  -- TODO: Compute cumulative VWAP\nFROM stock_quotes\nWHERE ticker = 'AAPL';",
    solutionSql: "SELECT trade_date, close_price, volume, ROUND(SUM(close_price * volume) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING) / SUM(volume) OVER (ORDER BY trade_date ROWS UNBOUNDED PRECEDING), 2) AS vwap\nFROM stock_quotes\nWHERE ticker = 'AAPL';",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **Numerator**: `SUM(close_price * volume) OVER (ROWS UNBOUNDED PRECEDING)` accumulates total dollar value traded.\n2. **Denominator**: `SUM(volume) OVER (ROWS UNBOUNDED PRECEDING)` accumulates total shares traded.\n3. **Division**: Dividing dollar value by share volume produces the true Volume-Weighted Average Price for each day.\n\n### Interview Takeaway\nVWAP is the definitive benchmark used by quantitative hedge funds and institutional trading desks to gauge trade execution quality.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 5 && cols.some(c => c.includes('vwap'))) {
        return { passed: true, feedback: 'Master level! Real-time VWAP cumulative ratio computed with high precision.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "spotify-churn-risk-detection",
    number: 47,
    title: "Listening Volume Decay & Churn Detection",
    difficulty: "Hard",
    company: "Spotify",
    category: "CAPSTONE",
    domain: "streaming",
    conceptTitle: "Detecting Negative Trajectories with CTE & LAG()",
    conceptSummary: "Comparing consecutive events and filtering for negative deltas isolates customer disengagement.",
    conceptTip: "Filter WHERE prev_stream_count > stream_count to locate listening drop-offs.",
    prompt: "Spotify Analytics Capstone: Detect listening drop-offs. For user_id = 10, compare their stream count on each playback event against their previous stream count using LAG(). Return events where streaming volume decreased compared to the previous event, reporting the stream_drop amount.",
    requirements: [
      "Select columns: stream_date, song_id, stream_count, prev_stream_count, stream_drop",
      "Filter for user_id = 10",
      "Calculate stream_drop = prev_stream_count - stream_count",
      "Only return rows where prev_stream_count IS NOT NULL and stream_drop > 0"
],
    exampleOutput: {
      "columns": [
            "stream_date",
            "song_id",
            "stream_count",
            "prev_stream_count",
            "stream_drop"
      ],
      "rows": [
            [
                  "2024-01-01",
                  103,
                  3100,
                  5200,
                  2100
            ],
            [
                  "2024-01-02",
                  105,
                  4100,
                  5400,
                  1300
            ]
      ]
},
    hint: "In a CTE, compute prev_stream_count using LAG(). In the outer query, filter where prev_stream_count > stream_count.",
    starterSql: "-- Problem 47: Listening Volume Decay (Spotify)\n-- Find playback events where listening dropped compared to the previous listen\n-- Required columns: stream_date, song_id, stream_count, prev_stream_count, stream_drop\n\nWITH stream_diffs AS (\n  -- TODO: Fetch prev_stream_count with LAG()\n)\nSELECT\n  -- TODO: Calculate stream_drop and filter for drops > 0\nFROM stream_diffs;",
    solutionSql: "WITH stream_diffs AS (\n  SELECT stream_date, song_id, stream_count, LAG(stream_count, 1) OVER (ORDER BY stream_date, id) AS prev_stream_count\n  FROM playback_history\n  WHERE user_id = 10\n)\nSELECT stream_date, song_id, stream_count, prev_stream_count, (prev_stream_count - stream_count) AS stream_drop\nFROM stream_diffs\nWHERE prev_stream_count IS NOT NULL AND prev_stream_count > stream_count;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE stream_diffs**: Fetches chronological streams for user 10 and pairs each with the previous stream count via `LAG()`.\n2. **Main Query**: Filters for sessions where listening dropped. For example, between track 104 (5,200 plays) and track 103 (3,100 plays), streams dropped by 2,100.\n\n### Interview Takeaway\nDetecting behavioral drop-offs triggers early retention interventions before complete subscription cancellation occurs.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 2 && cols.some(c => c.includes('drop'))) {
        return { passed: true, feedback: 'Spot on! Listening volume decay and churn inflection detected.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "stripe-fraud-velocity-check",
    number: 48,
    title: "Same-Day Transaction Burst Velocity",
    difficulty: "Hard",
    company: "Stripe",
    category: "CAPSTONE",
    domain: "fintech",
    conceptTitle: "Partitioned Frequency Counting",
    conceptSummary: "Window counts partitioned by calendar date tag every transaction with the total transaction volume that occurred on that date.",
    conceptTip: "COUNT(id) OVER (PARTITION BY txn_date) tells you how many transactions occurred on that day without collapsing rows.",
    prompt: "Stripe Risk Engineering Capstone: Rapid transactions on a single calendar day can indicate card testing fraud. For user_id = 101, display each transaction alongside same_day_txns (the total number of transactions executed by that user on that specific date).",
    requirements: [
      "Select columns: id, txn_date, txn_type, amount, same_day_txns",
      "Filter for user_id = 101",
      "Compute same_day_txns using COUNT(id) OVER (PARTITION BY txn_date)"
],
    exampleOutput: {
      "columns": [
            "id",
            "txn_date",
            "txn_type",
            "amount",
            "same_day_txns"
      ],
      "rows": [
            [
                  1,
                  "2024-01-02",
                  "DEPOSIT",
                  2500,
                  1
            ],
            [
                  2,
                  "2024-01-03",
                  "PURCHASE",
                  65.4,
                  1
            ],
            [
                  3,
                  "2024-01-05",
                  "PURCHASE",
                  120,
                  1
            ]
      ]
},
    hint: "Use COUNT(id) OVER (PARTITION BY txn_date) AS same_day_txns.",
    starterSql: "-- Problem 48: Same-Day Transaction Burst Velocity (Stripe)\n-- Calculate same-day transaction frequency for user 101\n-- Required columns: id, txn_date, txn_type, amount, same_day_txns\n\nSELECT\n  id,\n  txn_date,\n  txn_type,\n  amount\n  -- TODO: Compute window count partitioned by txn_date\nFROM transactions\nWHERE user_id = 101;",
    solutionSql: "SELECT id, txn_date, txn_type, amount, COUNT(id) OVER (PARTITION BY txn_date) AS same_day_txns\nFROM transactions\nWHERE user_id = 101;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **WHERE user_id = 101**: Isolates user 101's transaction stream.\n2. **PARTITION BY txn_date**: Groups transactions by calendar date.\n3. **COUNT(id)**: On '2024-01-02', 1 transaction occurred; on '2024-01-03', 1 transaction occurred; each row shows its day's transaction frequency.\n\n### Interview Takeaway\nUsing window functions for frequency flags preserves the full grain of individual transaction records for subsequent rule processing.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 4 && cols.some(c => c.includes('day'))) {
        return { passed: true, feedback: 'Well done! Same-day transaction velocity burst detected.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "netflix-binge-watch-rank",
    number: 49,
    title: "Daily Top Listener Leaderboard",
    difficulty: "Hard",
    company: "Netflix",
    category: "CAPSTONE",
    domain: "streaming",
    conceptTitle: "Two-Stage Aggregate and Partitioned Rank",
    conceptSummary: "First sum activity per user per date in a CTE, then rank users within each date in the outer query.",
    conceptTip: "PARTITION BY stream_date ORDER BY daily_total_streams DESC ranks users within each day.",
    prompt: "Netflix Data Science Capstone: Find the top active listeners for each date. Use a CTE to aggregate total streams per user on each stream_date, then assign a daily_user_rank using DENSE_RANK() partitioned by stream_date and ordered by total streams descending.",
    requirements: [
      "Select columns: stream_date, user_id, daily_total_streams, daily_user_rank",
      "CTE: Aggregate SUM(stream_count) grouped by stream_date, user_id",
      "Main Query: DENSE_RANK() OVER (PARTITION BY stream_date ORDER BY daily_total_streams DESC)"
],
    exampleOutput: {
      "columns": [
            "stream_date",
            "user_id",
            "daily_total_streams",
            "daily_user_rank"
      ],
      "rows": [
            [
                  "2024-01-01",
                  12,
                  13600,
                  1
            ],
            [
                  "2024-01-01",
                  10,
                  8300,
                  2
            ],
            [
                  "2024-01-01",
                  11,
                  7700,
                  3
            ]
      ]
},
    hint: "In a CTE, compute daily_total_streams with GROUP BY stream_date, user_id, then rank in the main query.",
    starterSql: "-- Problem 49: Daily Top Listener Leaderboard (Netflix)\n-- Aggregate streams per user per day, then rank listeners per day\n-- Required columns: stream_date, user_id, daily_total_streams, daily_user_rank\n\nWITH daily_user_streams AS (\n  -- TODO: Aggregate daily total streams per user\n)\nSELECT\n  -- TODO: DENSE_RANK() partitioned by stream_date\nFROM daily_user_streams;",
    solutionSql: "WITH daily_user_streams AS (\n  SELECT stream_date, user_id, SUM(stream_count) AS daily_total_streams\n  FROM playback_history\n  GROUP BY stream_date, user_id\n)\nSELECT stream_date, user_id, daily_total_streams, DENSE_RANK() OVER (PARTITION BY stream_date ORDER BY daily_total_streams DESC) AS daily_user_rank\nFROM daily_user_streams;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **CTE daily_user_streams**: Aggregates playback history by `stream_date` and `user_id`. On Jan 1, user 12 had 13,600 streams, user 10 had 8,300, and user 11 had 7,700.\n2. **Main Query**: Partitions by `stream_date` and ranks users. User 12 takes rank 1 on Jan 1; User 10 takes rank 1 on Jan 2.\n\n### Interview Takeaway\nThis two-stage aggregation-then-ranking pattern is tested in almost every Senior Data Analyst / Analytics Engineer interview at FAANG.",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length >= 5 && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Brilliant! Daily top listener leaderboard compiled and ranked.' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
  {
    id: "uber-marketplace-top-earners",
    number: 50,
    title: "Enterprise Compensation & Salary Distribution",
    difficulty: "Hard",
    company: "Uber",
    category: "CAPSTONE",
    domain: "core",
    conceptTitle: "Combined Window Aggregates & Ranking Capstone",
    conceptSummary: "The grand capstone: combining multi-table joins, partitioned window averages, and partitioned ranking in a single cohesive query.",
    conceptTip: "Both AVG(salary) and DENSE_RANK() share the same PARTITION BY u.department_id clause.",
    prompt: "Uber / Meta Executive Compensation Capstone: Generate a department compensation overview. For every employee with an assigned department, report their name, department name, salary, the department average salary (dept_avg_salary rounded to 2 decimal places), and their salary rank within that department (dept_rank, 1 = highest earner).",
    requirements: [
      "Select columns: name, department, salary, dept_avg_salary, dept_rank",
      "Join users and departments on department_id = departments.id",
      "Compute dept_avg_salary using AVG(salary) OVER (PARTITION BY department_id)",
      "Compute dept_rank using DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC)"
],
    exampleOutput: {
      "columns": [
            "name",
            "department",
            "salary",
            "dept_avg_salary",
            "dept_rank"
      ],
      "rows": [
            [
                  "Alice Chen",
                  "Engineering",
                  165000,
                  153333.33,
                  1
            ],
            [
                  "Elena Rostova",
                  "Engineering",
                  155000,
                  153333.33,
                  2
            ],
            [
                  "Priya Patel",
                  "Engineering",
                  140000,
                  153333.33,
                  3
            ]
      ]
},
    hint: "Combine AVG(u.salary) OVER (PARTITION BY u.department_id) and DENSE_RANK() OVER (PARTITION BY u.department_id ORDER BY u.salary DESC).",
    starterSql: "-- Problem 50: Enterprise Compensation Capstone (Uber)\n-- Comprehensive department compensation analysis\n-- Required columns: name, department, salary, dept_avg_salary, dept_rank\n\nSELECT\n  u.name,\n  d.name AS department,\n  u.salary\n  -- TODO: Add dept_avg_salary and dept_rank window functions\nFROM users u\nJOIN departments d ON u.department_id = d.id;",
    solutionSql: "SELECT u.name, d.name AS department, u.salary, ROUND(AVG(u.salary) OVER (PARTITION BY u.department_id), 2) AS dept_avg_salary, DENSE_RANK() OVER (PARTITION BY u.department_id ORDER BY u.salary DESC) AS dept_rank\nFROM users u\nJOIN departments d ON u.department_id = d.id;",
    solutionExplanation: "### Step-by-Step Walkthrough\n\n1. **JOIN users and departments**: Connects employees to their department location and metadata.\n2. **AVG(u.salary) OVER (PARTITION BY u.department_id)**: Computes the mean salary for each department and attaches it to every employee row without collapsing data.\n3. **DENSE_RANK() OVER (PARTITION BY u.department_id ORDER BY u.salary DESC)**: Simultaneously computes each employee's rank within their department.\n\n### Interview Takeaway\nMastering this query proves complete mastery over joins, window frames, partitions, ranking, and presentation formatting. You are ready to ace any FAANG SQL interview!",
    validateQuery: (result: QueryResult) => {
      const cols = result.columns.map(c => c.toLowerCase());
      const rows = result.rows;
      if (!rows || rows.length === 0) return { passed: false, feedback: 'Query returned 0 rows. Check your filters and joins.' };
      if (rows.length === 7 && cols.some(c => c.includes('avg')) && cols.some(c => c.includes('rank'))) {
        return { passed: true, feedback: 'Grand Capstone Complete! You mastered Joins, Window Averages, and Ranking in one query!' };
      }
      return { passed: false, feedback: 'Output does not match expected columns or rows. Check hints and requirements.' };
    },
  },
];
