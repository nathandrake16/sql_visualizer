'use client';

import React, { useMemo, useState } from 'react';
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
  Search,
  Sparkles,
  Table2,
} from 'lucide-react';
import { SCHEMA_METADATA } from '@/data/seed';
import { Challenge, ProblemDomain, QueryResult } from '@/types/sql';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDomain, setSelectedDomain] = useState<ProblemDomain | 'all'>(
    activeChallenge?.domain || 'core'
  );
  const [showHint, setShowHint] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    users: true,
    departments: true,
    songs: true,
    orders: true,
    stock_quotes: true,
  });
  const [previewTables, setPreviewTables] = useState<Record<string, boolean>>({});

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (selectedCategory === 'ALL') return true;
      if (selectedCategory === 'WINDOW') return c.category === 'WINDOW FUNCTIONS';
      if (selectedCategory === 'CTE') return c.category === 'CTE';
      if (selectedCategory === 'SUBQUERY') return c.category === 'SUBQUERIES';
      if (selectedCategory === 'JOIN') return c.category === 'INNER JOIN' || c.category === 'LEFT JOIN';
      if (selectedCategory === 'CAPSTONE') return c.category === 'CAPSTONE';
      return true;
    });
  }, [challenges, searchQuery, selectedCategory]);

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePreview = (name: string) => {
    setPreviewTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const visibleSchemas = useMemo(() => {
    if (selectedDomain === 'all') return SCHEMA_METADATA;
    return SCHEMA_METADATA.filter((s) => s.domain === selectedDomain);
  }, [selectedDomain]);

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      {/* 50-Problem Practice Track & Filter */}
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              FAANG Interview Track
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {solvedIds.size}/{challenges.length} Solved
          </span>
        </div>

        {/* Search Input */}
        <div className="relative mb-2.5">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search problems, companies (Spotify, Meta)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-[#0A0F1A] py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/70"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="mb-3 flex flex-wrap gap-1 text-[10px]">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'WINDOW', label: 'Window' },
            { id: 'CTE', label: 'CTE' },
            { id: 'SUBQUERY', label: 'Subqueries' },
            { id: 'JOIN', label: 'Joins' },
            { id: 'CAPSTONE', label: 'Capstones' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded px-2 py-0.5 font-medium transition ${
                selectedCategory === cat.id
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Problem List (Scrollable Cards) */}
        <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
          {filteredChallenges.map((c) => {
            const isActive = c.id === activeChallengeId;
            const isSolved = solvedIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setShowHint(false);
                  onSelectChallenge(c.id);
                  if (c.domain) setSelectedDomain(c.domain);
                }}
                className={`flex w-full items-center justify-between rounded-lg border px-2.5 py-1.5 text-left transition ${
                  isActive
                    ? 'border-sky-500/70 bg-sky-500/15 text-white shadow-sm'
                    : 'border-slate-800/80 bg-slate-900/50 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[10px] text-slate-500 w-5">#{c.number}</span>
                  <span className="truncate text-xs font-medium">{c.title}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                    {c.company}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      c.difficulty === 'Easy'
                        ? 'text-emerald-400 bg-emerald-500/10'
                        : c.difficulty === 'Medium'
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {c.difficulty}
                  </span>
                  {isSolved && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Challenge Card */}
      {activeChallenge ? (
        <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-4 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
              #{activeChallenge.number} · {activeChallenge.company}
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                activeChallenge.difficulty === 'Easy'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : activeChallenge.difficulty === 'Medium'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {activeChallenge.difficulty} · {activeChallenge.category}
            </span>
          </div>

          <h2 className="text-sm font-semibold text-slate-100">{activeChallenge.conceptTitle}</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">{activeChallenge.conceptSummary}</p>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-amber-200/90">{activeChallenge.conceptTip}</p>
          </div>

          <div className="mt-4 border-t border-slate-800/80 pt-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Interview Task
            </div>
            <p className="mt-1 text-sm font-medium leading-snug text-white">{activeChallenge.prompt}</p>

            {validationState && (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                  validationState.passed
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                }`}
              >
                <div className="font-semibold">
                  {validationState.passed ? 'Challenge Passed!' : 'Output Mismatch'}
                </div>
                <div className="mt-0.5 opacity-90">{validationState.feedback}</div>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600"
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
          <h2 className="mt-2 text-sm font-semibold text-slate-100">Experiment with 50 Problems & Schemas</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">
            Select any challenge from the track above or write arbitrary Window, CTE, or JOIN queries across the database schemas below.
          </p>
        </section>
      )}

      {/* Domain-Aware Interactive Schema Explorer */}
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-3.5 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Database Schemas
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Click col to insert</span>
        </div>

        {/* Domain Switcher Pills */}
        <div className="mb-3 flex flex-wrap gap-1 text-[10px]">
          {[
            { id: 'core', label: 'Core HR' },
            { id: 'streaming', label: 'Streaming' },
            { id: 'ecommerce', label: 'E-Com' },
            { id: 'fintech', label: 'Fintech' },
            { id: 'social', label: 'Social' },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDomain(d.id as ProblemDomain)}
              className={`rounded px-2 py-0.5 font-medium transition ${
                selectedDomain === d.id
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 font-bold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          {visibleSchemas.map((table) => {
            const isExpanded = expandedTables[table.name] ?? false;
            const isPreviewOpen = previewTables[table.name] ?? false;
            const liveRows = isPreviewOpen ? getTableRows(table.name) : null;
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
                    <Table2 className="h-3.5 w-3.5 text-sky-400" />
                    <span className="font-mono text-xs font-semibold text-slate-100">
                      {table.name}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePreview(table.name)}
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium transition ${
                      isPreviewOpen
                        ? 'border-sky-500/40 bg-slate-800 text-sky-300'
                        : 'border-slate-700/80 bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isPreviewOpen ? 'Hide Data' : 'View Data'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800/70 px-2 py-1.5">
                    {table.columns.map((col) => (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => onInsertSnippet(`${table.name}.${col.name}`)}
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
                          <span className="font-mono text-xs text-slate-200">{col.name}</span>
                        </div>

                        <span className="font-mono text-[10px] text-slate-500">
                          {col.type}
                        </span>
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
                            <tr key={idx} className="border-b border-slate-900/80 last:border-0">
                              {r.map((val, cIdx) => (
                                <td key={cIdx} className="px-1.5 py-1">
                                  {val === null ? (
                                    <span className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[9px] italic text-slate-400">
                                      NULL
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">{String(val)}</span>
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
