'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
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
  Sparkles,
  Table2,
} from 'lucide-react';
import { SCHEMA_METADATA } from '@/data/seed';
import { Challenge, ProblemDomain, QueryResult } from '@/types/sql';

interface ProblemPaneProps {
  challenge: Challenge;
  isSolved: boolean;
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

export function ProblemPane({
  challenge,
  isSolved,
  onLoadSolution,
  onInsertSnippet,
  validationState,
  getTableRows,
  dbRevision,
}: ProblemPaneProps) {
  const [activeTab, setActiveTab] = useState<'question' | 'solution'>('question');
  const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<ProblemDomain | 'all'>(
    challenge.domain || 'core'
  );
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    users: true,
    departments: true,
    songs: true,
    orders: true,
    stock_quotes: true,
  });
  const [previewTables, setPreviewTables] = useState<Record<string, boolean>>({});

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePreview = (name: string) => {
    setPreviewTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const visibleSchemas = SCHEMA_METADATA.filter((s) =>
    selectedDomain === 'all' ? true : s.domain === selectedDomain
  );

  const handleCopySolution = (sql: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto pr-1">
      {/* Problem Header & Tabs */}
      <section className="neu-card rounded-2xl p-4 sm:p-5">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
          <span className="neu-raised-sm inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 px-3 py-1 text-[11px] font-semibold text-sky-300">
            #{challenge.number} · {challenge.company}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`neu-raised-sm rounded-full px-2.5 py-1 text-[10px] font-bold ${
                challenge.difficulty === 'Easy'
                  ? 'border border-emerald-500/30 text-emerald-300'
                  : challenge.difficulty === 'Medium'
                    ? 'border border-amber-500/30 text-amber-300'
                    : 'border border-rose-500/30 text-rose-300'
              }`}
            >
              {challenge.difficulty} · {challenge.category}
            </span>
            {isSolved && (
              <span className="neu-raised-sm flex items-center gap-1 rounded-full border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Solved
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-base font-bold text-slate-100">{challenge.title}</h2>

        {/* Tab Switcher */}
        <div className="neu-inset-tray mt-3.5 flex rounded-xl p-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('question')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
              activeTab === 'question'
                ? 'neu-btn neu-btn-active font-semibold text-sky-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            Problem & Requirements
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('solution')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 transition ${
              activeTab === 'solution'
                ? 'neu-btn neu-btn-active font-semibold text-violet-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Solution & Walkthrough
          </button>
        </div>

        {/* TAB 1: QUESTION */}
        {activeTab === 'question' && (
          <div className="mt-4 space-y-3.5">
            {/* Concept Summary & Tip */}
            <div className="neu-inset rounded-xl p-3.5 text-xs leading-relaxed text-slate-300/90">
              <div className="font-semibold text-slate-200">
                {challenge.conceptTitle}
              </div>
              <div className="mt-1">{challenge.conceptSummary}</div>
              <div className="neu-raised-sm mt-2.5 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-[11px] text-amber-200/90">
                <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>{challenge.conceptTip}</span>
              </div>
            </div>

            {/* Problem Prompt / Scenario */}
            <div className="px-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Interview Scenario
              </div>
              <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-100">
                {challenge.prompt}
              </p>
            </div>

            {/* Requirements Checklist */}
            {challenge.requirements && challenge.requirements.length > 0 && (
              <div className="neu-inset rounded-xl p-3.5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Task Requirements
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {challenge.requirements.map((req, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Example Expected Output */}
            {challenge.exampleOutput && (
              <div className="neu-inset rounded-xl p-3.5">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Example Expected Output
                </div>
                <div className="overflow-x-auto rounded-lg border border-white/[0.04] bg-[#070b13]">
                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-white/[0.05] bg-[#0a0f18] text-slate-400">
                      <tr>
                        {challenge.exampleOutput.columns.map((col) => (
                          <th key={col} className="px-2.5 py-1.5 font-mono font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03] font-mono text-slate-300">
                      {challenge.exampleOutput.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-white/[0.02]">
                          {row.map((val, cIdx) => (
                            <td key={cIdx} className="px-2.5 py-1.5">
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

            {/* Validation Banner */}
            {validationState && (
              <div
                className={`neu-card rounded-xl p-3.5 text-xs leading-relaxed ${
                  validationState.passed
                    ? 'border-emerald-500/40 text-emerald-200'
                    : 'border-amber-500/40 text-amber-200'
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

            {/* Hint */}
            <div>
              <button
                type="button"
                onClick={() => setShowHint((v) => !v)}
                className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-200"
              >
                <HelpCircle className="h-3.5 w-3.5 text-sky-400" />
                {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>

              {showHint && (
                <div className="neu-inset mt-2.5 rounded-xl p-3 text-xs leading-relaxed text-slate-300">
                  <span className="font-semibold text-sky-300">Hint: </span>
                  {challenge.hint}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SOLUTION & EXPLANATION */}
        {activeTab === 'solution' && (
          <div className="mt-4 space-y-3.5">
            {!isSolutionRevealed ? (
              <div className="neu-inset flex flex-col items-center justify-center rounded-2xl p-6 text-center">
                <div className="neu-raised-sm flex h-11 w-11 items-center justify-center rounded-full text-violet-400">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-200">
                  Solution Hidden for Practice
                </h3>
                <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-slate-400">
                  Try solving the problem in the SQL editor first! If you get stuck
                  or want to study the official FAANG interview approach:
                </p>
                <button
                  type="button"
                  onClick={() => setIsSolutionRevealed(true)}
                  className="neu-btn-violet mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Reveal Solution & Walkthrough
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                    Official FAANG Solution
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopySolution(challenge.solutionSql)}
                      className="neu-btn inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-300"
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
                      onClick={() => onLoadSolution(challenge.solutionSql)}
                      className="neu-btn-violet inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold"
                    >
                      <Sparkles className="h-3 w-3 text-violet-200" />
                      Load into Editor
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSolutionRevealed(false)}
                      className="neu-btn inline-flex items-center rounded-lg p-1.5 text-slate-400 hover:text-slate-200"
                      title="Hide solution"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* SQL Code */}
                <pre className="neu-inset overflow-x-auto rounded-xl p-3.5 font-mono text-xs leading-relaxed text-sky-200">
                  {challenge.solutionSql}
                </pre>

                {/* Step-by-Step Walkthrough */}
                <div className="neu-card rounded-xl p-4">
                  <FormattedExplanation text={challenge.solutionExplanation} />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Domain-Aware Interactive Schema Explorer */}
      <section className="neu-card rounded-2xl p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-violet-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Database Schemas
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Click col to insert</span>
        </div>

        {/* Domain Switcher */}
        <div className="neu-inset-tray mb-3.5 flex flex-wrap gap-1 rounded-xl p-1 text-[10px]">
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
              className={`rounded-lg px-2.5 py-1 font-medium transition ${
                selectedDomain === d.id
                  ? 'neu-pill-active font-bold text-violet-300'
                  : 'text-slate-400 hover:text-slate-200'
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
                className="neu-panel overflow-hidden rounded-xl"
              >
                <div className="flex items-center justify-between px-3.5 py-2.5">
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
                    className={`neu-btn inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                      isPreviewOpen
                        ? 'neu-btn-active text-sky-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Table2 className="h-3 w-3" />
                    {isPreviewOpen ? 'Hide' : 'Peek'}
                  </button>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-[#070b14]/70 p-3 text-xs">
                    <p className="mb-2.5 text-[11px] text-slate-400">
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
                  <div className="neu-inset border-t border-black/40 p-2.5">
                    <div className="mb-1.5 text-[10px] font-semibold text-slate-400">
                      First 3 Rows Preview:
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-[10px] text-slate-300">
                        <thead>
                          <tr className="border-b border-white/[0.05] text-slate-500">
                            {liveRows.columns.map((c) => (
                              <th key={c} className="px-2 py-1">
                                {c}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {liveRows.rows.slice(0, 3).map((r, ri) => (
                            <tr key={ri} className="border-b border-white/[0.03]">
                              {r.map((v, ci) => (
                                <td key={ci} className="px-2 py-1">
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
    </div>
  );
}
