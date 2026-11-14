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
  { id: 'ALL', label: 'All Problems', count: 50 },
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
    <div className="min-h-screen bg-[#080C14] text-slate-100">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-500/40 bg-gradient-to-br from-sky-500/20 to-violet-500/20 shadow-[0_0_20px_rgba(56,189,248,0.18)]">
              <Layers className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-white">
                  SQL Lens
                </span>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
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
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0E1420] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <Database className="h-3.5 w-3.5 text-violet-400" />
              <span>Free SQL Sandbox</span>
            </Link>

            <a
              href="https://github.com/nathandrake16/sql_visualizer"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0E1420] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white sm:inline-flex"
            >
              <span>GitHub</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Hero Section with Prominent Progress Bar */}
        <section className="relative mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-[#0E1420] to-[#0A0F1A] p-6 shadow-xl sm:p-8">
          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            {/* Left Title & Subtitle */}
            <div className="max-w-2xl">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                <Trophy className="h-3.5 w-3.5" />
                <span>FAANG SQL Interview Curriculum</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Master 50 FAANG SQL Interview Problems
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Solve real interview questions from Meta, Google, Spotify, Amazon, Netflix, and Stripe.
                Learn Window Functions, CTE Pipelines, and Subqueries through animated execution mental models.
              </p>
            </div>

            {/* Right CTA Button */}
            <div className="flex flex-col items-start gap-2.5 sm:items-end">
              <Link
                href={`/problem/${nextUnsolved.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:brightness-110"
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
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset Progress</span>
                </button>
              )}
            </div>
          </div>

          {/* Large Overall Progress Bar */}
          <div className="mt-6 border-t border-slate-800/80 pt-6">
            <div className="mb-2 flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2 text-slate-200">
                <span>Overall Progress</span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-sky-300">
                  {solvedCount} / {totalCount} Solved
                </span>
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {progressPercent}%
              </span>
            </div>

            {/* Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.max(progressPercent, isLoaded ? 1 : 0)}%` }}
              />
            </div>

            {/* Difficulty Breakdown Cards */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* Easy */}
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-300">Easy</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {diffStats.easy.solved} / {diffStats.easy.total}
                </span>
              </div>

              {/* Medium */}
              <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-xs font-semibold text-amber-300">Medium</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {diffStats.medium.solved} / {diffStats.medium.total}
                </span>
              </div>

              {/* Hard */}
              <div className="flex items-center justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-400" />
                  <span className="text-xs font-semibold text-rose-300">Hard</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {diffStats.hard.solved} / {diffStats.hard.total}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Curriculum Modules Navigation Pills */}
        <div className="mb-4 flex flex-wrap gap-1.5 border-b border-slate-800/80 pb-3 text-xs font-medium">
          {MODULE_TABS.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => setSelectedModule(mod.id)}
              className={`rounded-lg px-3 py-1.5 transition ${
                selectedModule === mod.id
                  ? 'border border-sky-500/40 bg-sky-500/20 font-bold text-sky-300 shadow-sm'
                  : 'bg-[#0E1420] text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {mod.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search problems, companies (Spotify, Meta, Google)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0E1420] py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-sky-500/70"
            />
          </div>

          {/* Filter Pills: Difficulty & Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Difficulty */}
            <div className="flex rounded-lg border border-slate-800 bg-[#0E1420] p-0.5 text-[11px]">
              {['ALL', 'Easy', 'Medium', 'Hard'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={`rounded px-2.5 py-1 transition ${
                    selectedDifficulty === d
                      ? 'bg-slate-800 font-bold text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Status */}
            <div className="flex rounded-lg border border-slate-800 bg-[#0E1420] p-0.5 text-[11px]">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'UNSOLVED', label: 'Unsolved' },
                { id: 'SOLVED', label: 'Solved' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStatus(s.id as 'ALL' | 'SOLVED' | 'UNSOLVED')}
                  className={`rounded px-2.5 py-1 transition ${
                    selectedStatus === s.id
                      ? 'bg-slate-800 font-bold text-white'
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
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0E1420] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 bg-[#0A0F1A] text-slate-400">
                <tr>
                  <th className="w-12 px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3"># & Problem Title</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Difficulty</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-slate-300">
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
                        className="transition hover:bg-slate-800/40"
                      >
                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          {isSolved ? (
                            <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" />
                          ) : (
                            <Circle className="mx-auto h-4 w-4 text-slate-600" />
                          )}
                        </td>

                        {/* Number & Title */}
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-md border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                            {c.company}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-300">
                            {c.category}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td className="px-4 py-3">
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
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/problem/${c.id}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
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
