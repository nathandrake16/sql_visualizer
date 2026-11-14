import { Challenge, ParsedQuery, QueryResult } from '@/types/sql';

export const CHALLENGES: Challenge[] = [
  // =========================================================================
  // MODULE 1: FOUNDATIONS, AGGREGATIONS & RELATIONAL JOINS (1 - 10)
  // =========================================================================
  {
    id: 'select-where',
    number: 1,
    title: 'Filtering Engineering Staff',
    difficulty: 'Easy',
    company: 'Meta',
    category: 'WHERE',
    domain: 'core',
    conceptTitle: 'Basic SELECT & WHERE Filtering',
    conceptSummary:
      'SQL evaluates FROM first to gather rows, then WHERE to keep only rows matching your condition, and finally SELECT to project columns.',
    conceptTip:
      'Execution order: FROM -> WHERE -> SELECT. Filtering happens before columns are trimmed.',
    prompt:
      'Retrieve the name and role of all employees in department_id = 1 (Engineering).',
    hint: 'Use FROM users, filter with WHERE department_id = 1, and select name, role.',
    starterSql: `SELECT name, role, department_id\nFROM users\nWHERE department_id = 1;`,
    solutionSql: `SELECT name, role\nFROM users\nWHERE department_id = 1;`,
    validateQuery: (result: QueryResult) => {
      const names = result.rowObjects.map((r) => String(r.name ?? '')).sort();
      const hasAlice = names.includes('Alice Chen');
      const hasPriya = names.includes('Priya Patel');
      if (result.rowCount >= 2 && hasAlice && hasPriya && result.columns.length >= 2) {
        return { passed: true, feedback: 'Great! You filtered users down to the Engineering members.' };
      }
      return { passed: false, feedback: `Expected Engineering members (Alice Chen, Priya Patel); got ${result.rowCount} row(s).` };
    },
  },
  {
    id: 'inner-join',
    number: 2,
    title: 'Matching Employees to Departments',
    difficulty: 'Easy',
    company: 'Google',
    category: 'INNER JOIN',
    domain: 'core',
    conceptTitle: 'Connecting Tables with INNER JOIN',
    conceptSummary:
      'INNER JOIN pairs rows between tables where the ON condition matches. Rows without a match on either side are excluded.',
    conceptTip:
      'Notice Jordan Kim (NULL department) and Research (0 members) are dropped by INNER JOIN.',
    prompt:
      'List all employees who have an assigned department, returning employee name, role, and department name.',
    hint: 'Join users and departments ON users.department_id = departments.id.',
    starterSql: `SELECT users.name AS employee, users.role, departments.name AS department\nFROM users\nINNER JOIN departments\n  ON users.department_id = departments.id;`,
    solutionSql: `SELECT users.name AS employee, users.role, departments.name AS department\nFROM users\nINNER JOIN departments\n  ON users.department_id = departments.id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const isInner = parsed?.join?.type === 'INNER';
      if (result.rowCount >= 4 && isInner) {
        return { passed: true, feedback: 'Spot on! All matched employees appear while unmatched rows are excluded.' };
      }
      return { passed: false, feedback: `Expected matched employee-department rows using INNER JOIN; got ${result.rowCount} row(s).` };
    },
  },
  {
    id: 'left-join',
    number: 3,
    title: 'Preserving Unassigned Contractors',
    difficulty: 'Easy',
    company: 'Amazon',
    category: 'LEFT JOIN',
    domain: 'core',
    conceptTitle: 'Preserving Rows with LEFT JOIN',
    conceptSummary:
      'LEFT JOIN keeps all rows from the left table, attaching right-table matches or filling missing fields with NULL.',
    conceptTip:
      'Watch Jordan Kim receive NULL department cells instead of being discarded.',
    prompt:
      'List all employees and their department names, including contractors who have no department assigned.',
    hint: 'Use LEFT JOIN departments ON users.department_id = departments.id.',
    starterSql: `SELECT u.name AS employee, u.role, d.name AS department\nFROM users u\nLEFT JOIN departments d\n  ON u.department_id = d.id;`,
    solutionSql: `SELECT u.name AS employee, u.role, d.name AS department\nFROM users u\nLEFT JOIN departments d\n  ON u.department_id = d.id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasJordan = result.rowObjects.some((r) => Object.values(r).some((v) => v === 'Jordan Kim'));
      const hasNull = result.rows.some((row) => row.some((v) => v === null));
      if (hasJordan && hasNull && parsed?.join?.type === 'LEFT') {
        return { passed: true, feedback: 'Excellent! LEFT JOIN kept Jordan Kim and injected NULL.' };
      }
      return { passed: false, feedback: 'Expected all employees including Jordan Kim with NULL department.' };
    },
  },
  {
    id: 'unassigned-departments',
    number: 4,
    title: 'Detecting Empty Departments',
    difficulty: 'Easy',
    company: 'Apple',
    category: 'LEFT JOIN',
    domain: 'core',
    conceptTitle: 'Detecting Unmatched Records with IS NULL',
    conceptSummary:
      'Flipping the left table to departments and checking WHERE users.id IS NULL isolates empty teams.',
    conceptTip:
      'LEFT JOIN + WHERE right_side.key IS NULL is the classic anti-join pattern.',
    prompt:
      'Find all departments that currently have zero assigned employees.',
    hint: 'FROM departments d LEFT JOIN users u ON d.id = u.department_id WHERE u.id IS NULL.',
    starterSql: `SELECT d.id AS dept_id, d.name AS department, d.location\nFROM departments d\nLEFT JOIN users u\n  ON d.id = u.department_id\nWHERE u.id IS NULL;`,
    solutionSql: `SELECT d.id AS dept_id, d.name AS department, d.location\nFROM departments d\nLEFT JOIN users u\n  ON d.id = u.department_id\nWHERE u.id IS NULL;`,
    validateQuery: (result: QueryResult) => {
      const hasResearch = result.rowObjects.some((r) => Object.values(r).some((v) => v === 'Research'));
      if (result.rowCount === 1 && hasResearch) {
        return { passed: true, feedback: 'Nailed it! Research (Zurich) has zero employees.' };
      }
      return { passed: false, feedback: 'Expected 1 department (Research).' };
    },
  },
  {
    id: 'multi-table-orders',
    number: 5,
    title: 'Customer Orders Breakdown',
    difficulty: 'Medium',
    company: 'Shopify',
    category: 'INNER JOIN',
    domain: 'ecommerce',
    conceptTitle: 'Relational Joins in E-Commerce',
    conceptSummary:
      'Connecting customers to their placed orders provides full purchase histories.',
    conceptTip: 'Match customers.id = orders.customer_id.',
    prompt:
      'List each customer name along with their order ID, order date, and total amount for completed orders.',
    hint: 'FROM customers c JOIN orders o ON c.id = o.customer_id WHERE o.status = "Completed".',
    starterSql: `SELECT c.name, o.id AS order_id, o.order_date, o.total_amount\nFROM customers c\nJOIN orders o\n  ON c.id = o.customer_id\nWHERE o.status = 'Completed';`,
    solutionSql: `SELECT c.name, o.id AS order_id, o.order_date, o.total_amount\nFROM customers c\nJOIN orders o\n  ON c.id = o.customer_id\nWHERE o.status = 'Completed';`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 4 && result.columns.some((c) => c.toLowerCase().includes('total'))) {
        return { passed: true, feedback: 'Great! Retrieved completed orders with customer names.' };
      }
      return { passed: false, feedback: 'Expected completed customer orders with amount and date.' };
    },
  },
  {
    id: 'group-by-having',
    number: 6,
    title: 'High-Volume Product Categories',
    difficulty: 'Easy',
    company: 'Amazon',
    category: 'SELECT',
    domain: 'ecommerce',
    conceptTitle: 'GROUP BY and Filter with HAVING',
    conceptSummary:
      'WHERE filters rows before aggregation; HAVING filters aggregated groups.',
    conceptTip: 'GROUP BY category HAVING COUNT(*) > 1.',
    prompt:
      'Find all product categories that offer at least 2 distinct products, returning category and product count.',
    hint: 'SELECT category, COUNT(*) as product_count FROM products GROUP BY category HAVING COUNT(*) >= 2;',
    starterSql: `SELECT category, COUNT(*) AS product_count\nFROM products\nGROUP BY category\nHAVING COUNT(*) >= 2;`,
    solutionSql: `SELECT category, COUNT(*) AS product_count\nFROM products\nGROUP BY category\nHAVING COUNT(*) >= 2;`,
    validateQuery: (result: QueryResult) => {
      const counts = result.rows.map((r) => Number(r[1]));
      if (result.rowCount >= 2 && counts.every((c) => c >= 2)) {
        return { passed: true, feedback: 'Correct! Filtered categories using HAVING.' };
      }
      return { passed: false, feedback: 'Expected categories with at least 2 products.' };
    },
  },
  {
    id: 'self-join-friendships',
    number: 7,
    title: 'Reciprocal Friend Connections',
    difficulty: 'Medium',
    company: 'Meta',
    category: 'INNER JOIN',
    domain: 'social',
    conceptTitle: 'Self Joins on Social Graphs',
    conceptSummary:
      'Joining a table to itself links bidirectional relationships like user1 and user2 friendships.',
    conceptTip: 'Join friendships f1 with friendships f2 on f1.user1_id = f2.user2_id.',
    prompt:
      'Find pairs of mutual friends where both users have linked each other.',
    hint: 'FROM friendships f1 JOIN friendships f2 ON f1.user1_id = f2.user2_id AND f1.user2_id = f2.user1_id.',
    starterSql: `SELECT f1.user1_id, f1.user2_id\nFROM friendships f1\nJOIN friendships f2\n  ON f1.user1_id = f2.user2_id\n AND f1.user2_id = f2.user1_id\nWHERE f1.user1_id < f1.user2_id;`,
    solutionSql: `SELECT f1.user1_id, f1.user2_id\nFROM friendships f1\nJOIN friendships f2\n  ON f1.user1_id = f2.user2_id\n AND f1.user2_id = f2.user1_id\nWHERE f1.user1_id < f1.user2_id;`,
    validateQuery: (result: QueryResult) => {
      if (result.columns.length >= 2) {
        return { passed: true, feedback: 'Awesome! Self-join successfully resolved reciprocal pairs.' };
      }
      return { passed: false, feedback: 'Verify your self-join conditions.' };
    },
  },
  {
    id: 'streaming-volume',
    number: 8,
    title: 'Top Track by Total Streams',
    difficulty: 'Easy',
    company: 'Spotify',
    category: 'INNER JOIN',
    domain: 'streaming',
    conceptTitle: 'Aggregating Telemetry across Foreign Keys',
    conceptSummary:
      'Joining catalog metadata (songs) to daily stream counts (playback_history) allows summing total plays.',
    conceptTip: 'SUM(playback_history.stream_count) grouped by song title.',
    prompt:
      'Find the total streams for each song, returning song title and total stream count ordered from highest to lowest.',
    hint: 'JOIN songs s ON p.song_id = s.id, GROUP BY s.title ORDER BY total_streams DESC.',
    starterSql: `SELECT s.title, SUM(p.stream_count) AS total_streams\nFROM songs s\nJOIN playback_history p\n  ON s.id = p.song_id\nGROUP BY s.title\nORDER BY total_streams DESC;`,
    solutionSql: `SELECT s.title, SUM(p.stream_count) AS total_streams\nFROM songs s\nJOIN playback_history p\n  ON s.id = p.song_id\nGROUP BY s.title\nORDER BY total_streams DESC;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 4 && result.columns.some((c) => c.toLowerCase().includes('stream'))) {
        return { passed: true, feedback: 'Great! Grouped stream history by song title.' };
      }
      return { passed: false, feedback: 'Expected total streams per song ordered descending.' };
    },
  },
  {
    id: 'high-value-customers',
    number: 9,
    title: 'High-Value Customer Lifetime Spend',
    difficulty: 'Medium',
    company: 'Stripe',
    category: 'INNER JOIN',
    domain: 'ecommerce',
    conceptTitle: 'Filtering Customer Aggregates',
    conceptSummary:
      'Calculate total lifetime spend per customer and keep customers who have spent over $500.',
    conceptTip: 'SUM(total_amount) > 500 in HAVING.',
    prompt:
      'List customers who have spent more than $500 across all completed orders.',
    hint: 'JOIN customers and orders, GROUP BY c.name, HAVING SUM(o.total_amount) > 500.',
    starterSql: `SELECT c.name, SUM(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o\n  ON c.id = o.customer_id\nWHERE o.status = 'Completed'\nGROUP BY c.name\nHAVING SUM(o.total_amount) > 500;`,
    solutionSql: `SELECT c.name, SUM(o.total_amount) AS total_spent\nFROM customers c\nJOIN orders o\n  ON c.id = o.customer_id\nWHERE o.status = 'Completed'\nGROUP BY c.name\nHAVING SUM(o.total_amount) > 500;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 2 && result.rows.every((r) => Number(r[1]) > 500)) {
        return { passed: true, feedback: 'Spot on! Filtered customers exceeding $500 total spend.' };
      }
      return { passed: false, feedback: 'Expected customers with total completed spend > 500.' };
    },
  },
  {
    id: 'post-engagement-ratio',
    number: 10,
    title: 'Video Engagement Like Ratio',
    difficulty: 'Medium',
    company: 'TikTok',
    category: 'SELECT',
    domain: 'social',
    conceptTitle: 'Calculated Metric Expressions',
    conceptSummary:
      'Compute engagement rate as (likes * 1.0 / views) * 100 for video posts.',
    conceptTip: 'Cast with 1.0 to ensure floating-point division in SQLite.',
    prompt:
      'For all video posts, calculate the engagement rate percentage: (likes * 100.0 / views) rounded to 2 decimals.',
    hint: 'SELECT id, ROUND((likes * 100.0 / views), 2) AS engagement_rate FROM posts WHERE content_type = "video".',
    starterSql: `SELECT id, user_id, views, likes, ROUND((likes * 100.0 / views), 2) AS engagement_rate\nFROM posts\nWHERE content_type = 'video'\nORDER BY engagement_rate DESC;`,
    solutionSql: `SELECT id, user_id, views, likes, ROUND((likes * 100.0 / views), 2) AS engagement_rate\nFROM posts\nWHERE content_type = 'video'\nORDER BY engagement_rate DESC;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 3 && result.columns.some((c) => c.toLowerCase().includes('engagement'))) {
        return { passed: true, feedback: 'Excellent! Calculated video engagement rates.' };
      }
      return { passed: false, feedback: 'Expected video engagement rates rounded to 2 decimal places.' };
    },
  },

  // =========================================================================
  // MODULE 2: RANKING & OFFSET WINDOW FUNCTIONS (11 - 20)
  // =========================================================================
  {
    id: 'dense-rank-salary',
    number: 11,
    title: 'Top 2 Salaries per Department (DENSE_RANK)',
    difficulty: 'Medium',
    company: 'Google',
    category: 'WINDOW FUNCTIONS',
    domain: 'core',
    conceptTitle: 'Ranking Rows within Partitions',
    conceptSummary:
      'DENSE_RANK() assigns consecutive ranks without skipping numbers when values tie. PARTITION BY resets ranks per department.',
    conceptTip:
      'Watch how the visualizer creates separate colored containers for each department before sorting.',
    prompt:
      'Rank employees by salary within each department using DENSE_RANK(), and return department_id, name, salary, and salary_rank.',
    hint: 'DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank.',
    starterSql: `SELECT department_id, name, salary,\n  DENSE_RANK() OVER (\n    PARTITION BY department_id\n    ORDER BY salary DESC\n  ) AS salary_rank\nFROM users\nWHERE department_id IS NOT NULL;`,
    solutionSql: `SELECT department_id, name, salary,\n  DENSE_RANK() OVER (\n    PARTITION BY department_id\n    ORDER BY salary DESC\n  ) AS salary_rank\nFROM users\nWHERE department_id IS NOT NULL;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasDense = parsed?.windowFunctions.some((w) => w.funcName === 'DENSE_RANK');
      if (result.rowCount >= 6 && hasDense) {
        return { passed: true, feedback: 'Spot on! DENSE_RANK() accurately ranked salaries per department.' };
      }
      return { passed: false, feedback: 'Expected DENSE_RANK() partitioned by department_id.' };
    },
  },
  {
    id: 'row-number-songs',
    number: 12,
    title: 'Unique Song Ranks per Artist (ROW_NUMBER)',
    difficulty: 'Easy',
    company: 'Spotify',
    category: 'WINDOW FUNCTIONS',
    domain: 'streaming',
    conceptTitle: 'Strict Sequential Ordering with ROW_NUMBER()',
    conceptSummary:
      'Unlike RANK(), ROW_NUMBER() always increments strictly (1, 2, 3...) regardless of ties.',
    conceptTip: 'ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY release_year DESC).',
    prompt:
      'Assign a sequential song number (1, 2, 3...) to each track per artist, ordered by release_year descending.',
    hint: 'ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY release_year DESC) AS song_num.',
    starterSql: `SELECT artist_id, title, release_year,\n  ROW_NUMBER() OVER (\n    PARTITION BY artist_id\n    ORDER BY release_year DESC\n  ) AS track_seq\nFROM songs;`,
    solutionSql: `SELECT artist_id, title, release_year,\n  ROW_NUMBER() OVER (\n    PARTITION BY artist_id\n    ORDER BY release_year DESC\n  ) AS track_seq\nFROM songs;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasRow = parsed?.windowFunctions.some((w) => w.funcName === 'ROW_NUMBER');
      if (result.rowCount >= 7 && hasRow) {
        return { passed: true, feedback: 'Perfect! Assigned sequential track numbers per artist.' };
      }
      return { passed: false, feedback: 'Use ROW_NUMBER() OVER (PARTITION BY artist_id ORDER BY release_year DESC).' };
    },
  },
  {
    id: 'lag-driver-gaps',
    number: 14,
    title: 'Previous Transaction Gap (LAG)',
    difficulty: 'Medium',
    company: 'Robinhood',
    category: 'WINDOW FUNCTIONS',
    domain: 'fintech',
    conceptTitle: 'Looking Behind with LAG()',
    conceptSummary:
      'LAG(column, offset) retrieves a value from a previous row in the partition without a self-join.',
    conceptTip:
      'Notice the first row in each partition receives NULL because there is no prior transaction.',
    prompt:
      'For each user in transactions, show their txn_date, amount, and the previous transaction amount using LAG().',
    hint: 'LAG(amount, 1) OVER (PARTITION BY user_id ORDER BY txn_date) AS prev_amount.',
    starterSql: `SELECT user_id, txn_date, amount,\n  LAG(amount, 1) OVER (\n    PARTITION BY user_id\n    ORDER BY txn_date\n  ) AS prev_amount\nFROM transactions;`,
    solutionSql: `SELECT user_id, txn_date, amount,\n  LAG(amount, 1) OVER (\n    PARTITION BY user_id\n    ORDER BY txn_date\n  ) AS prev_amount\nFROM transactions;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasLag = parsed?.windowFunctions.some((w) => w.funcName === 'LAG');
      if (result.rowCount >= 7 && hasLag) {
        return { passed: true, feedback: 'Nailed it! LAG() retrieved the prior transaction amount.' };
      }
      return { passed: false, feedback: 'Use LAG(amount, 1) OVER (PARTITION BY user_id ORDER BY txn_date).' };
    },
  },
  {
    id: 'lead-stock-quotes',
    number: 15,
    title: 'Next-Day Price Prediction (LEAD)',
    difficulty: 'Medium',
    company: 'Robinhood',
    category: 'WINDOW FUNCTIONS',
    domain: 'fintech',
    conceptTitle: 'Looking Forward with LEAD()',
    conceptSummary:
      'LEAD(column, offset) looks ahead to the subsequent row in the partition.',
    conceptTip: 'LEAD(close_price, 1) OVER (PARTITION BY ticker ORDER BY trade_date).',
    prompt:
      'Retrieve each stock quote, showing current close_price and the next day’s close_price as next_price.',
    hint: 'LEAD(close_price, 1) OVER (PARTITION BY ticker ORDER BY trade_date) AS next_price.',
    starterSql: `SELECT ticker, trade_date, close_price,\n  LEAD(close_price, 1) OVER (\n    PARTITION BY ticker\n    ORDER BY trade_date\n  ) AS next_price\nFROM stock_quotes;`,
    solutionSql: `SELECT ticker, trade_date, close_price,\n  LEAD(close_price, 1) OVER (\n    PARTITION BY ticker\n    ORDER BY trade_date\n  ) AS next_price\nFROM stock_quotes;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasLead = parsed?.windowFunctions.some((w) => w.funcName === 'LEAD');
      if (result.rowCount >= 9 && hasLead) {
        return { passed: true, feedback: 'Great! LEAD() successfully peeked at next day close prices.' };
      }
      return { passed: false, feedback: 'Use LEAD(close_price, 1) OVER (PARTITION BY ticker ORDER BY trade_date).' };
    },
  },
  {
    id: 'rank-ties-products',
    number: 16,
    title: 'Product Price Competition (RANK)',
    difficulty: 'Medium',
    company: 'Amazon',
    category: 'WINDOW FUNCTIONS',
    domain: 'ecommerce',
    conceptTitle: 'Handling Ties with RANK()',
    conceptSummary:
      'RANK() leaves gaps when ties occur (e.g. 1, 2, 2, 4), while DENSE_RANK() would produce 1, 2, 2, 3.',
    conceptTip: 'RANK() OVER (PARTITION BY category ORDER BY price DESC).',
    prompt:
      'Rank products by price within each category using standard RANK(), showing category, name, price, and rank.',
    hint: 'RANK() OVER (PARTITION BY category ORDER BY price DESC) AS price_rank.',
    starterSql: `SELECT category, name, price,\n  RANK() OVER (\n    PARTITION BY category\n    ORDER BY price DESC\n  ) AS price_rank\nFROM products;`,
    solutionSql: `SELECT category, name, price,\n  RANK() OVER (\n    PARTITION BY category\n    ORDER BY price DESC\n  ) AS price_rank\nFROM products;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasRank = parsed?.windowFunctions.some((w) => w.funcName === 'RANK');
      if (result.rowCount >= 5 && hasRank) {
        return { passed: true, feedback: 'Correct! Applied RANK() with partition by category.' };
      }
      return { passed: false, feedback: 'Use RANK() OVER (PARTITION BY category ORDER BY price DESC).' };
    },
  },
  {
    id: 'ntile-quartiles',
    number: 19,
    title: 'Customer Spending Quartiles (NTILE)',
    difficulty: 'Medium',
    company: 'Netflix',
    category: 'WINDOW FUNCTIONS',
    domain: 'ecommerce',
    conceptTitle: 'Bucketing with NTILE(n)',
    conceptSummary:
      'NTILE(4) divides rows into 4 equal percentile buckets (quartiles 1 to 4).',
    conceptTip: 'NTILE(4) OVER (ORDER BY total_amount DESC).',
    prompt:
      'Divide all orders into 4 quartile buckets based on total_amount descending.',
    hint: 'NTILE(4) OVER (ORDER BY total_amount DESC) AS spend_quartile.',
    starterSql: `SELECT id, customer_id, total_amount,\n  NTILE(4) OVER (\n    ORDER BY total_amount DESC\n  ) AS spend_quartile\nFROM orders;`,
    solutionSql: `SELECT id, customer_id, total_amount,\n  NTILE(4) OVER (\n    ORDER BY total_amount DESC\n  ) AS spend_quartile\nFROM orders;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasNtile = parsed?.windowFunctions.some((w) => w.funcName === 'NTILE');
      if (result.rowCount >= 6 && hasNtile) {
        return { passed: true, feedback: 'Awesome! Divided orders into 4 quartiles with NTILE(4).' };
      }
      return { passed: false, feedback: 'Use NTILE(4) OVER (ORDER BY total_amount DESC).' };
    },
  },

  // =========================================================================
  // MODULE 3: AGGREGATE WINDOW FUNCTIONS & ROLLING FRAMES (21 - 28)
  // =========================================================================
  {
    id: 'running-total-deposits',
    number: 21,
    title: 'Cumulative Running Balance (SUM OVER)',
    difficulty: 'Easy',
    company: 'Robinhood',
    category: 'WINDOW FUNCTIONS',
    domain: 'fintech',
    conceptTitle: 'Cumulative Sums with Default Frames',
    conceptSummary:
      'SUM(amount) OVER (PARTITION BY user_id ORDER BY txn_date) defaults to RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, producing a running sum.',
    conceptTip:
      'Watch how the running total accumulates row by row within each user partition.',
    prompt:
      'Compute the cumulative running total of transaction amounts for each user over time.',
    hint: 'SUM(amount) OVER (PARTITION BY user_id ORDER BY txn_date) AS running_balance.',
    starterSql: `SELECT user_id, txn_date, amount,\n  SUM(amount) OVER (\n    PARTITION BY user_id\n    ORDER BY txn_date\n  ) AS running_balance\nFROM transactions;`,
    solutionSql: `SELECT user_id, txn_date, amount,\n  SUM(amount) OVER (\n    PARTITION BY user_id\n    ORDER BY txn_date\n  ) AS running_balance\nFROM transactions;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasSum = parsed?.windowFunctions.some((w) => w.funcName === 'SUM');
      if (result.rowCount >= 7 && hasSum) {
        return { passed: true, feedback: 'Superb! Computed running balance across transactions.' };
      }
      return { passed: false, feedback: 'Use SUM(amount) OVER (PARTITION BY user_id ORDER BY txn_date).' };
    },
  },
  {
    id: 'moving-average-stocks',
    number: 22,
    title: '3-Day Rolling Average Stock Price (ROWS BETWEEN)',
    difficulty: 'Medium',
    company: 'Bloomberg',
    category: 'WINDOW FUNCTIONS',
    domain: 'fintech',
    conceptTitle: 'Sliding Frames with ROWS BETWEEN',
    conceptSummary:
      'Explicit frame ROWS BETWEEN 2 PRECEDING AND CURRENT ROW calculates the average over a 3-day sliding window.',
    conceptTip:
      'A sliding frame shifts down row by row, keeping exactly at most 3 rows in view.',
    prompt:
      'Calculate a 3-day moving average of close_price for each stock ticker, rounded to 2 decimals.',
    hint: 'ROUND(AVG(close_price) OVER (PARTITION BY ticker ORDER BY trade_date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 2).',
    starterSql: `SELECT ticker, trade_date, close_price,\n  ROUND(AVG(close_price) OVER (\n    PARTITION BY ticker\n    ORDER BY trade_date\n    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n  ), 2) AS moving_avg_3d\nFROM stock_quotes;`,
    solutionSql: `SELECT ticker, trade_date, close_price,\n  ROUND(AVG(close_price) OVER (\n    PARTITION BY ticker\n    ORDER BY trade_date\n    ROWS BETWEEN 2 PRECEDING AND CURRENT ROW\n  ), 2) AS moving_avg_3d\nFROM stock_quotes;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasAvg = parsed?.windowFunctions.some((w) => w.funcName === 'AVG');
      if (result.rowCount >= 9 && hasAvg) {
        return { passed: true, feedback: 'Outstanding! Calculated rolling 3-day moving averages.' };
      }
      return { passed: false, feedback: 'Use AVG(close_price) OVER (... ROWS BETWEEN 2 PRECEDING AND CURRENT ROW).' };
    },
  },
  {
    id: 'department-salary-ratio',
    number: 26,
    title: 'Salary Share of Department Total',
    difficulty: 'Medium',
    company: 'Apple',
    category: 'WINDOW FUNCTIONS',
    domain: 'core',
    conceptTitle: 'Partition Totals without Grouping',
    conceptSummary:
      'SUM(salary) OVER (PARTITION BY department_id) retains every employee while showing their department total.',
    conceptTip: 'Omit ORDER BY inside OVER() to aggregate across the entire partition.',
    prompt:
      'For each employee, show their salary and the percentage it represents of their entire department’s payroll.',
    hint: 'ROUND((salary * 100.0 / SUM(salary) OVER (PARTITION BY department_id)), 2) AS pct_of_dept.',
    starterSql: `SELECT department_id, name, salary,\n  ROUND((salary * 100.0 / SUM(salary) OVER (PARTITION BY department_id)), 2) AS pct_of_dept\nFROM users\nWHERE department_id IS NOT NULL;`,
    solutionSql: `SELECT department_id, name, salary,\n  ROUND((salary * 100.0 / SUM(salary) OVER (PARTITION BY department_id)), 2) AS pct_of_dept\nFROM users\nWHERE department_id IS NOT NULL;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasSum = parsed?.windowFunctions.some((w) => w.funcName === 'SUM');
      if (result.rowCount >= 6 && hasSum) {
        return { passed: true, feedback: 'Great! Computed salary percentage within departments.' };
      }
      return { passed: false, feedback: 'Use SUM(salary) OVER (PARTITION BY department_id).' };
    },
  },

  // =========================================================================
  // MODULE 4: COMMON TABLE EXPRESSIONS (CTEs) (29 - 36)
  // =========================================================================
  {
    id: 'cte-customer-first-order',
    number: 29,
    title: 'First Customer Purchase (CTE)',
    difficulty: 'Easy',
    company: 'Amazon',
    category: 'CTE',
    domain: 'ecommerce',
    conceptTitle: 'Modular Query Design with CTEs',
    conceptSummary:
      'WITH clause creates a reusable named temporary result set that makes complex queries easy to read.',
    conceptTip:
      'Watch the CTE node visualizer render intermediate tables step by step.',
    prompt:
      'Use a CTE named first_orders to find each customer’s minimum order date, then join with customers to return customer name and first_order_date.',
    hint: 'WITH first_orders AS (SELECT customer_id, MIN(order_date) AS first_date FROM orders GROUP BY customer_id) ...',
    starterSql: `WITH first_orders AS (\n  SELECT customer_id, MIN(order_date) AS first_date\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.name, f.first_date\nFROM customers c\nJOIN first_orders f\n  ON c.id = f.customer_id;`,
    solutionSql: `WITH first_orders AS (\n  SELECT customer_id, MIN(order_date) AS first_date\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.name, f.first_date\nFROM customers c\nJOIN first_orders f\n  ON c.id = f.customer_id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasCte = (parsed?.ctes.length ?? 0) > 0;
      if (result.rowCount >= 3 && hasCte) {
        return { passed: true, feedback: 'Spot on! Defined and joined with first_orders CTE.' };
      }
      return { passed: false, feedback: 'Use a WITH first_orders AS (...) CTE.' };
    },
  },
  {
    id: 'multi-cte-pipeline',
    number: 30,
    title: 'Department Payroll Statistics (Chained CTEs)',
    difficulty: 'Medium',
    company: 'Google',
    category: 'CTE',
    domain: 'core',
    conceptTitle: 'Chaining Multiple CTEs',
    conceptSummary:
      'Separate multiple CTEs with commas: WITH cte1 AS (...), cte2 AS (...) SELECT ...',
    conceptTip: 'Downstream CTEs can query upstream CTEs directly.',
    prompt:
      'Build a multi-CTE pipeline: dept_totals calculates SUM(salary) per department, and high_spenders filters departments with total salary > 200,000.',
    hint: 'WITH dept_totals AS (...), high_spenders AS (...) SELECT ...',
    starterSql: `WITH dept_totals AS (\n  SELECT department_id, SUM(salary) AS total_payroll\n  FROM users\n  WHERE department_id IS NOT NULL\n  GROUP BY department_id\n),\nhigh_spenders AS (\n  SELECT * FROM dept_totals WHERE total_payroll > 200000\n)\nSELECT d.name AS department, h.total_payroll\nFROM high_spenders h\nJOIN departments d ON h.department_id = d.id;`,
    solutionSql: `WITH dept_totals AS (\n  SELECT department_id, SUM(salary) AS total_payroll\n  FROM users\n  WHERE department_id IS NOT NULL\n  GROUP BY department_id\n),\nhigh_spenders AS (\n  SELECT * FROM dept_totals WHERE total_payroll > 200000\n)\nSELECT d.name AS department, h.total_payroll\nFROM high_spenders h\nJOIN departments d ON h.department_id = d.id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasMultipleCtes = (parsed?.ctes.length ?? 0) >= 2;
      if (result.rowCount >= 1 && hasMultipleCtes) {
        return { passed: true, feedback: 'Excellent! Successfully chained multiple CTE nodes.' };
      }
      return { passed: false, feedback: 'Define at least 2 chained CTEs (dept_totals, high_spenders).' };
    },
  },
  {
    id: 'recursive-number-series',
    number: 34,
    title: 'Generating Sequences (WITH RECURSIVE)',
    difficulty: 'Hard',
    company: 'Stripe',
    category: 'CTE',
    domain: 'core',
    conceptTitle: 'Recursive CTEs for Date Spines & Sequences',
    conceptSummary:
      'A recursive CTE has an anchor query, followed by UNION ALL, followed by a recursive step that terminates on a condition.',
    conceptTip: 'WITH RECURSIVE seq AS (SELECT 1 AS n UNION ALL SELECT n + 1 FROM seq WHERE n < 5).',
    prompt:
      'Generate a sequential numbers table from 1 to 5 using WITH RECURSIVE.',
    hint: 'WITH RECURSIVE nums(n) AS (SELECT 1 UNION ALL SELECT n + 1 FROM nums WHERE n < 5) SELECT n FROM nums;',
    starterSql: `WITH RECURSIVE nums(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM nums WHERE n < 5\n)\nSELECT n FROM nums;`,
    solutionSql: `WITH RECURSIVE nums(n) AS (\n  SELECT 1\n  UNION ALL\n  SELECT n + 1 FROM nums WHERE n < 5\n)\nSELECT n FROM nums;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const isRec = parsed?.ctes.some((c) => c.isRecursive);
      if (result.rowCount === 5 && isRec) {
        return { passed: true, feedback: 'Nailed it! Generated a recursive number sequence.' };
      }
      return { passed: false, feedback: 'Expected 5 rows generated via WITH RECURSIVE.' };
    },
  },

  // =========================================================================
  // MODULE 5: SUBQUERIES & CORRELATED LOGIC (37 - 44)
  // =========================================================================
  {
    id: 'scalar-subquery-avg',
    number: 37,
    title: 'Employees Above Company Average Salary',
    difficulty: 'Easy',
    company: 'Meta',
    category: 'SUBQUERIES',
    domain: 'core',
    conceptTitle: 'Scalar Subquery in WHERE',
    conceptSummary:
      'A subquery returning exactly 1 row and 1 column can be compared directly using >, <, or =.',
    conceptTip:
      'The inner subquery evaluates once to a single number (e.g. 131,250), which filters the outer query.',
    prompt:
      'Find all employees who earn more than the company-wide average salary.',
    hint: 'WHERE salary > (SELECT AVG(salary) FROM users).',
    starterSql: `SELECT name, role, salary\nFROM users\nWHERE salary > (SELECT AVG(salary) FROM users)\nORDER BY salary DESC;`,
    solutionSql: `SELECT name, role, salary\nFROM users\nWHERE salary > (SELECT AVG(salary) FROM users)\nORDER BY salary DESC;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasSub = (parsed?.subqueries.length ?? 0) > 0;
      if (result.rowCount >= 4 && hasSub) {
        return { passed: true, feedback: 'Great! Filtered employees against the scalar average subquery.' };
      }
      return { passed: false, feedback: 'Use WHERE salary > (SELECT AVG(salary) FROM users).' };
    },
  },
  {
    id: 'correlated-subquery-dept-avg',
    number: 38,
    title: 'Above Department Average (Correlated Subquery)',
    difficulty: 'Medium',
    company: 'Apple',
    category: 'SUBQUERIES',
    domain: 'core',
    conceptTitle: 'Correlated Subqueries',
    conceptSummary:
      'A correlated subquery references columns from the outer query row (e.g. inner.department_id = outer.department_id), evaluating once per outer row.',
    conceptTip:
      'Watch how the outer row cursor passes its department_id into the inner query.',
    prompt:
      'Find employees who earn strictly more than the average salary of their own department.',
    hint: 'WHERE salary > (SELECT AVG(salary) FROM users u2 WHERE u2.department_id = u1.department_id).',
    starterSql: `SELECT u1.name, u1.department_id, u1.salary\nFROM users u1\nWHERE u1.department_id IS NOT NULL\n  AND u1.salary > (\n    SELECT AVG(u2.salary)\n    FROM users u2\n    WHERE u2.department_id = u1.department_id\n  );`,
    solutionSql: `SELECT u1.name, u1.department_id, u1.salary\nFROM users u1\nWHERE u1.department_id IS NOT NULL\n  AND u1.salary > (\n    SELECT AVG(u2.salary)\n    FROM users u2\n    WHERE u2.department_id = u1.department_id\n  );`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasSub = (parsed?.subqueries.length ?? 0) > 0;
      if (result.rowCount >= 2 && hasSub) {
        return { passed: true, feedback: 'Spot on! Correlated subquery evaluated per department.' };
      }
      return { passed: false, feedback: 'Verify your correlated subquery matches u2.department_id = u1.department_id.' };
    },
  },
  {
    id: 'exists-customers-orders',
    number: 39,
    title: 'Active Customers Check (EXISTS)',
    difficulty: 'Easy',
    company: 'Amazon',
    category: 'SUBQUERIES',
    domain: 'ecommerce',
    conceptTitle: 'Boolean Existence with EXISTS',
    conceptSummary:
      'EXISTS tests whether a subquery returns any rows. It short-circuits on the first matching row, making it highly efficient.',
    conceptTip: 'WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id).',
    prompt:
      'Find all customers who have placed at least one order using the EXISTS operator.',
    hint: 'WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id).',
    starterSql: `SELECT c.id, c.name, c.country\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.id\n);`,
    solutionSql: `SELECT c.id, c.name, c.country\nFROM customers c\nWHERE EXISTS (\n  SELECT 1 FROM orders o\n  WHERE o.customer_id = c.id\n);`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasExists = parsed?.subqueries.some((s) => s.type === 'WHERE_EXISTS');
      if (result.rowCount >= 3 && hasExists) {
        return { passed: true, feedback: 'Correct! Used EXISTS to identify active customers.' };
      }
      return { passed: false, feedback: 'Use WHERE EXISTS (SELECT 1 FROM orders WHERE ...).' };
    },
  },

  // =========================================================================
  // MODULE 6: FAANG CAPSTONES (COMBINATIONS) (45 - 50)
  // =========================================================================
  {
    id: 'capstone-retention-top-earners',
    number: 45,
    title: 'Top Earner per Department with CTE + Window Function',
    difficulty: 'Hard',
    company: 'Meta',
    category: 'CAPSTONE',
    domain: 'core',
    conceptTitle: 'Combining CTEs and Window Functions',
    conceptSummary:
      'Because WHERE cannot directly filter window functions (since WHERE runs before window functions), wrapping the query in a CTE lets you filter WHERE rank = 1.',
    conceptTip:
      'Classic interview pattern: CTE ranks the rows, outer query filters rank = 1.',
    prompt:
      'Find the highest-paid employee in each department. Use a CTE to compute DENSE_RANK(), then filter for rank 1.',
    hint: 'WITH ranked AS (SELECT *, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rk FROM users WHERE department_id IS NOT NULL) SELECT * FROM ranked WHERE rk = 1;',
    starterSql: `WITH ranked_staff AS (\n  SELECT name, role, department_id, salary,\n    DENSE_RANK() OVER (\n      PARTITION BY department_id\n      ORDER BY salary DESC\n    ) AS rk\n  FROM users\n  WHERE department_id IS NOT NULL\n)\nSELECT department_id, name, salary\nFROM ranked_staff\nWHERE rk = 1\nORDER BY department_id;`,
    solutionSql: `WITH ranked_staff AS (\n  SELECT name, role, department_id, salary,\n    DENSE_RANK() OVER (\n      PARTITION BY department_id\n      ORDER BY salary DESC\n    ) AS rk\n  FROM users\n  WHERE department_id IS NOT NULL\n)\nSELECT department_id, name, salary\nFROM ranked_staff\nWHERE rk = 1\nORDER BY department_id;`,
    validateQuery: (result: QueryResult, parsed: ParsedQuery | null) => {
      const hasCte = (parsed?.ctes.length ?? 0) > 0;
      const hasDense = parsed?.rawSql.toUpperCase().includes('DENSE_RANK');
      if (result.rowCount === 3 && (hasCte || hasDense)) {
        return { passed: true, feedback: 'Mastery! Combined CTE and DENSE_RANK() to isolate top earners.' };
      }
      return { passed: false, feedback: 'Expected 3 top earners (1 per department) using CTE + DENSE_RANK.' };
    },
  },
  {
    id: 'capstone-stock-pct-change',
    number: 46,
    title: 'Day-over-Day Stock Price Delta (CTE + LAG)',
    difficulty: 'Hard',
    company: 'Citadel',
    category: 'CAPSTONE',
    domain: 'fintech',
    conceptTitle: 'Financial Time-Series Analysis',
    conceptSummary:
      'Combine LAG() in a CTE to fetch prior prices, then calculate percentage return: ((close - prior) / prior) * 100 in the outer query.',
    conceptTip: 'Round percentage changes to 2 decimal places.',
    prompt:
      'For AAPL quotes, compute the day-over-day price change percentage: ROUND(((close_price - prev_price) * 100.0 / prev_price), 2).',
    hint: 'WITH quote_lag AS (SELECT *, LAG(close_price) OVER (ORDER BY trade_date) as prev_price FROM stock_quotes WHERE ticker = "AAPL") SELECT ...',
    starterSql: `WITH price_history AS (\n  SELECT ticker, trade_date, close_price,\n    LAG(close_price, 1) OVER (\n      ORDER BY trade_date\n    ) AS prev_price\n  FROM stock_quotes\n  WHERE ticker = 'AAPL'\n)\nSELECT trade_date, close_price, prev_price,\n  ROUND(((close_price - prev_price) * 100.0 / prev_price), 2) AS daily_return_pct\nFROM price_history\nWHERE prev_price IS NOT NULL;`,
    solutionSql: `WITH price_history AS (\n  SELECT ticker, trade_date, close_price,\n    LAG(close_price, 1) OVER (\n      ORDER BY trade_date\n    ) AS prev_price\n  FROM stock_quotes\n  WHERE ticker = 'AAPL'\n)\nSELECT trade_date, close_price, prev_price,\n  ROUND(((close_price - prev_price) * 100.0 / prev_price), 2) AS daily_return_pct\nFROM price_history\nWHERE prev_price IS NOT NULL;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 4 && result.columns.some((c) => c.toLowerCase().includes('return'))) {
        return { passed: true, feedback: 'Brilliant! Time-series daily returns successfully computed.' };
      }
      return { passed: false, feedback: 'Expected daily return percentage for AAPL using CTE + LAG.' };
    },
  },
  {
    id: 'capstone-stream-market-share',
    number: 47,
    title: 'Artist Market Share of Total Streams (Window SUM)',
    difficulty: 'Hard',
    company: 'Spotify',
    category: 'CAPSTONE',
    domain: 'streaming',
    conceptTitle: 'Global Aggregates alongside Group Aggregates',
    conceptSummary:
      'Calculate artist stream sums in a CTE, then use SUM() OVER () in the outer query to get the global grand total for market share division.',
    conceptTip: 'SUM(total_streams) OVER () provides the grand total without collapsing rows.',
    prompt:
      'Calculate each artist’s total streams and their percentage share of all platform streams.',
    hint: 'WITH artist_streams AS (SELECT a.name, SUM(p.stream_count) as total FROM artists a JOIN songs s ON a.id = s.artist_id JOIN playback_history p ON s.id = p.song_id GROUP BY a.name) ...',
    starterSql: `WITH artist_totals AS (\n  SELECT a.name AS artist, SUM(p.stream_count) AS artist_streams\n  FROM artists a\n  JOIN songs s ON a.id = s.artist_id\n  JOIN playback_history p ON s.id = p.song_id\n  GROUP BY a.name\n)\nSELECT artist, artist_streams,\n  ROUND((artist_streams * 100.0 / SUM(artist_streams) OVER ()), 2) AS market_share_pct\nFROM artist_totals\nORDER BY market_share_pct DESC;`,
    solutionSql: `WITH artist_totals AS (\n  SELECT a.name AS artist, SUM(p.stream_count) AS artist_streams\n  FROM artists a\n  JOIN songs s ON a.id = s.artist_id\n  JOIN playback_history p ON s.id = p.song_id\n  GROUP BY a.name\n)\nSELECT artist, artist_streams,\n  ROUND((artist_streams * 100.0 / SUM(artist_streams) OVER ()), 2) AS market_share_pct\nFROM artist_totals\nORDER BY market_share_pct DESC;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 3 && result.columns.some((c) => c.toLowerCase().includes('share'))) {
        return { passed: true, feedback: 'Nailed it! Computed artist stream market share.' };
      }
      return { passed: false, feedback: 'Expected artist stream totals with market share percentage.' };
    },
  },
  {
    id: 'capstone-repeat-buyers',
    number: 48,
    title: 'Repeat Purchase Conversion (Window Count + CTE)',
    difficulty: 'Hard',
    company: 'Amazon',
    category: 'CAPSTONE',
    domain: 'ecommerce',
    conceptTitle: 'Detecting Repeat Buyers',
    conceptSummary:
      'COUNT(*) OVER (PARTITION BY customer_id) labels each order with the customer’s total order count.',
    conceptTip: 'Filter for customers whose total order count >= 2.',
    prompt:
      'List customers who have placed at least 2 distinct orders, showing customer name, order ID, and order date.',
    hint: 'WITH tagged_orders AS (SELECT c.name, o.id, o.order_date, COUNT(*) OVER (PARTITION BY c.id) as order_cnt FROM customers c JOIN orders o ON c.id = o.customer_id) SELECT ... WHERE order_cnt >= 2;',
    starterSql: `WITH order_counts AS (\n  SELECT c.name AS customer, o.id AS order_id, o.order_date,\n    COUNT(*) OVER (PARTITION BY c.id) AS total_orders\n  FROM customers c\n  JOIN orders o ON c.id = o.customer_id\n)\nSELECT customer, order_id, order_date\nFROM order_counts\nWHERE total_orders >= 2\nORDER BY customer, order_date;`,
    solutionSql: `WITH order_counts AS (\n  SELECT c.name AS customer, o.id AS order_id, o.order_date,\n    COUNT(*) OVER (PARTITION BY c.id) AS total_orders\n  FROM customers c\n  JOIN orders o ON c.id = o.customer_id\n)\nSELECT customer, order_id, order_date\nFROM order_counts\nWHERE total_orders >= 2\nORDER BY customer, order_date;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 4) {
        return { passed: true, feedback: 'Spot on! Identified orders from repeat buyers.' };
      }
      return { passed: false, feedback: 'Expected orders from repeat buyers (total_orders >= 2).' };
    },
  },
  {
    id: 'capstone-creator-growth',
    number: 49,
    title: 'Creator View Momentum (LEAD vs LAG)',
    difficulty: 'Hard',
    company: 'TikTok',
    category: 'CAPSTONE',
    domain: 'social',
    conceptTitle: 'Measuring Content Momentum',
    conceptSummary:
      'Compare consecutive post views for each user to determine if audience engagement is accelerating.',
    conceptTip: 'LAG(views) OVER (PARTITION BY user_id ORDER BY post_date).',
    prompt:
      'For each user, compute the view growth between consecutive posts: (views - prev_views).',
    hint: 'LAG(views, 1) OVER (PARTITION BY user_id ORDER BY post_date) AS prev_views.',
    starterSql: `SELECT user_id, post_date, views,\n  LAG(views, 1) OVER (\n    PARTITION BY user_id\n    ORDER BY post_date\n  ) AS prev_views,\n  (views - LAG(views, 1) OVER (\n    PARTITION BY user_id\n    ORDER BY post_date\n  )) AS view_growth\nFROM posts;`,
    solutionSql: `SELECT user_id, post_date, views,\n  LAG(views, 1) OVER (\n    PARTITION BY user_id\n    ORDER BY post_date\n  ) AS prev_views,\n  (views - LAG(views, 1) OVER (\n    PARTITION BY user_id\n    ORDER BY post_date\n  )) AS view_growth\nFROM posts;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 5 && result.columns.some((c) => c.toLowerCase().includes('growth'))) {
        return { passed: true, feedback: 'Awesome! Calculated view momentum per creator.' };
      }
      return { passed: false, feedback: 'Expected post view delta using LAG().' };
    },
  },
  {
    id: 'capstone-customer-retention',
    number: 50,
    title: 'Active Customer Retention Matrix (FAANG Final)',
    difficulty: 'Hard',
    company: 'Uber',
    category: 'CAPSTONE',
    domain: 'ecommerce',
    conceptTitle: 'The Ultimate FAANG SQL Capstone',
    conceptSummary:
      'Synthesizes CTEs, date functions, and ranking to build customer retention cohort summaries.',
    conceptTip: 'Congratulations on reaching the final milestone challenge!',
    prompt:
      'Find all customers who made their first order in January 2024 and placed another order later. Return customer name and their total lifetime orders.',
    hint: 'WITH first_orders AS (SELECT customer_id, MIN(order_date) as first_dt, COUNT(*) as total_cnt FROM orders GROUP BY customer_id) SELECT ...',
    starterSql: `WITH customer_stats AS (\n  SELECT customer_id,\n    MIN(order_date) AS first_order_date,\n    COUNT(*) AS lifetime_orders\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.name, cs.first_order_date, cs.lifetime_orders\nFROM customers c\nJOIN customer_stats cs\n  ON c.id = cs.customer_id\nWHERE cs.first_order_date LIKE '2024-01%'\n  AND cs.lifetime_orders > 1;`,
    solutionSql: `WITH customer_stats AS (\n  SELECT customer_id,\n    MIN(order_date) AS first_order_date,\n    COUNT(*) AS lifetime_orders\n  FROM orders\n  GROUP BY customer_id\n)\nSELECT c.name, cs.first_order_date, cs.lifetime_orders\nFROM customers c\nJOIN customer_stats cs\n  ON c.id = cs.customer_id\nWHERE cs.first_order_date LIKE '2024-01%'\n  AND cs.lifetime_orders > 1;`,
    validateQuery: (result: QueryResult) => {
      if (result.rowCount >= 1 && result.columns.some((c) => c.toLowerCase().includes('lifetime'))) {
        return { passed: true, feedback: '🏆 Congratulations! You solved the final FAANG SQL Capstone!' };
      }
      return { passed: false, feedback: 'Expected customers whose first order was in Jan 2024 and have > 1 lifetime orders.' };
    },
  },
];
