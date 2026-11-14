'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Database,
  Eye,
  EyeOff,
  FileText,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Link2,
  Lock,
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

function renderFormattedInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-slate-100">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-slate-800/90 px-1 py-0.5 font-mono text-[11px] text-sky-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function FormattedExplanation({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-300">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={idx}
              className="pt-2 text-xs font-bold uppercase tracking-wider text-sky-400"
            >
              {trimmed.replace('### ', '')}
            </h4>
          );
        }
        if (trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-2">
              <span className="mt-0.5 text-sky-400">•</span>
              <span>{renderFormattedInline(trimmed.replace('- ', ''))}</span>
            </div>
          );
        }
        if (
          trimmed.startsWith('1. ') ||
          trimmed.startsWith('2. ') ||
          trimmed.startsWith('3. ') ||
          trimmed.startsWith('4. ')
        ) {
          const num = trimmed.slice(0, 3);
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="font-mono font-bold text-sky-400">{num}</span>
              <span>{renderFormattedInline(trimmed.slice(3))}</span>
            </div>
          );
        }
        if (!trimmed) {
          return <div key={idx} className="h-0.5" />;
        }
        return <p key={idx}>{renderFormattedInline(trimmed)}</p>;
      })}
    </div>
  );
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

  const [activeTab, setActiveTab] = useState<'question' | 'solution'>('question');
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
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
      if (selectedCategory === 'JOIN')
        return c.category === 'INNER JOIN' || c.category === 'LEFT JOIN';
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

  const handleCopySolution = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const solvedPercentage = Math.round((solvedIds.size / challenges.length) * 100);

  return (
    <aside className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      {/* 50-Problem Practice Track & Filter */}
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-3.5 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              FAANG Interview Track
            </span>
          </div>
          <span className="font-mono text-xs font-semibold text-emerald-400">
            {solvedIds.size}/{challenges.length} Solved ({solvedPercentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-300"
            style={{ width: `${Math.max(solvedPercentage, 2)}%` }}
          />
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
            { id: 'ALL', label: 'All (50)' },
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
                  ? 'border border-sky-500/40 bg-sky-500/20 font-bold text-sky-300'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Problem List (Scrollable Cards) */}
        <div className="max-h-48 space-y-1 overflow-y-auto pr-1">
          {filteredChallenges.map((c) => {
            const isActive = c.id === activeChallengeId;
            const isSolved = solvedIds.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setShowHint(false);
                  setActiveTab('question');
                  setIsSolutionRevealed(false);
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
                  <span className="w-5 font-mono text-[10px] text-slate-500">
                    #{c.number}
                  </span>
                  <span className="truncate text-xs font-medium">{c.title}</span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[9px] font-bold text-slate-400">
                    {c.company}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      c.difficulty === 'Easy'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : c.difficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {c.difficulty}
                  </span>
                  {isSolved && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Active Challenge Card (DataLemur Two-Tab Layout) */}
      {activeChallenge ? (
        <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-4 shadow-sm">
          {/* Header Badges */}
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-300">
              #{activeChallenge.number} · {activeChallenge.company}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  activeChallenge.difficulty === 'Easy'
                    ? 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                    : activeChallenge.difficulty === 'Medium'
                      ? 'border border-amber-500/30 bg-amber-500/15 text-amber-300'
                      : 'border border-rose-500/30 bg-rose-500/15 text-rose-300'
                }`}
              >
                {activeChallenge.difficulty} · {activeChallenge.category}
              </span>
              {solvedIds.has(activeChallenge.id) && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <CheckCircle2 className="h-3 w-3" /> Solved
                </span>
              )}
            </div>
          </div>

          <h2 className="text-sm font-semibold text-slate-100">
            {activeChallenge.title}
          </h2>

          {/* Tab Switcher: Question vs Solution */}
          <div className="mt-3 flex rounded-lg border border-slate-800 bg-[#0A0F1A] p-0.5 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('question')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                activeTab === 'question'
                  ? 'border border-sky-500/30 bg-sky-500/15 font-semibold text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Problem & Requirements
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('solution')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                activeTab === 'solution'
                  ? 'border border-violet-500/30 bg-violet-500/15 font-semibold text-violet-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              Solution & Walkthrough
            </button>
          </div>

          {/* TAB 1: QUESTION & SPECIFICATIONS */}
          {activeTab === 'question' && (
            <div className="mt-3.5 space-y-3.5">
              {/* Concept Summary & Tip */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs leading-relaxed text-slate-300/90">
                <div className="font-semibold text-slate-200">
                  {activeChallenge.conceptTitle}
                </div>
                <div className="mt-1">{activeChallenge.conceptSummary}</div>
                <div className="mt-2 flex items-start gap-1.5 rounded border border-amber-500/20 bg-amber-500/5 p-2 text-[11px] text-amber-200/90">
                  <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>{activeChallenge.conceptTip}</span>
                </div>
              </div>

              {/* Problem Prompt / Scenario */}
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Interview Scenario
                </div>
                <p className="mt-1 text-xs font-medium leading-relaxed text-slate-100">
                  {activeChallenge.prompt}
                </p>
              </div>

              {/* Requirements Checklist */}
              {activeChallenge.requirements &&
                activeChallenge.requirements.length > 0 && (
                  <div className="rounded-lg border border-slate-800/80 bg-[#0A0F1A] p-2.5">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Task Requirements
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {activeChallenge.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              {/* Example Expected Output Preview */}
              {activeChallenge.exampleOutput && (
                <div className="rounded-lg border border-slate-800/80 bg-[#0A0F1A] p-2.5">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Example Expected Output
                  </div>
                  <div className="overflow-x-auto rounded border border-slate-800">
                    <table className="w-full text-left text-[11px]">
                      <thead className="border-b border-slate-800 bg-slate-900 text-slate-400">
                        <tr>
                          {activeChallenge.exampleOutput.columns.map((col) => (
                            <th key={col} className="px-2 py-1 font-mono font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {activeChallenge.exampleOutput.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-800/30">
                            {row.map((val, cIdx) => (
                              <td key={cIdx} className="px-2 py-1">
                                {val === null ? (
                                  <span className="italic text-slate-500">NULL</span>
                                ) : (
                                  String(val)
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

              {/* Validation Feedback Banner */}
              {validationState && (
                <div
                  className={`rounded-lg border p-3 text-xs leading-relaxed ${
                    validationState.passed
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold">
                    {validationState.passed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span>Challenge Passed!</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span>Output Mismatch</span>
                      </>
                    )}
                  </div>
                  <div className="mt-1 opacity-90">{validationState.feedback}</div>
                </div>
              )}

              {/* Hint Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowHint((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/70 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-600"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>

                {showHint && (
                  <div className="mt-2 rounded-lg border border-slate-700/70 bg-slate-900/90 p-2.5 text-xs leading-relaxed text-slate-300">
                    <span className="font-semibold text-sky-300">Hint: </span>
                    {activeChallenge.hint}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SOLUTION & EXPLANATION */}
          {activeTab === 'solution' && (
            <div className="mt-3.5 space-y-3.5">
              {!isSolutionRevealed ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/50 p-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <h3 className="mt-2.5 text-xs font-bold uppercase tracking-wider text-slate-200">
                    Solution Hidden for Practice
                  </h3>
                  <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-slate-400">
                    Try solving the problem in the SQL editor first! If you get stuck
                    or want to study the official FAANG interview approach:
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSolutionRevealed(true)}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/20 px-3.5 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/30"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Reveal Solution & Walkthrough
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {/* Solution Query Header & Actions */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                      Official FAANG Solution
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopySolution(activeChallenge.solutionSql)}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-[11px] font-medium text-slate-300 transition hover:bg-slate-700"
                        title="Copy solution query"
                      >
                        {copiedSql ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedSql ? 'Copied' : 'Copy'}
                      </button>

                      <button
                        type="button"
                        onClick={() => onLoadSolution(activeChallenge.solutionSql)}
                        className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/20 px-2.5 py-1 text-[11px] font-semibold text-violet-200 transition hover:bg-violet-500/30"
                      >
                        <Sparkles className="h-3 w-3 text-violet-300" />
                        Load into Editor
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSolutionRevealed(false)}
                        className="inline-flex items-center rounded bg-slate-800/80 p-1 text-slate-400 transition hover:text-slate-200"
                        title="Hide solution"
                      >
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* SQL Code Block */}
                  <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0A0F1A] p-3 font-mono text-xs leading-relaxed text-sky-200">
                    {activeChallenge.solutionSql}
                  </pre>

                  {/* Step-by-Step Pedagogical Explanation */}
                  <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3">
                    <FormattedExplanation
                      text={activeChallenge.solutionExplanation}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-xl border border-violet-500/30 bg-[#0E1420] p-4 shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
            Free Sandbox Mode
          </span>
          <h2 className="mt-2 text-sm font-semibold text-slate-100">
            Experiment with 50 Problems & Schemas
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">
            Select any challenge from the track above or write arbitrary Window,
            CTE, or JOIN queries across the database schemas below.
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
                  ? 'border border-violet-500/40 bg-violet-500/20 font-bold text-violet-300'
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
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {table.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      ({table.columns.length} cols)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => togglePreview(table.name)}
                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition ${
                      isPreviewOpen
                        ? 'border border-sky-500/40 bg-sky-500/20 text-sky-300'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Table2 className="h-3 w-3" />
                    {isPreviewOpen ? 'Hide' : 'Peek'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-800/60 bg-[#080C14]/50 p-2.5 text-xs">
                    <p className="mb-2 text-[11px] text-slate-400">
                      {table.description}
                    </p>
                    <div className="space-y-1.5">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between text-[11px]"
                        >
                          <button
                            type="button"
                            onClick={() => onInsertSnippet(`${table.name}.${col.name}`)}
                            className="flex items-center gap-1.5 font-mono text-sky-400/90 transition hover:text-sky-300 hover:underline"
                            title="Click to insert into editor"
                          >
                            {col.isPrimaryKey && (
                              <KeyRound className="h-3 w-3 text-amber-400" />
                            )}
                            {col.foreignKey && (
                              <Link2 className="h-3 w-3 text-violet-400" />
                            )}
                            <span>{col.name}</span>
                          </button>
                          <span className="font-mono text-[10px] text-slate-500">
                            {col.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isPreviewOpen && liveRows && (
                  <div className="border-t border-slate-800 bg-[#060910] p-2">
                    <div className="mb-1 text-[10px] font-semibold text-slate-400">
                      First 3 Rows Preview:
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[10px] text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500">
                            {liveRows.columns.map((c) => (
                              <th key={c} className="px-1.5 py-0.5">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {liveRows.rows.slice(0, 3).map((r, ri) => (
                            <tr key={ri} className="border-b border-slate-900">
                              {r.map((v, ci) => (
                                <td key={ci} className="px-1.5 py-0.5">
                                  {v === null ? (
                                    <span className="italic text-slate-600">
                                      null
                                    </span>
                                  ) : (
                                    String(v)
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
