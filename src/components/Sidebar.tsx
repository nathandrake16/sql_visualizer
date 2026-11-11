'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Link2,
  Sparkles,
  Table2,
} from 'lucide-react';
import { SCHEMA_METADATA } from '@/data/seed';
import { Challenge, QueryResult } from '@/types/sql';

interface SidebarProps {
  challenges: Challenge[];
  activeChallengeId: string | null;
  solvedIds: Set<string>;
  onSelectChallenge: (challengeId: string | null) => void;
  onLoadSolution: (sql: string) => void;
  onInsertSnippet: (snippet: string) => void;
  validationState: { passed: boolean; feedback: string } | null;
  getTableRows: (tableName: string) => QueryResult | null;
  dbRevision: number;
}

export function Sidebar({
  challenges,
  activeChallengeId,
  solvedIds,
  onSelectChallenge,
  onLoadSolution,
  onInsertSnippet,
  validationState,
  getTableRows,
  dbRevision,
}: SidebarProps) {
  const activeChallenge =
    challenges.find((c) => c.id === activeChallengeId) ?? null;

  const [showHint, setShowHint] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    users: true,
    departments: true,
  });
  const [previewTables, setPreviewTables] = useState<Record<string, boolean>>({});

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePreview = (name: string) => {
    setPreviewTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      {/* Lesson / Challenge Selector */}
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Practice Track
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {solvedIds.size}/{challenges.length} completed
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {challenges.map((c) => {
            const isActive = c.id === activeChallengeId;
            const isSolved = solvedIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setShowHint(false);
                  onSelectChallenge(c.id);
                }}
                title={`${c.number}. ${c.title}`}
                className={`group relative flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-all ${
                  isActive
                    ? 'border-sky-500/70 bg-sky-500/15 text-sky-200 shadow-[0_0_16px_rgba(56,189,248,0.14)]'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold">{c.number}</span>
                  {isSolved && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
                <span className="mt-0.5 line-clamp-1 text-[10px] font-medium">
                  {c.category.replace(' JOIN', '')}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => {
              setShowHint(false);
              onSelectChallenge(null);
            }}
            title="Free SQL Sandbox"
            className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-center transition-all ${
              activeChallengeId === null
                ? 'border-violet-500/70 bg-violet-500/15 text-violet-200'
                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="mt-0.5 text-[10px] font-medium">Free</span>
          </button>
        </div>
      </section>

      {/* Concept & Practice Question Card */}
      {activeChallenge ? (
        <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
              Lesson {activeChallenge.number} · {activeChallenge.category}
            </span>
          </div>

          <h2 className="text-sm font-semibold text-slate-100">
            {activeChallenge.conceptTitle}
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">
            {activeChallenge.conceptSummary}
          </p>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-amber-200/90">
              {activeChallenge.conceptTip}
            </p>
          </div>

          <div className="mt-4 border-t border-slate-800/80 pt-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Practice Challenge
            </div>
            <p className="mt-1 text-sm font-medium leading-snug text-white">
              {activeChallenge.prompt}
            </p>

            {validationState && (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                  validationState.passed
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                }`}
              >
                <div className="font-semibold">
                  {validationState.passed ? 'Challenge Passed!' : 'Keep Going'}
                </div>
                <div className="mt-0.5 opacity-90">
                  {validationState.feedback}
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800"
              >
                <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>

              <button
                type="button"
                onClick={() => onLoadSolution(activeChallenge.solutionSql)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-violet-500/20"
              >
                <Sparkles className="h-3.5 w-3.5 text-violet-300" />
                Load Solution
              </button>
            </div>

            {showHint && (
              <div className="mt-2.5 rounded-lg border border-slate-700/70 bg-slate-900/90 p-2.5 text-xs leading-relaxed text-slate-300">
                <span className="font-semibold text-sky-300">Hint: </span>
                {activeChallenge.hint}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-violet-500/30 bg-[#0E1420] p-4 shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
            Free Sandbox Mode
          </span>
          <h2 className="mt-2 text-sm font-semibold text-slate-100">
            Experiment with Any SQL Query
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">
            Write your own SELECT, WHERE, INNER JOIN, LEFT JOIN, or RIGHT JOIN
            queries against <code className="text-sky-300">users</code> and{' '}
            <code className="text-violet-300">departments</code> and watch the
            step-by-step visualization update live.
          </p>
        </section>
      )}

      {/* Interactive Schema Explorer */}
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Database Schema
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Click col to insert</span>
        </div>

        {/* Relationship Pill */}
        <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-[11px]">
          <span className="flex items-center gap-1.5 font-mono text-sky-300">
            <Link2 className="h-3.5 w-3.5 text-slate-400" />
            users.department_id
          </span>
          <span className="text-slate-500">→</span>
          <span className="font-mono text-violet-300">departments.id</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {SCHEMA_METADATA.map((table) => {
            const isExpanded = expandedTables[table.name] ?? true;
            const isPreviewOpen = previewTables[table.name] ?? false;
            const tableAccent =
              table.name === 'users'
                ? 'border-sky-500/30 text-sky-300'
                : 'border-violet-500/30 text-violet-300';
            const liveRows = isPreviewOpen
              ? getTableRows(table.name)
              : null;
            // Read dbRevision so lint knows preview tracks live DB changes
            void dbRevision;

            return (
              <div
                key={table.name}
                className="overflow-hidden rounded-lg border border-slate-800/90 bg-[#0A0F1A]"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <button
                    type="button"
                    onClick={() => toggleTable(table.name)}
                    className="flex items-center gap-2 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                    )}
                    <Table2
                      className={`h-3.5 w-3.5 ${
                        table.name === 'users'
                          ? 'text-sky-400'
                          : 'text-violet-400'
                      }`}
                    />
                    <span className="font-mono text-xs font-semibold text-slate-100">
                      {table.name}
                    </span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => togglePreview(table.name)}
                      className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition ${
                        isPreviewOpen
                          ? tableAccent + ' bg-slate-800'
                          : 'border-slate-700/80 bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isPreviewOpen ? 'Hide Data' : 'View Data'}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800/70 px-2 py-1.5">
                    {table.columns.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() =>
                          onInsertSnippet(`${table.name}.${col.name}`)
                        }
                        title={`${col.description} — click to insert`}
                        className="flex w-full items-center justify-between rounded px-2 py-1 text-left transition hover:bg-slate-800/60"
                      >
                        <div className="flex items-center gap-1.5">
                          {col.isPrimaryKey ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/15 px-1 py-0.5 font-mono text-[9px] font-bold text-amber-300">
                              <KeyRound className="h-2.5 w-2.5" />
                              PK
                            </span>
                          ) : col.foreignKey ? (
                            <span className="inline-flex items-center gap-0.5 rounded bg-violet-500/15 px-1 py-0.5 font-mono text-[9px] font-bold text-violet-300">
                              <Link2 className="h-2.5 w-2.5" />
                              FK
                            </span>
                          ) : (
                            <span className="inline-block w-6 text-center font-mono text-[9px] text-slate-600">
                              •
                            </span>
                          )}
                          <span className="font-mono text-xs text-slate-200">
                            {col.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {col.nullable && (
                            <span className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[9px] text-slate-400">
                              NULLABLE
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-slate-500">
                            {col.type === 'INTEGER' ? 'INT' : 'TEXT'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {isPreviewOpen && liveRows && (
                  <div className="border-t border-slate-800/80 bg-slate-950/70 p-2">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left font-mono text-[10px]">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            {liveRows.columns.map((c) => (
                              <th key={c} className="px-1.5 py-1 font-medium">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {liveRows.rows.map((r, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-slate-900/80 last:border-0"
                            >
                              {r.map((val, cIdx) => (
                                <td key={cIdx} className="px-1.5 py-1">
                                  {val === null ? (
                                    <span className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[9px] italic text-slate-400">
                                      NULL
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">
                                      {String(val)}
                                    </span>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
