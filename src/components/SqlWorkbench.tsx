'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  DatabaseZap,
} from 'lucide-react';
import { Editor } from '@/components/Editor';
import { ProblemPane } from '@/components/ProblemPane';
import { QueryVisualizer } from '@/components/QueryVisualizer';
import { ResultsTable } from '@/components/ResultsTable';
import { CHALLENGES } from '@/data/challenges';
import { useDatabase } from '@/hooks/useDatabase';
import { useSolvedChallenges } from '@/hooks/useSolvedChallenges';
import { VizSnapshot } from '@/lib/buildVizPlan';
import { QueryResult } from '@/types/sql';

interface SqlWorkbenchProps {
  initialChallengeId?: string | null;
  isSandbox?: boolean;
}

export function SqlWorkbench({
  initialChallengeId = 'select-where',
  isSandbox = false,
}: SqlWorkbenchProps) {
  const {
    isReady,
    isLoading,
    dbError,
    dbRevision,
    executeQuery,
    resetDatabase,
    getTableRows,
  } = useDatabase();

  const { solvedIds, markSolved } = useSolvedChallenges();

  const activeChallengeId = isSandbox
    ? null
    : initialChallengeId ?? 'select-where';

  const activeChallenge = activeChallengeId
    ? CHALLENGES.find((c) => c.id === activeChallengeId) ?? null
    : null;

  const currentIndex = activeChallenge
    ? CHALLENGES.findIndex((c) => c.id === activeChallenge.id)
    : -1;
  const prevChallenge = currentIndex > 0 ? CHALLENGES[currentIndex - 1] : null;
  const nextChallenge =
    currentIndex >= 0 && currentIndex < CHALLENGES.length - 1
      ? CHALLENGES[currentIndex + 1]
      : null;

  const [sqlText, setSqlText] = useState<string>(() => {
    if (isSandbox) {
      return `-- Free SQL Sandbox Mode\n-- Write any query across the 11 database tables below\nSELECT u.name, u.role, d.name AS department, u.salary\nFROM users u\nLEFT JOIN departments d ON u.department_id = d.id;`;
    }
    return activeChallenge?.starterSql ?? '';
  });

  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryNotice, setQueryNotice] = useState<string | undefined>(undefined);
  const [vizSnapshot, setVizSnapshot] = useState<VizSnapshot | null>(null);
  const [replayNonce, setReplayNonce] = useState<number>(0);

  const [validationState, setValidationState] = useState<{
    passed: boolean;
    feedback: string;
  } | null>(null);

  const didInitialRunRef = useRef(false);

  const runSql = useCallback(
    (
      overrideSql?: string,
      challengeIdOverride?: string | null,
      options?: { skipValidation?: boolean }
    ) => {
      const targetSql = overrideSql ?? sqlText;
      const targetChallengeId =
        challengeIdOverride !== undefined
          ? challengeIdOverride
          : activeChallengeId;

      const outcome = executeQuery(targetSql);
      if (!outcome.ok) {
        setQueryError(outcome.error);
        setQueryNotice(undefined);
        setValidationState(null);
        return;
      }

      setQueryError(null);
      setQueryResult(outcome.result);
      setQueryNotice(outcome.isNonSelectNotice);
      setVizSnapshot(outcome.vizSnapshot);
      setReplayNonce((n) => n + 1);

      // Never auto-solve on select or initial boot
      if (options?.skipValidation) {
        setValidationState(null);
        return;
      }

      const challenge = CHALLENGES.find((c) => c.id === targetChallengeId);
      if (challenge?.validateQuery) {
        const validation = challenge.validateQuery(
          outcome.result,
          outcome.parsed
        );
        setValidationState(validation);
        if (validation.passed) {
          markSolved(challenge.id);
        }
      } else {
        setValidationState(null);
      }
    },
    [activeChallengeId, executeQuery, markSolved, sqlText]
  );

  // Run initial query when SQLite WASM becomes ready (without auto-solving)
  useEffect(() => {
    if (isReady && !didInitialRunRef.current) {
      didInitialRunRef.current = true;
      runSql(sqlText, activeChallengeId, {
        skipValidation: true,
      });
    }
  }, [activeChallengeId, isReady, runSql, sqlText]);

  const handleLoadSolution = useCallback(
    (solutionSql: string) => {
      setSqlText(solutionSql);
      if (isReady) {
        // Load into editor and visualize without marking solved
        runSql(solutionSql, activeChallengeId, { skipValidation: true });
      }
    },
    [activeChallengeId, isReady, runSql]
  );

  const handleResetStarter = useCallback(() => {
    if (activeChallenge) {
      setSqlText(activeChallenge.starterSql);
      setValidationState(null);
      if (isReady) {
        runSql(activeChallenge.starterSql, activeChallenge.id, {
          skipValidation: true,
        });
      }
    } else {
      const freeSql = `SELECT u.name, u.role, d.name AS department, u.salary\nFROM users u\nLEFT JOIN departments d ON u.department_id = d.id;`;
      setSqlText(freeSql);
      setValidationState(null);
      if (isReady) {
        runSql(freeSql, null, { skipValidation: true });
      }
    }
  }, [activeChallenge, isReady, runSql]);

  const handleResetDb = useCallback(() => {
    resetDatabase();
    setTimeout(() => {
      runSql();
    }, 0);
  }, [resetDatabase, runSql]);

  const handleInsertSnippet = useCallback((snippet: string) => {
    setSqlText((prev) => {
      const trimmed = prev.trimEnd();
      if (!trimmed) return `SELECT ${snippet} FROM users;`;
      if (trimmed.endsWith(';')) {
        return `${trimmed.slice(0, -1)} ${snippet};`;
      }
      return `${trimmed} ${snippet}`;
    });
  }, []);

  const handleReplayViz = useCallback(() => {
    runSql();
  }, [runSql]);

  return (
    <div className="flex min-h-screen flex-col bg-[#080C14] text-slate-100">
      {/* Top Workspace Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          {/* Left: Back Link & Problem Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-[#0E1420] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-slate-700 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Problems</span>
            </Link>

            {activeChallenge ? (
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-sky-300">
                  #{activeChallenge.number}
                </span>
                <span className="hidden text-sm font-semibold text-white sm:inline">
                  {activeChallenge.title}
                </span>
                <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                  {activeChallenge.company}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                    activeChallenge.difficulty === 'Easy'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : activeChallenge.difficulty === 'Medium'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {activeChallenge.difficulty}
                </span>
                {solvedIds.has(activeChallenge.id) && (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Solved
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                  Free SQL Sandbox
                </span>
                <span className="text-xs text-slate-400">
                  Query across all 11 database tables freely
                </span>
              </div>
            )}
          </div>

          {/* Right: Prev/Next Buttons & Engine Status */}
          <div className="flex items-center gap-2">
            {activeChallenge && (
              <div className="flex items-center gap-1">
                {prevChallenge ? (
                  <Link
                    href={`/problem/${prevChallenge.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0E1420] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
                    title={`Previous: #${prevChallenge.number} ${prevChallenge.title}`}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-800/40 bg-slate-900/40 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Prev</span>
                  </button>
                )}

                {nextChallenge ? (
                  <Link
                    href={`/problem/${nextChallenge.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0E1420] px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-slate-700 hover:text-white"
                    title={`Next: #${nextChallenge.number} ${nextChallenge.title}`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <button
                    disabled
                    className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg border border-slate-800/40 bg-slate-900/40 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-[#0E1420] px-3 py-1 text-xs text-slate-300 md:flex">
              <DatabaseZap className="h-3.5 w-3.5 text-emerald-400" />
              <span>SQLite WASM</span>
            </div>
          </div>
        </div>
      </header>

      {/* WASM Initialization Error Banner */}
      {dbError && (
        <div className="mx-auto mt-4 w-full max-w-[1700px] px-4 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <span className="font-semibold">Database Initialization Failed: </span>
              {dbError}
            </div>
          </div>
        </div>
      )}

      {/* Main Split-Screen Workspace */}
      <main className="mx-auto grid w-full max-w-[1700px] flex-1 grid-cols-1 gap-5 p-4 sm:p-6 lg:grid-cols-[460px_1fr] xl:grid-cols-[500px_1fr]">
        {/* Left Panel: Dedicated Problem & Solution Pane */}
        {activeChallenge ? (
          <ProblemPane
            challenge={activeChallenge}
            isSolved={solvedIds.has(activeChallenge.id)}
            onLoadSolution={handleLoadSolution}
            onInsertSnippet={handleInsertSnippet}
            validationState={validationState}
            getTableRows={getTableRows}
            dbRevision={dbRevision}
          />
        ) : (
          <section className="flex flex-col gap-4 overflow-y-auto">
            <div className="rounded-xl border border-violet-500/30 bg-[#0E1420] p-4 shadow-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                Free SQL Sandbox
              </span>
              <h2 className="mt-2 text-sm font-semibold text-slate-100">
                Interactive Multi-Domain SQL Sandbox
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300/90">
                Write arbitrary Window Functions, CTEs, or Multi-table joins across
                our 11 seeded database tables (Core HR, Streaming, E-Commerce, Fintech, and Social).
              </p>
              <div className="mt-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/20"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Return to 50-Problem Interview Track</span>
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Right Panel: SQL Editor + Execution Visualizer + Results Grid */}
        <div className="flex min-w-0 flex-col gap-4">
          <Editor
            value={sqlText}
            onChange={setSqlText}
            onRun={runSql}
            onReplayViz={handleReplayViz}
            onResetStarter={handleResetStarter}
            onResetDb={handleResetDb}
            isDbReady={isReady && !isLoading}
            hasStarter={Boolean(activeChallenge)}
          />

          <QueryVisualizer
            snapshot={vizSnapshot}
            replayNonce={replayNonce}
          />

          <ResultsTable
            result={queryResult}
            error={queryError}
            notice={queryNotice}
          />
        </div>
      </main>
    </div>
  );
}
