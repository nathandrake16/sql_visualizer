import { TableSchema } from '@/types/sql';

export const SCHEMA_METADATA: TableSchema[] = [
  {
    name: 'users',
    description: 'Employees and contractors working across company teams.',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        nullable: false,
        description: 'Unique identifier for each person.',
      },
      {
        name: 'name',
        type: 'TEXT',
        nullable: false,
        description: 'Full name of the team member.',
      },
      {
        name: 'role',
        type: 'TEXT',
        nullable: false,
        description: 'Job title or engagement role.',
      },
      {
        name: 'department_id',
        type: 'INTEGER',
        foreignKey: {
          table: 'departments',
          column: 'id',
        },
        nullable: true,
        description: 'References departments.id (NULL if unassigned).',
      },
    ],
  },
  {
    name: 'departments',
    description: 'Organizational departments and office locations.',
    columns: [
      {
        name: 'id',
        type: 'INTEGER',
        isPrimaryKey: true,
        nullable: false,
        description: 'Unique department identifier.',
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
        description: 'Primary office city.',
      },
    ],
  },
];

export const SEED_SQL = `
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS departments;

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
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

INSERT INTO departments (id, name, location) VALUES
  (1, 'Engineering', 'San Francisco'),
  (2, 'Design', 'New York'),
  (3, 'Product', 'Austin'),
  (4, 'Research', 'Zurich');

INSERT INTO users (id, name, role, department_id) VALUES
  (1, 'Alice Chen', 'Staff Engineer', 1),
  (2, 'Marcus Vance', 'Lead Designer', 2),
  (3, 'Priya Patel', 'Backend Engineer', 1),
  (4, 'Sofia Rossi', 'Product Manager', 3),
  (5, 'Jordan Kim', 'Contractor', NULL);
`;
