'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, DatabaseZap, Layers } from 'lucide-react';
import { Editor } from '@/components/Editor';
import { QueryVisualizer } from '@/components/QueryVisualizer';
import { ResultsTable } from '@/components/ResultsTable';
import { Sidebar } from '@/components/Sidebar';
import { CHALLENGES } from '@/data/challenges';
import { useDatabase } from '@/hooks/useDatabase';
import { VizSnapshot } from '@/lib/buildVizPlan';
import { QueryResult } from '@/types/sql';

const INITIAL_CHALLENGE_ID = 'left-join';

export function SqlWorkbench() {
  const {
    isReady,
    isLoading,
    dbError,
    dbRevision,
    executeQuery,
    resetDatabase,
    getTableRows,
  } = useDatabase();

  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(
    INITIAL_CHALLENGE_ID
  );
  const initialChallenge =
    CHALLENGES.find((c) => c.id === INITIAL_CHALLENGE_ID) ?? CHALLENGES[0];

  const [sqlText, setSqlText] = useState<string>(initialChallenge.starterSql);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryNotice, setQueryNotice] = useState<string | undefined>(undefined);
  const [vizSnapshot, setVizSnapshot] = useState<VizSnapshot | null>(null);
  const [replayNonce, setReplayNonce] = useState<number>(0);

  const [solvedIds, setSolvedIds] = useState<Set<string>>(() => new Set());
  const [validationState, setValidationState] = useState<{
    passed: boolean;
    feedback: string;
  } | null>(null);

  const didInitialRunRef = useRef(false);

  const runSql = useCallback(
    (overrideSql?: string, challengeIdOverride?: string | null) => {
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

      const challenge = CHALLENGES.find((c) => c.id === targetChallengeId);
      if (challenge?.validateQuery) {
        const validation = challenge.validateQuery(
          outcome.result,
          outcome.parsed
        );
        setValidationState(validation);
        if (validation.passed) {
          setSolvedIds((prev) => {
            const next = new Set(prev);
            next.add(challenge.id);
            return next;
          });
        }
      } else {
        setValidationState(null);
      }
    },
    [activeChallengeId, executeQuery, sqlText]
  );

  // Run starter query once when SQLite WASM becomes ready
  useEffect(() => {
    if (isReady && !didInitialRunRef.current) {
      didInitialRunRef.current = true;
      runSql(initialChallenge.starterSql, INITIAL_CHALLENGE_ID);
    }
  }, [isReady, initialChallenge.starterSql, runSql]);

  const handleSelectChallenge = useCallback(
    (nextId: string | null) => {
      setActiveChallengeId(nextId);
      setValidationState(null);

      if (nextId === null) {
        // Free sandbox keeps current SQL or provides helpful template if empty
        if (!sqlText.trim()) {
          const freeSql = `SELECT u.name, u.role, d.name AS department\nFROM users u\nLEFT JOIN departments d\n  ON u.department_id = d.id;`;
          setSqlText(freeSql);
          if (isReady) runSql(freeSql, null);
        } else if (isReady) {
          runSql(sqlText, null);
        }
        return;
      }

      const found = CHALLENGES.find((c) => c.id === nextId);
      if (!found) return;
      setSqlText(found.starterSql);
      if (isReady) {
        runSql(found.starterSql, found.id);
      }
    },
    [isReady, runSql, sqlText]
  );

  const handleLoadSolution = useCallback(
    (solutionSql: string) => {
      setSqlText(solutionSql);
      if (isReady) {
        runSql(solutionSql);
      }
    },
    [isReady, runSql]
  );

  const handleResetStarter = useCallback(() => {
    const found = CHALLENGES.find((c) => c.id === activeChallengeId);
    if (!found) return;
    setSqlText(found.starterSql);
    if (isReady) {
      runSql(found.starterSql, found.id);
    }
  }, [activeChallengeId, isReady, runSql]);

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

  const activeChallenge =
    CHALLENGES.find((c) => c.id === activeChallengeId) ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-[#080C14] text-slate-100">
      {/* Top App Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-sky-500/40 bg-gradient-to-br from-sky-500/20 to-violet-500/20 shadow-[0_0_20px_rgba(56,189,248,0.18)]">
              <Layers className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-white sm:text-base">
                  SQL Lens
                </h1>
                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-300">
                  Visual MVP
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hands-on SQL practice with step-by-step relational join visualization
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-[#0E1420] px-3 py-1.5 text-xs text-slate-300">
              <DatabaseZap className="h-3.5 w-3.5 text-emerald-400" />
              <span>Client-Side SQLite (sql.js WASM)</span>
            </div>
          </div>
        </div>
      </header>

      {/* WASM Initialization Error Banner */}
      {dbError && (
        <div className="mx-auto mt-4 w-full max-w-[1600px] px-4 sm:px-6">
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
      <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-[370px_1fr]">
        {/* Left Panel: Tutorial, Practice Question & Schema Cards */}
        <Sidebar
          challenges={CHALLENGES}
          activeChallengeId={activeChallengeId}
          solvedIds={solvedIds}
          onSelectChallenge={handleSelectChallenge}
          onLoadSolution={handleLoadSolution}
          onInsertSnippet={handleInsertSnippet}
          validationState={validationState}
          getTableRows={getTableRows}
          dbRevision={dbRevision}
        />

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
