'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Database,
  ExternalLink,
  Layers,
  Play,
  RotateCcw,
  Search,
  Trophy,
} from 'lucide-react';
import { CHALLENGES } from '@/data/challenges';
import { useSolvedChallenges } from '@/hooks/useSolvedChallenges';

const MODULE_TABS = [
  { id: 'ALL', label: 'All Problems (50)', count: 50 },
  { id: 'M1', label: '1. Foundations & Joins', range: [1, 8] },
  { id: 'M2', label: '2. Window Functions', range: [9, 18] },
  { id: 'M3', label: '3. Rolling Frames', range: [19, 26] },
  { id: 'M4', label: '4. CTE Pipelines', range: [27, 34] },
  { id: 'M5', label: '5. Subqueries', range: [35, 42] },
  { id: 'M6', label: '6. FAANG Capstones', range: [43, 50] },
];

export function ProblemDirectory() {
  const { solvedIds, resetAllProgress, isLoaded } = useSolvedChallenges();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'SOLVED' | 'UNSOLVED'>('ALL');

  const solvedCount = solvedIds.size;
  const totalCount = CHALLENGES.length;
  const progressPercent = Math.round((solvedCount / totalCount) * 100);

  // Breakdown by difficulty
  const diffStats = useMemo(() => {
    let easyTotal = 0;
    let easySolved = 0;
    let medTotal = 0;
    let medSolved = 0;
    let hardTotal = 0;
    let hardSolved = 0;

    for (const c of CHALLENGES) {
      const isSolved = solvedIds.has(c.id);
      if (c.difficulty === 'Easy') {
        easyTotal++;
        if (isSolved) easySolved++;
      } else if (c.difficulty === 'Medium') {
        medTotal++;
        if (isSolved) medSolved++;
      } else if (c.difficulty === 'Hard') {
        hardTotal++;
        if (isSolved) hardSolved++;
      }
    }

    return {
      easy: { solved: easySolved, total: easyTotal },
      medium: { solved: medSolved, total: medTotal },
      hard: { solved: hardSolved, total: hardTotal },
    };
  }, [solvedIds]);

  // Find next unsolved problem for CTA button
  const nextUnsolved = useMemo(() => {
    return CHALLENGES.find((c) => !solvedIds.has(c.id)) ?? CHALLENGES[0];
  }, [solvedIds]);

  // Filtered challenges
  const filteredChallenges = useMemo(() => {
    return CHALLENGES.filter((c) => {
      // Search
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.conceptTitle.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // Module
      if (selectedModule !== 'ALL') {
        const mod = MODULE_TABS.find((m) => m.id === selectedModule);
        if (mod && mod.range) {
          if (c.number < mod.range[0] || c.number > mod.range[1]) return false;
        }
      }

      // Difficulty
      if (selectedDifficulty !== 'ALL' && c.difficulty !== selectedDifficulty) {
        return false;
      }

      // Status
      const isSolved = solvedIds.has(c.id);
      if (selectedStatus === 'SOLVED' && !isSolved) return false;
      if (selectedStatus === 'UNSOLVED' && isSolved) return false;

      return true;
    });
  }, [searchQuery, selectedDifficulty, selectedModule, selectedStatus, solvedIds]);

  return (
    <div className="min-h-screen bg-[#090e17] text-slate-100">
      {/* Top Neumorphic Header */}
      <header className="neu-panel sticky top-0 z-30 border-b border-white/[0.04] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="neu-raised-sm flex h-10 w-10 items-center justify-center rounded-xl text-sky-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  SQL Lens
                </span>
                <span className="neu-raised-sm rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                  DataLemur Track · 50 Problems
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                FAANG SQL Interview Prep with Step-by-Step Visual Execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sandbox"
              className="neu-btn inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-200"
            >
              <Database className="h-3.5 w-3.5 text-violet-400" />
              <span>Free SQL Sandbox</span>
            </Link>

            <a
              href="https://github.com/nathandrake16/sql_visualizer"
              target="_blank"
              rel="noreferrer"
              className="neu-btn hidden items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-300 sm:inline-flex"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Neumorphic Hero Section with Prominent Progress Bar */}
        <section className="neu-card relative mb-8 rounded-2xl p-6 sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            {/* Left Title & Subtitle */}
            <div className="max-w-2xl">
              <div className="neu-raised-sm mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-sky-300">
                <Trophy className="h-3.5 w-3.5" />
                <span>FAANG SQL Interview Curriculum</span>
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Master 50 FAANG SQL Interview Problems
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Solve real interview questions from Meta, Google, Spotify, Amazon, Netflix, and Stripe.
                Learn Window Functions, CTE Pipelines, and Subqueries through animated execution mental models.
              </p>
            </div>

            {/* Right CTA Button */}
            <div className="flex flex-col items-start gap-3 sm:items-end">
              <Link
                href={`/problem/${nextUnsolved.id}`}
                className="neu-btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>
                  {solvedCount === 0
                    ? 'Start Challenge #1'
                    : `Continue: #${nextUnsolved.number} ${nextUnsolved.company}`}
                </span>
              </Link>
              {solvedCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all solved progress?')) {
                      resetAllProgress();
                    }
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 transition"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Progress</span>
                </button>
              )}
            </div>
          </div>

          {/* Large Overall Progress Bar */}
          <div className="mt-6 border-t border-white/[0.05] pt-6">
            <div className="mb-2.5 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-200">
                <span>Overall Curriculum Progress</span>
                <span className="neu-raised-sm rounded-md px-2 py-0.5 font-mono text-[11px] text-sky-300">
                  {solvedCount} / {totalCount} Solved
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {progressPercent}%
              </span>
            </div>

            {/* Inset Neumorphic Track */}
            <div className="neu-inset h-4 w-full overflow-hidden rounded-full p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_rgba(56,189,248,0.35)] transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, isLoaded ? 1.5 : 0)}%` }}
              />
            </div>

            {/* Difficulty Breakdown Cards */}
            <div className="mt-5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
              {/* Easy */}
              <div className="neu-raised-sm flex items-center justify-between rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                  <span className="text-xs font-semibold text-emerald-300">Easy Problems</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-100">
                  {diffStats.easy.solved} / {diffStats.easy.total}
                </span>
              </div>

              {/* Medium */}
              <div className="neu-raised-sm flex items-center justify-between rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  <span className="text-xs font-semibold text-amber-300">Medium Problems</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-100">
                  {diffStats.medium.solved} / {diffStats.medium.total}
                </span>
              </div>

              {/* Hard */}
              <div className="neu-raised-sm flex items-center justify-between rounded-xl px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]" />
                  <span className="text-xs font-semibold text-rose-300">Hard Problems</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-100">
                  {diffStats.hard.solved} / {diffStats.hard.total}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Modules Navigation Pills in Inset Tray */}
        <div className="neu-inset-tray mb-5 flex flex-wrap gap-1.5 rounded-xl p-1.5 text-xs font-medium">
          {MODULE_TABS.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedModule(mod.id)}
              className={`rounded-lg px-3 py-1.5 font-medium transition ${
                selectedModule === mod.id
                  ? 'neu-pill-active font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Neumorphic Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems, companies (Spotify, Meta, Google)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neu-inset w-full rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Filter Pills: Difficulty & Status */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Difficulty */}
            <div className="neu-inset-tray flex rounded-xl p-1 text-[11px]">
              {['ALL', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    selectedDifficulty === d
                      ? 'neu-raised-sm font-bold text-sky-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="neu-inset-tray flex rounded-xl p-1 text-[11px]">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UNSOLVED', label: 'Unsolved' },
                { id: 'SOLVED', label: 'Solved' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStatus(s.id as 'ALL' | 'SOLVED' | 'UNSOLVED')}
                  className={`rounded-lg px-2.5 py-1 transition ${
                    selectedStatus === s.id
                      ? 'neu-raised-sm font-bold text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 50-Problem Directory Table */}
        <div className="neu-card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.04] bg-[#070b13]/80 text-slate-400">
                <tr>
                  <th className="w-14 px-4 py-3.5 text-center font-medium">Status</th>
                  <th className="px-4 py-3.5 font-medium"># & Problem Title</th>
                  <th className="px-4 py-3.5 font-medium">Company</th>
                  <th className="px-4 py-3.5 font-medium">Category</th>
                  <th className="px-4 py-3.5 font-medium">Difficulty</th>
                  <th className="px-4 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] text-slate-300">
                {filteredChallenges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      No problems match your current search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredChallenges.map((c) => {
                    const isSolved = solvedIds.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className="neu-table-row"
                      >
                        {/* Status */}
                        <td className="px-4 py-3.5 text-center">
                          {isSolved ? (
                            <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.3)]">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                          ) : (
                            <Circle className="mx-auto h-4 w-4 text-slate-600" />
                          )}
                        </td>

                        {/* Number & Title */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/problem/${c.id}`}
                            className="group flex flex-col font-medium text-slate-100 hover:text-sky-300"
                          >
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-slate-500 text-[11px]">
                                #{c.number}
                              </span>
                              <span className="font-semibold text-white group-hover:underline">
                                {c.title}
                              </span>
                            </span>
                            <span className="text-[11px] text-slate-400 mt-0.5">
                              {c.conceptTitle}
                            </span>
                          </Link>
                        </td>

                        {/* Company Badge */}
                        <td className="px-4 py-3.5">
                          <span className="neu-raised-sm inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-200">
                            {c.company}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3.5">
                          <span className="neu-inset rounded-md px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300">
                            {c.category}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              c.difficulty === 'Easy'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : c.difficulty === 'Medium'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {c.difficulty}
                          </span>
                        </td>

                        {/* Action Link */}
                        <td className="px-4 py-3.5 text-right">
                          <Link
                            href={`/problem/${c.id}`}
                            className="neu-btn inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300"
                          >
                            <span>{isSolved ? 'Review' : 'Solve'}</span>
                            <span className="text-sky-400">➔</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
