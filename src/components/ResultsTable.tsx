'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, TableProperties } from 'lucide-react';
import { QueryResult } from '@/types/sql';

interface ResultsTableProps {
  result: QueryResult | null;
  error: string | null;
  notice?: string;
}

export function ResultsTable({ result, error, notice }: ResultsTableProps) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0E1420] shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0B101B] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Query Output
          </span>
        </div>

        {result && !error && (
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="rounded-md border border-slate-800 bg-slate-900/90 px-2 py-0.5 font-mono text-slate-300">
              {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-slate-400">
              <Clock className="h-3 w-3 text-slate-500" />
              {result.executionTimeMs} ms
            </span>
          </div>
        )}
      </div>

      {error ? (
        <div className="m-3 flex items-start gap-3 rounded-lg border border-rose-500/40 bg-rose-500/10 p-3.5 text-xs text-rose-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
          <div>
            <div className="font-semibold text-rose-300">SQL Syntax or Execution Error</div>
            <p className="mt-1 font-mono text-[12px] leading-relaxed text-rose-100/90">
              {error}
            </p>
            <p className="mt-1.5 text-[11px] text-rose-300/75">
              Tip: Verify table names (<code>users</code>, <code>departments</code>), column spelling, and quote strings with single quotes (<code>&apos;Engineering&apos;</code>).
            </p>
          </div>
        </div>
      ) : notice ? (
        <div className="m-3 flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{notice}</span>
        </div>
      ) : !result ? (
        <div className="flex h-36 items-center justify-center p-6 text-xs text-slate-500">
          Run a query to inspect results here.
        </div>
      ) : result.columns.length === 0 ? (
        <div className="flex h-32 items-center justify-center p-6 text-xs text-slate-400">
          Query returned no columns.
        </div>
      ) : (
        <div className="max-h-60 overflow-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="sticky top-0 z-10 bg-[#0B101B] shadow-[0_1px_0_rgba(148,163,184,0.12)]">
              <tr>
                <th className="w-10 border-b border-slate-800 px-3 py-2 text-center font-mono text-[10px] font-medium text-slate-500">
                  #
                </th>
                {result.columns.map((col, idx) => (
                  <th
                    key={`${col}-${idx}`}
                    className="border-b border-slate-800 px-3 py-2 font-mono text-[11px] font-semibold text-slate-300"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {result.rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={result.columns.length + 1}
                    className="px-4 py-8 text-center text-xs text-slate-400"
                  >
                    0 rows matched this query.
                  </td>
                </tr>
              ) : (
                result.rows.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className="transition-colors hover:bg-slate-800/35"
                  >
                    <td className="px-3 py-2 text-center font-mono text-[10px] text-slate-500">
                      {rowIdx + 1}
                    </td>
                    {row.map((cell, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-3 py-2 font-mono text-xs text-slate-200"
                      >
                        {cell === null ? (
                          <span className="inline-flex items-center rounded border border-slate-700/80 bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-semibold italic tracking-wide text-slate-400">
                            NULL
                          </span>
                        ) : (
                          <span>{String(cell)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
