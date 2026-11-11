'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Database, SqlJsStatic } from 'sql.js';
import { SEED_SQL } from '@/data/seed';
import { buildVisualizationSnapshot, VizSnapshot } from '@/lib/buildVizPlan';
import { parseSqlForVisualization } from '@/lib/sqlParser';
import { ParsedQuery, QueryResult, SqlRow } from '@/types/sql';

export interface ExecutionSuccess {
  ok: true;
  result: QueryResult;
  parsed: ParsedQuery;
  vizSnapshot: VizSnapshot;
  isNonSelectNotice?: string;
}

export interface ExecutionFailure {
  ok: false;
  error: string;
}

export type ExecutionOutcome = ExecutionSuccess | ExecutionFailure;

export function useDatabase() {
  const sqlModuleRef = useRef<SqlJsStatic | null>(null);
  const dbRef = useRef<Database | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [dbRevision, setDbRevision] = useState(0);

  const seedNewDatabase = useCallback((SQL: SqlJsStatic) => {
    if (dbRef.current) {
      try {
        dbRef.current.close();
      } catch {
        // Ignore close error on already-closed instance
      }
    }
    const db = new SQL.Database();
    db.exec(SEED_SQL);
    dbRef.current = db;
    setDbRevision((r) => r + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setIsLoading(true);
        setDbError(null);
        const sqlModule = await import('sql.js/dist/sql-wasm-browser.js');
        const initSqlJs =
          typeof sqlModule.default === 'function'
            ? sqlModule.default
            : (sqlModule as unknown as (
                config?: { locateFile?: (file: string) => string }
              ) => Promise<SqlJsStatic>);
        const SQL = await initSqlJs({
          locateFile: (file: string) => `/${file}`,
        });

        if (cancelled) return;
        sqlModuleRef.current = SQL;
        seedNewDatabase(SQL);
        setIsReady(true);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to initialize WebAssembly SQLite engine.';
        setDbError(message);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      if (dbRef.current) {
        try {
          dbRef.current.close();
        } catch {
          // Ignore
        }
        dbRef.current = null;
      }
    };
  }, [seedNewDatabase]);

  const resetDatabase = useCallback(() => {
    if (!sqlModuleRef.current) return;
    seedNewDatabase(sqlModuleRef.current);
  }, [seedNewDatabase]);

  const getTableRows = useCallback(
    (tableName: string): QueryResult | null => {
      if (!dbRef.current) return null;
      try {
        const res = dbRef.current.exec(`SELECT * FROM "${tableName}"`);
        if (!res.length) {
          return {
            columns: [],
            rows: [],
            rowObjects: [],
            executionTimeMs: 0,
            rowCount: 0,
          };
        }
        const { columns, values } = res[0];
        const rowObjects: SqlRow[] = values.map((vals) => {
          const obj: SqlRow = {};
          columns.forEach((col, i) => {
            obj[col] = vals[i];
          });
          return obj;
        });
        return {
          columns,
          rows: values,
          rowObjects,
          executionTimeMs: 0,
          rowCount: values.length,
        };
      } catch {
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dbRevision]
  );

  const executeQuery = useCallback((rawSql: string): ExecutionOutcome => {
    const db = dbRef.current;
    if (!db) {
      return {
        ok: false,
        error: 'SQLite engine is still initializing. Please wait a moment.',
      };
    }

    const trimmed = rawSql.trim();
    if (!trimmed) {
      return {
        ok: false,
        error: 'Enter a SQL query before running.',
      };
    }

    const start = performance.now();
    try {
      const execResults = db.exec(trimmed);
      const elapsed = Math.max(0.1, Number((performance.now() - start).toFixed(2)));

      const parsed = parseSqlForVisualization(trimmed);
      if (!parsed.isSelect) {
        setDbRevision((r) => r + 1);
      }

      const lastSet = execResults.length
        ? execResults[execResults.length - 1]
        : null;

      let columns: string[] = [];
      let rows: (string | number | Uint8Array | null)[][] = [];

      if (lastSet) {
        columns = lastSet.columns;
        rows = lastSet.values;
      } else if (parsed.isSelect) {
        // Query executed cleanly with 0 rows; prepare statement briefly to get column headers!
        try {
          const stmt = db.prepare(trimmed);
          columns = stmt.getColumnNames();
          stmt.free();
        } catch {
          columns = [];
        }
      }

      const rowObjects: SqlRow[] = rows.map((vals) => {
        const obj: SqlRow = {};
        columns.forEach((col, i) => {
          obj[col] = vals[i];
        });
        return obj;
      });

      const result: QueryResult = {
        columns,
        rows,
        rowObjects,
        executionTimeMs: elapsed,
        rowCount: rows.length,
      };

      const vizSnapshot = buildVisualizationSnapshot(db, parsed);

      return {
        ok: true,
        result,
        parsed,
        vizSnapshot,
        isNonSelectNotice:
          !lastSet && !parsed.isSelect
            ? `Statement executed successfully (${db.getRowsModified()} row(s) affected).`
            : undefined,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown SQL execution error.';
      return {
        ok: false,
        error: message,
      };
    }
  }, []);

  return {
    isReady,
    isLoading,
    dbError,
    dbRevision,
    executeQuery,
    resetDatabase,
    getTableRows,
  };
}
