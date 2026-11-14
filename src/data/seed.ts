import { TableSchema } from '@/types/sql';

export const SCHEMA_METADATA: TableSchema[] = [
  // ==========================================
  // 1. CORE ORGANIZATIONAL DOMAIN
  // ==========================================
  {
    name: 'users',
    domain: 'core',
    description: 'Employees and contractors with roles, departments, and salaries.',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        nullable: false,
        description: 'Unique team member identifier.',
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        description: 'Full name.',
      },
      {
        name: 'role',
        type: 'TEXT',
        nullable: false,
        description: 'Job title / engagement role.',
      },
      {
        name: 'department_id',
        type: 'INTEGER',
        foreignKey: {
          table: 'departments',
          column: 'id',
        },
        nullable: true,
        description: 'Foreign key referencing departments.id (NULL if contractor).',
      },
      {
        name: 'salary',
        type: 'INTEGER',
        nullable: false,
        description: 'Annual salary in USD.',
      },
    ],
  },
  {
    name: 'departments',
    domain: 'core',
    description: 'Organizational divisions and office locations.',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        nullable: false,
        description: 'Department ID.',
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        description: 'Department name.',
      },
      {
        name: 'location',
        type: 'TEXT',
        nullable: false,
        description: 'Office city.',
      },
    ],
  },

  // ==========================================
  // 2. STREAMING DOMAIN (Spotify / Netflix)
  // ==========================================
  {
    name: 'artists',
    domain: 'streaming',
    description: 'Music creators and bands.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Artist ID.' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Artist or band name.' },
      { name: 'genre', type: 'TEXT', nullable: false, description: 'Primary musical genre.' },
      { name: 'country', type: 'TEXT', nullable: false, description: 'Country of origin.' },
    ],
  },
  {
    name: 'songs',
    domain: 'streaming',
    description: 'Catalog of recorded tracks.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Song ID.' },
      { name: 'title', type: 'TEXT', nullable: false, description: 'Track title.' },
      {
        name: 'artist_id',
        type: 'INTEGER',
        foreignKey: { table: 'artists', column: 'id' },
        nullable: false,
        description: 'References artists.id.',
      },
      { name: 'release_year', type: 'INTEGER', nullable: false, description: 'Year released.' },
      { name: 'duration_sec', type: 'INTEGER', nullable: false, description: 'Track duration in seconds.' },
    ],
  },
  {
    name: 'playback_history',
    domain: 'streaming',
    description: 'Daily streaming telemetry and song plays.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Event ID.' },
      { name: 'user_id', type: 'INTEGER', nullable: false, description: 'Listener user ID.' },
      {
        name: 'song_id',
        type: 'INTEGER',
        foreignKey: { table: 'songs', column: 'id' },
        nullable: false,
        description: 'References songs.id.',
      },
      { name: 'stream_date', type: 'TEXT', nullable: false, description: 'Date of stream (YYYY-MM-DD).' },
      { name: 'stream_count', type: 'INTEGER', nullable: false, description: 'Streams logged that day.' },
    ],
  },

  // ==========================================
  // 3. E-COMMERCE DOMAIN (Amazon / Shopify)
  // ==========================================
  {
    name: 'customers',
    domain: 'ecommerce',
    description: 'Registered e-commerce buyers.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Customer ID.' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Customer name.' },
      { name: 'country', type: 'TEXT', nullable: false, description: 'Customer country.' },
      { name: 'signup_date', type: 'TEXT', nullable: false, description: 'Account registration date.' },
    ],
  },
  {
    name: 'products',
    domain: 'ecommerce',
    description: 'Item catalog with categories and prices.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Product ID.' },
      { name: 'name', type: 'TEXT', nullable: false, description: 'Product name.' },
      { name: 'category', type: 'TEXT', nullable: false, description: 'Category (Electronics, Home, etc.).' },
      { name: 'price', type: 'REAL', nullable: false, description: 'Unit price in USD.' },
    ],
  },
  {
    name: 'orders',
    domain: 'ecommerce',
    description: 'Placed orders and checkout statuses.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Order ID.' },
      {
        name: 'customer_id',
        type: 'INTEGER',
        foreignKey: { table: 'customers', column: 'id' },
        nullable: false,
        description: 'References customers.id.',
      },
      { name: 'order_date', type: 'TEXT', nullable: false, description: 'Date placed.' },
      { name: 'total_amount', type: 'REAL', nullable: false, description: 'Total charge in USD.' },
      { name: 'status', type: 'TEXT', nullable: false, description: 'Status (Completed, Shipped, Cancelled).' },
    ],
  },

  // ==========================================
  // 4. FINTECH DOMAIN (Robinhood / Stripe)
  // ==========================================
  {
    name: 'transactions',
    domain: 'fintech',
    description: 'Banking transactions and deposits.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Transaction ID.' },
      { name: 'user_id', type: 'INTEGER', nullable: false, description: 'Account owner user ID.' },
      { name: 'txn_date', type: 'TEXT', nullable: false, description: 'Transaction date (YYYY-MM-DD).' },
      { name: 'txn_type', type: 'TEXT', nullable: false, description: 'DEPOSIT, WITHDRAWAL, or PURCHASE.' },
      { name: 'amount', type: 'REAL', nullable: false, description: 'Transaction amount in USD.' },
      { name: 'category', type: 'TEXT', nullable: false, description: 'Merchant / category description.' },
    ],
  },
  {
    name: 'stock_quotes',
    domain: 'fintech',
    description: 'Daily stock market prices for rolling average calculations.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Quote ID.' },
      { name: 'ticker', type: 'TEXT', nullable: false, description: 'Stock ticker symbol (e.g. AAPL, MSFT).' },
      { name: 'trade_date', type: 'TEXT', nullable: false, description: 'Trading day (YYYY-MM-DD).' },
      { name: 'close_price', type: 'REAL', nullable: false, description: 'Closing price in USD.' },
      { name: 'volume', type: 'INTEGER', nullable: false, description: 'Total shares traded.' },
    ],
  },

  // ==========================================
  // 5. SOCIAL DOMAIN (Meta / TikTok)
  // ==========================================
  {
    name: 'posts',
    domain: 'social',
    description: 'Feed posts and engagement metrics.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Post ID.' },
      { name: 'user_id', type: 'INTEGER', nullable: false, description: 'Author user ID.' },
      { name: 'post_date', type: 'TEXT', nullable: false, description: 'Publish date.' },
      { name: 'content_type', type: 'TEXT', nullable: false, description: 'video, image, or text.' },
      { name: 'views', type: 'INTEGER', nullable: false, description: 'Total views.' },
      { name: 'likes', type: 'INTEGER', nullable: false, description: 'Total likes.' },
    ],
  },
  {
    name: 'friendships',
    domain: 'social',
    description: 'Social graph connections.',
    columns: [
      { name: 'id', type: 'INTEGER', isPrimaryKey: true, nullable: false, description: 'Friendship ID.' },
      { name: 'user1_id', type: 'INTEGER', nullable: false, description: 'First user ID.' },
      { name: 'user2_id', type: 'INTEGER', nullable: false, description: 'Second user ID.' },
      { name: 'established_date', type: 'TEXT', nullable: false, description: 'Connection established date.' },
    ],
  },
];

export const SEED_SQL = `
-- Drop existing tables
DROP TABLE IF EXISTS friendships;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS stock_quotes;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS playback_history;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS artists;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

-- 1. Core Domain
CREATE TABLE departments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  department_id INTEGER,
  salary INTEGER NOT NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO departments (id, name, location) VALUES
  (1, 'Engineering', 'San Francisco'),
  (2, 'Design', 'New York'),
  (3, 'Product', 'Austin'),
  (4, 'Research', 'Zurich');

INSERT INTO users (id, name, role, department_id, salary) VALUES
  (1, 'Alice Chen', 'Staff Engineer', 1, 165000),
  (2, 'Marcus Vance', 'Lead Designer', 2, 130000),
  (3, 'Priya Patel', 'Backend Engineer', 1, 140000),
  (4, 'Sofia Rossi', 'Product Manager', 3, 135000),
  (5, 'Jordan Kim', 'Contractor', NULL, 95000),
  (6, 'Elena Rostova', 'Senior Engineer', 1, 155000),
  (7, 'Liam Smith', 'Junior Designer', 2, 85000),
  (8, 'David Zhao', 'Associate PM', 3, 105000);

-- 2. Streaming Domain
CREATE TABLE artists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  genre TEXT NOT NULL,
  country TEXT NOT NULL
);

CREATE TABLE songs (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  artist_id INTEGER NOT NULL,
  release_year INTEGER NOT NULL,
  duration_sec INTEGER NOT NULL,
  FOREIGN KEY (artist_id) REFERENCES artists(id)
);

CREATE TABLE playback_history (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  song_id INTEGER NOT NULL,
  stream_date TEXT NOT NULL,
  stream_count INTEGER NOT NULL,
  FOREIGN KEY (song_id) REFERENCES songs(id)
);

INSERT INTO artists (id, name, genre, country) VALUES
  (1, 'Daft Punk', 'Electronic', 'France'),
  (2, 'The Weeknd', 'R&B', 'Canada'),
  (3, 'Taylor Swift', 'Pop', 'USA'),
  (4, 'Billie Eilish', 'Alt-Pop', 'USA');

INSERT INTO songs (id, title, artist_id, release_year, duration_sec) VALUES
  (101, 'Get Lucky', 1, 2013, 369),
  (102, 'Instant Crush', 1, 2013, 337),
  (103, 'Starboy', 2, 2016, 230),
  (104, 'Blinding Lights', 2, 2019, 200),
  (105, 'Save Your Tears', 2, 2020, 215),
  (106, 'Anti-Hero', 3, 2022, 200),
  (107, 'Cruel Summer', 3, 2019, 178),
  (108, 'Bad Guy', 4, 2019, 194);

INSERT INTO playback_history (id, user_id, song_id, stream_date, stream_count) VALUES
  (1, 10, 104, '2024-01-01', 5200),
  (2, 10, 103, '2024-01-01', 3100),
  (3, 11, 101, '2024-01-01', 4800),
  (4, 11, 102, '2024-01-01', 2900),
  (5, 12, 106, '2024-01-01', 6500),
  (6, 12, 107, '2024-01-01', 7100),
  (7, 10, 104, '2024-01-02', 5400),
  (8, 10, 105, '2024-01-02', 4100),
  (9, 12, 106, '2024-01-02', 6800),
  (10, 13, 108, '2024-01-02', 3900);

-- 3. E-commerce Domain
CREATE TABLE customers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  signup_date TEXT NOT NULL
);

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  order_date TEXT NOT NULL,
  total_amount REAL NOT NULL,
  status TEXT NOT NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

INSERT INTO customers (id, name, country, signup_date) VALUES
  (1, 'TechNova Inc', 'USA', '2023-02-15'),
  (2, 'Aura Retail', 'UK', '2023-05-10'),
  (3, 'Zenith Labs', 'Germany', '2023-08-22'),
  (4, 'Apex Logistics', 'USA', '2023-11-01'),
  (5, 'Beacon Health', 'Canada', '2024-01-14');

INSERT INTO products (id, name, category, price) VALUES
  (1, '4K Ultra Monitor', 'Electronics', 499.99),
  (2, 'Mechanical Keyboard', 'Electronics', 129.50),
  (3, 'Wireless ANC Headphones', 'Electronics', 249.00),
  (4, 'Ergonomic Standing Desk', 'Furniture', 650.00),
  (5, 'Lumbar Support Chair', 'Furniture', 380.00),
  (6, 'USB-C Docking Hub', 'Accessories', 89.99);

INSERT INTO orders (id, customer_id, order_date, total_amount, status) VALUES
  (1001, 1, '2024-01-05', 629.49, 'Completed'),
  (1002, 2, '2024-01-12', 129.50, 'Completed'),
  (1003, 1, '2024-01-18', 1030.00, 'Completed'),
  (1004, 3, '2024-02-02', 380.00, 'Shipped'),
  (1005, 4, '2024-02-14', 89.99, 'Cancelled'),
  (1006, 2, '2024-02-20', 739.99, 'Completed'),
  (1007, 1, '2024-03-01', 249.00, 'Completed');

-- 4. Fintech Domain
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  txn_date TEXT NOT NULL,
  txn_type TEXT NOT NULL,
  amount REAL NOT NULL,
  category TEXT NOT NULL
);

CREATE TABLE stock_quotes (
  id INTEGER PRIMARY KEY,
  ticker TEXT NOT NULL,
  trade_date TEXT NOT NULL,
  close_price REAL NOT NULL,
  volume INTEGER NOT NULL
);

INSERT INTO transactions (id, user_id, txn_date, txn_type, amount, category) VALUES
  (1, 101, '2024-01-02', 'DEPOSIT', 2500.00, 'Payroll'),
  (2, 101, '2024-01-03', 'PURCHASE', 65.40, 'Groceries'),
  (3, 101, '2024-01-05', 'PURCHASE', 120.00, 'Utilities'),
  (4, 102, '2024-01-02', 'DEPOSIT', 4000.00, 'Payroll'),
  (5, 102, '2024-01-04', 'PURCHASE', 350.00, 'Electronics'),
  (6, 101, '2024-01-15', 'DEPOSIT', 2500.00, 'Payroll'),
  (7, 102, '2024-01-18', 'PURCHASE', 85.20, 'Dining'),
  (8, 103, '2024-01-08', 'DEPOSIT', 1800.00, 'Freelance');

INSERT INTO stock_quotes (id, ticker, trade_date, close_price, volume) VALUES
  (1, 'AAPL', '2024-01-02', 185.64, 82488700),
  (2, 'AAPL', '2024-01-03', 184.25, 58414500),
  (3, 'AAPL', '2024-01-04', 181.91, 71983600),
  (4, 'AAPL', '2024-01-05', 181.18, 62303300),
  (5, 'AAPL', '2024-01-08', 185.56, 59144500),
  (6, 'MSFT', '2024-01-02', 370.87, 25258600),
  (7, 'MSFT', '2024-01-03', 370.60, 23083500),
  (8, 'MSFT', '2024-01-04', 367.94, 20901500),
  (9, 'MSFT', '2024-01-05', 367.75, 20982400),
  (10, 'MSFT', '2024-01-08', 374.69, 23134000);

-- 5. Social Domain
CREATE TABLE posts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  post_date TEXT NOT NULL,
  content_type TEXT NOT NULL,
  views INTEGER NOT NULL,
  likes INTEGER NOT NULL
);

CREATE TABLE friendships (
  id INTEGER PRIMARY KEY,
  user1_id INTEGER NOT NULL,
  user2_id INTEGER NOT NULL,
  established_date TEXT NOT NULL
);

INSERT INTO posts (id, user_id, post_date, content_type, views, likes) VALUES
  (1, 1, '2024-01-01', 'video', 14500, 1200),
  (2, 1, '2024-01-05', 'image', 6200, 540),
  (3, 2, '2024-01-02', 'video', 32000, 4800),
  (4, 2, '2024-01-10', 'text', 1800, 110),
  (5, 3, '2024-01-03', 'image', 9400, 890),
  (6, 1, '2024-01-12', 'video', 21000, 2300),
  (7, 4, '2024-01-04', 'video', 45000, 5600);

INSERT INTO friendships (id, user1_id, user2_id, established_date) VALUES
  (1, 1, 2, '2023-01-15'),
  (2, 1, 3, '2023-03-20'),
  (3, 2, 4, '2023-06-11'),
  (4, 3, 4, '2023-09-05');
`;
