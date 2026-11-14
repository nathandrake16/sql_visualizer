'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Columns3,
  Filter,
  GitMerge,
  Layers,
  Link2,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Sparkles,
} from 'lucide-react';
import { VizSnapshot, VizSourceRow } from '@/lib/buildVizPlan';
import { SqlValue, VizStep } from '@/types/sql';
import { WindowVisualizer } from '@/components/WindowVisualizer';
import { CteVisualizer } from '@/components/CteVisualizer';
import { SubqueryVisualizer } from '@/components/SubqueryVisualizer';

interface QueryVisualizerProps {
  snapshot: VizSnapshot | null;
  replayNonce: number;
}

const GROUP_COLORS = [
  {
    stroke: '#38BDF8',
    border: 'border-sky-400/70',
    bg: 'bg-sky-500/12',
    badge: 'border-sky-400/50 bg-sky-500/20 text-sky-200',
    dot: 'bg-sky-400',
  },
  {
    stroke: '#A78BFA',
    border: 'border-violet-400/70',
    bg: 'bg-violet-500/12',
    badge: 'border-violet-400/50 bg-violet-500/20 text-violet-200',
    dot: 'bg-violet-400',
  },
  {
    stroke: '#FBBF24',
    border: 'border-amber-400/70',
    bg: 'bg-amber-500/12',
    badge: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
    dot: 'bg-amber-400',
  },
  {
    stroke: '#FB7185',
    border: 'border-rose-400/70',
    bg: 'bg-rose-500/12',
    badge: 'border-rose-400/50 bg-rose-500/20 text-rose-200',
    dot: 'bg-rose-400',
  },
  {
    stroke: '#34D399',
    border: 'border-emerald-400/70',
    bg: 'bg-emerald-500/12',
    badge: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
    dot: 'bg-emerald-400',
  },
];

function getColorStyle(colorIndex: number | null) {
  if (colorIndex === null || colorIndex < 0) return null;
  return GROUP_COLORS[colorIndex % GROUP_COLORS.length];
}

function formatCellValue(val: SqlValue): React.ReactNode {
  if (val === null || val === undefined) {
    return (
      <span className="inline-flex items-center rounded border border-slate-600/80 bg-slate-800/90 px-1.5 py-0.5 font-mono text-[10px] font-semibold italic text-slate-300">
        NULL
      </span>
    );
  }
  return <span className="truncate">{String(val)}</span>;
}

interface ComputedLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  leftRid: number;
  rightRid: number;
  keyVal: SqlValue;
}

export function QueryVisualizer({ snapshot, replayNonce }: QueryVisualizerProps) {
  if (snapshot?.mode === 'window' && snapshot.windowSnapshot) {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-4 shadow-sm">
        <WindowVisualizer snapshot={snapshot.windowSnapshot} replayNonce={replayNonce} />
      </section>
    );
  }

  if (snapshot?.mode === 'cte' && snapshot.cteSnapshot) {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-4 shadow-sm">
        <CteVisualizer snapshot={snapshot.cteSnapshot} />
      </section>
    );
  }

  if (snapshot?.mode === 'subquery' && snapshot.subquerySnapshot) {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-4 shadow-sm">
        <SubqueryVisualizer snapshot={snapshot.subquerySnapshot} />
      </section>
    );
  }

  return <QueryVisualizerInner key={replayNonce} snapshot={snapshot} />;
}

function QueryVisualizerInner({ snapshot }: { snapshot: VizSnapshot | null }) {
  const steps = useMemo<Array<{ id: VizStep; label: string; sublabel: string }>>(() => {
    if (!snapshot || !snapshot.supported) return [];
    const list: Array<{ id: VizStep; label: string; sublabel: string }> = [];

    if (snapshot.mode === 'join' && snapshot.parsed.join) {
      list.push({
        id: 'FROM',
        label: '1. FROM & Links',
        sublabel: `${snapshot.leftTableName} ↔ ${snapshot.rightTableName}`,
      });
      list.push({
        id: 'JOIN',
        label: `2. ${snapshot.parsed.join.type} JOIN`,
        sublabel:
          snapshot.parsed.join.type === 'LEFT'
            ? 'Keep all left + NULL pad'
            : snapshot.parsed.join.type === 'RIGHT'
              ? 'Keep all right + NULL pad'
              : snapshot.parsed.join.type === 'CROSS'
                ? 'Cartesian pairs'
                : 'Keep matched pairs only',
      });
      if (snapshot.hasWhere) {
        list.push({
          id: 'WHERE',
          label: '3. WHERE',
          sublabel: 'Filter joined rows',
        });
      }
      list.push({
        id: 'SELECT',
        label: snapshot.hasWhere ? '4. SELECT' : '3. SELECT',
        sublabel: 'Project output columns',
      });
    } else {
      list.push({
        id: 'FROM',
        label: '1. FROM',
        sublabel: `Scan ${snapshot.leftTableName}`,
      });
      if (snapshot.hasWhere) {
        list.push({
          id: 'WHERE',
          label: '2. WHERE',
          sublabel: 'Keep matching rows',
        });
      }
      list.push({
        id: 'SELECT',
        label: snapshot.hasWhere ? '3. SELECT' : '2. SELECT',
        sublabel: 'Highlight selected columns',
      });
    }
    return list;
  }, [snapshot]);

  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(() =>
    Boolean(snapshot?.supported && steps.length > 1)
  );
  const [hoveredRow, setHoveredRow] = useState<{
    side: 'left' | 'right';
    rid: number;
  } | null>(null);

  const activeStep: VizStep = steps[activeStepIdx]?.id ?? 'FROM';

  useEffect(() => {
    if (!isPlaying || steps.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1550);

    return () => window.clearInterval(timer);
  }, [isPlaying, steps.length]);

  // Refs & geometry measurement for SVG FK -> PK relationship curves
  const boardRef = useRef<HTMLDivElement | null>(null);
  const leftAnchorRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const rightAnchorRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [svgLines, setSvgLines] = useState<ComputedLine[]>([]);
  const [boardSize, setBoardSize] = useState<{ w: number; h: number }>({
    w: 0,
    h: 0,
  });

  const measureLines = useCallback(() => {
    if (
      !snapshot?.supported ||
      snapshot.mode !== 'join' ||
      activeStep !== 'FROM' ||
      !boardRef.current
    ) {
      setSvgLines([]);
      return;
    }

    const containerRect = boardRef.current.getBoundingClientRect();
    setBoardSize({ w: containerRect.width, h: containerRect.height });

    const computed: ComputedLine[] = [];
    for (const edge of snapshot.edges) {
      const leftEl = leftAnchorRefs.current[edge.leftRid];
      const rightEl = rightAnchorRefs.current[edge.rightRid];
      if (!leftEl || !rightEl) continue;

      const lRect = leftEl.getBoundingClientRect();
      const rRect = rightEl.getBoundingClientRect();

      const x1 = lRect.right - containerRect.left;
      const y1 = lRect.top + lRect.height / 2 - containerRect.top;
      const x2 = rRect.left - containerRect.left;
      const y2 = rRect.top + rRect.height / 2 - containerRect.top;

      const palette = getColorStyle(edge.colorIndex) ?? GROUP_COLORS[0];

      computed.push({
        id: edge.id,
        x1,
        y1,
        x2,
        y2,
        stroke: palette.stroke,
        leftRid: edge.leftRid,
        rightRid: edge.rightRid,
        keyVal: edge.keyVal,
      });
    }

    setSvgLines(computed);
  }, [snapshot, activeStep]);

  useLayoutEffect(() => {
    measureLines();
    const rafId = requestAnimationFrame(measureLines);
    const t1 = window.setTimeout(measureLines, 120);
    const t2 = window.setTimeout(measureLines, 320);

    const observer =
      typeof ResizeObserver !== 'undefined' && boardRef.current
        ? new ResizeObserver(() => measureLines())
        : null;
    if (observer && boardRef.current) {
      observer.observe(boardRef.current);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      observer?.disconnect();
    };
  }, [measureLines]);

  const handleJumpStep = (idx: number) => {
    setIsPlaying(false);
    setActiveStepIdx(idx);
  };

  const handleReplay = () => {
    if (steps.length <= 1) return;
    setActiveStepIdx(0);
    setIsPlaying(true);
  };

  if (!snapshot) {
    return (
      <section className="flex flex-col items-center justify-center rounded-xl border border-slate-800/90 bg-[#0E1420] p-8 text-center">
        <Sparkles className="h-6 w-6 text-sky-400" />
        <h3 className="mt-2 text-sm font-semibold text-slate-200">
          Visual Query Breakdown
        </h3>
        <p className="mt-1 max-w-md text-xs text-slate-400">
          Run a query to watch how SQLite scans tables, connects foreign keys,
          filters rows with WHERE, and projects SELECT columns.
        </p>
      </section>
    );
  }

  if (!snapshot.supported) {
    return (
      <section className="rounded-xl border border-slate-800/90 bg-[#0E1420] p-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <Layers className="h-4 w-4 text-violet-400" />
          Visual Query Breakdown
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {snapshot.unsupportedReason ||
            'Visualization is available for single-table and 2-table JOIN SELECT queries.'}
        </p>
      </section>
    );
  }

  const isJoinMode = snapshot.mode === 'join' && snapshot.parsed.join !== null;
  const joinType = snapshot.parsed.join?.type;

  // Determine step caption for clear pedagogical context
  let stepTitle = '';
  let stepDescription = '';
  if (activeStep === 'FROM') {
    if (isJoinMode) {
      stepTitle = `Step 1 — Load "${snapshot.leftTableName}" & "${snapshot.rightTableName}" Side-by-Side`;
      stepDescription = `Foreign key links (${snapshot.leftAlias}.${snapshot.parsed.join?.leftColumn} → ${snapshot.rightAlias}.${snapshot.parsed.join?.rightColumn}) are color-coded before merging. Hover a row to trace its match.`;
    } else {
      stepTitle = `Step 1 — Scan Source Table "${snapshot.leftTableName}"`;
      stepDescription = `SQL starts at the FROM clause, loading all ${snapshot.leftRows.length} rows before any filtering or column trimming.`;
    }
  } else if (activeStep === 'JOIN') {
    if (joinType === 'INNER') {
      stepTitle = `Step 2 — INNER JOIN (Matched Pairs Only)`;
      stepDescription = `Rows with matching keys slide together into combined rows. Unmatched rows in both tables fade out and are excluded.`;
    } else if (joinType === 'LEFT') {
      stepTitle = `Step 2 — LEFT JOIN (Keep All "${snapshot.leftTableName}" Rows)`;
      stepDescription = `Every row from the left table is preserved. Matching right rows slide across; unmatched left rows receive grey NULL placeholder cells.`;
    } else if (joinType === 'RIGHT') {
      stepTitle = `Step 2 — RIGHT JOIN (Keep All "${snapshot.rightTableName}" Rows)`;
      stepDescription = `Every row from the right table is preserved. Unmatched right rows receive grey NULL placeholder cells on the left.`;
    } else {
      stepTitle = `Step 2 — CROSS JOIN (All Combinations)`;
      stepDescription = `Each row from the left table pairs with every row from the right table.`;
    }
  } else if (activeStep === 'WHERE') {
    stepTitle = `Filter Rows with WHERE (${snapshot.parsed.whereClause})`;
    stepDescription = `Rows satisfying the predicate glow green and stay; rows that evaluate to false or unknown fade out.`;
  } else if (activeStep === 'SELECT') {
    stepTitle = `Project Output Columns (SELECT)`;
    stepDescription = snapshot.parsed.selectAll
      ? `SELECT * retains every column from the working row set.`
      : `Only the highlighted columns are kept in the final query output; unselected columns are trimmed away.`;
  }

  const showWhereHighlights =
    activeStep === 'WHERE' ||
    (activeStep === 'SELECT' && snapshot.hasWhere);
  const showSelectHighlights = activeStep === 'SELECT';

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0E1420] shadow-sm">
      {/* Visualizer Header & Step Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-[#0B101B] px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Execution Visualizer
          </span>
          {isJoinMode && joinType && (
            <span
              className={`rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold ${
                joinType === 'LEFT'
                  ? 'border-sky-500/40 bg-sky-500/15 text-sky-300'
                  : joinType === 'INNER'
                    ? 'border-violet-500/40 bg-violet-500/15 text-violet-300'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-300'
              }`}
            >
              {joinType} JOIN
            </span>
          )}
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveStepIdx((i) => Math.max(0, i - 1));
            }}
            disabled={activeStepIdx === 0}
            title="Previous Step"
            className="rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-35"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else if (activeStepIdx >= steps.length - 1) {
                handleReplay();
              } else {
                setIsPlaying(true);
              }
            }}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 text-amber-300" />
                Pause
              </>
            ) : activeStepIdx >= steps.length - 1 ? (
              <>
                <RotateCcw className="h-3 w-3 text-sky-300" />
                Replay
              </>
            ) : (
              <>
                <Play className="h-3 w-3 fill-current text-emerald-300" />
                Animate
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setActiveStepIdx((i) => Math.min(steps.length - 1, i + 1));
            }}
            disabled={activeStepIdx >= steps.length - 1}
            title="Next Step"
            className="rounded-md border border-slate-800 bg-slate-900 p-1.5 text-slate-300 transition hover:border-slate-700 hover:text-white disabled:opacity-35"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Step Pills */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/70 bg-[#0A0F1A] px-3.5 py-2.5">
        {steps.map((step, idx) => {
          const isActive = idx === activeStepIdx;
          const isCompleted = idx < activeStepIdx;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => handleJumpStep(idx)}
                className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left transition-all ${
                  isActive
                    ? 'border-sky-500/70 bg-sky-500/15 text-sky-100 shadow-[0_0_16px_rgba(56,189,248,0.12)]'
                    : isCompleted
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200/90 hover:border-emerald-500/50'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {step.id === 'FROM' && <Layers className="h-3.5 w-3.5 shrink-0" />}
                {step.id === 'JOIN' && <Link2 className="h-3.5 w-3.5 shrink-0" />}
                {step.id === 'WHERE' && <Filter className="h-3.5 w-3.5 shrink-0" />}
                {step.id === 'SELECT' && <Columns3 className="h-3.5 w-3.5 shrink-0" />}
                <div>
                  <div className="font-mono text-[11px] font-semibold leading-tight">
                    {step.label}
                  </div>
                  <div className="text-[10px] opacity-75">{step.sublabel}</div>
                </div>
              </button>
              {idx < steps.length - 1 && (
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Explanation Banner */}
      <div className="border-b border-slate-800/60 bg-slate-900/40 px-4 py-2.5">
        <div className="text-xs font-semibold text-slate-100">{stepTitle}</div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">
          {stepDescription}
        </p>
      </div>

      {/* Main Visualization Canvas */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {/* ========================================================== */}
          {/* VIEW 1: SINGLE-TABLE PIPELINE (FROM -> WHERE -> SELECT)    */}
          {/* ========================================================== */}
          {!isJoinMode && (
            <motion.div
              key={`single-${activeStep}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
              className="overflow-x-auto"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-sky-300">
                  Table: {snapshot.leftTableName}
                  {snapshot.leftAlias !== snapshot.leftTableName && (
                    <span className="text-slate-500">
                      AS {snapshot.leftAlias}
                    </span>
                  )}
                </span>
                {showWhereHighlights && (
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Kept ({snapshot.leftRows.filter((r) => r.keptByWhere).length})
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-slate-600" />
                      Filtered out (
                      {snapshot.leftRows.filter((r) => !r.keptByWhere).length})
                    </span>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-800 bg-[#0A0F1A]">
                <table className="w-full border-collapse text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0B101B]">
                      {snapshot.leftColumns.map((col) => {
                        const colActive = !showSelectHighlights || col.selected;
                        return (
                          <th
                            key={col.name}
                            className={`px-3 py-2 text-[11px] font-semibold transition-all duration-300 ${
                              showSelectHighlights && col.selected
                                ? 'bg-sky-500/15 text-sky-300 shadow-[inset_0_-2px_0_#38BDF8]'
                                : colActive
                                  ? 'text-slate-300'
                                  : 'text-slate-600 opacity-35'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span>{col.name}</span>
                              {showSelectHighlights && col.selected && (
                                <CheckCircle2 className="h-3 w-3 text-sky-400" />
                              )}
                            </div>
                          </th>
                        );
                      })}
                      <th className="px-3 py-2 text-right text-[10px] font-medium text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {snapshot.leftRows.map((row) => {
                      const kept = !showWhereHighlights || row.keptByWhere;
                      return (
                        <motion.tr
                          key={row.rid}
                          animate={{
                            opacity: kept ? 1 : 0.24,
                          }}
                          transition={{ duration: 0.35 }}
                          className={
                            showWhereHighlights && row.keptByWhere
                              ? 'bg-emerald-500/10'
                              : ''
                          }
                        >
                          {snapshot.leftColumns.map((col) => {
                            const colActive = !showSelectHighlights || col.selected;
                            return (
                              <td
                                key={col.name}
                                className={`px-3 py-2 transition-all duration-300 ${
                                  showWhereHighlights && row.keptByWhere
                                    ? 'text-emerald-100'
                                    : 'text-slate-200'
                                } ${
                                  showSelectHighlights && col.selected
                                    ? 'bg-sky-500/8 font-medium text-sky-100'
                                    : colActive
                                      ? ''
                                      : 'opacity-25'
                                }`}
                              >
                                {formatCellValue(row.data[col.name] ?? null)}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right text-[10px]">
                            {showWhereHighlights ? (
                              row.keptByWhere ? (
                                <span className="rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
                                  KEPT
                                </span>
                              ) : (
                                <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2 py-0.5 text-slate-400">
                                  FILTERED
                                </span>
                              )
                            ) : (
                              <span className="text-slate-600">row #{row.rid}</span>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* VIEW 2: JOIN STEP 1 — SIDE-BY-SIDE TABLES + SVG FK/PK LINES*/}
          {/* ========================================================== */}
          {isJoinMode && activeStep === 'FROM' && (
            <motion.div
              key="join-from"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              ref={boardRef}
              className="relative"
            >
              {/* SVG Relationship Overlay */}
              {boardSize.w > 0 && svgLines.length > 0 && (
                <svg
                  width={boardSize.w}
                  height={boardSize.h}
                  className="pointer-events-none absolute inset-0 z-10 overflow-visible"
                >
                  {svgLines.map((line) => {
                    const isHighlighted =
                      !hoveredRow ||
                      (hoveredRow.side === 'left' &&
                        hoveredRow.rid === line.leftRid) ||
                      (hoveredRow.side === 'right' &&
                        hoveredRow.rid === line.rightRid);

                    const cx = (line.x1 + line.x2) / 2;
                    const d = `M ${line.x1} ${line.y1} C ${cx} ${line.y1}, ${cx} ${line.y2}, ${line.x2} ${line.y2}`;

                    return (
                      <g key={line.id}>
                        <motion.path
                          d={d}
                          fill="none"
                          stroke={line.stroke}
                          strokeWidth={isHighlighted ? 2.5 : 1.5}
                          strokeDasharray={isHighlighted ? undefined : '4 4'}
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{
                            pathLength: 1,
                            opacity: isHighlighted ? 0.92 : 0.18,
                          }}
                          transition={{ duration: 0.55, ease: 'easeOut' }}
                        />
                        <motion.circle
                          cx={line.x1}
                          cy={line.y1}
                          r={isHighlighted ? 4 : 3}
                          fill={line.stroke}
                          initial={{ scale: 0 }}
                          animate={{
                            scale: 1,
                            opacity: isHighlighted ? 1 : 0.25,
                          }}
                        />
                        <motion.circle
                          cx={line.x2}
                          cy={line.y2}
                          r={isHighlighted ? 4 : 3}
                          fill={line.stroke}
                          initial={{ scale: 0 }}
                          animate={{
                            scale: 1,
                            opacity: isHighlighted ? 1 : 0.25,
                          }}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Side-by-Side Tables Grid */}
              <div className="relative z-20 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_56px_1fr] lg:items-start lg:gap-0">
                {/* LEFT TABLE (Table A) */}
                <div className="overflow-hidden rounded-lg border border-sky-500/30 bg-[#0A0F1A]">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-sky-500/10 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-sky-300">
                      Table A (Left): {snapshot.leftTableName}
                      {snapshot.leftAlias !== snapshot.leftTableName &&
                        ` (${snapshot.leftAlias})`}
                    </span>
                    <span className="font-mono text-[10px] text-sky-200/75">
                      key: {snapshot.parsed.join?.leftColumn}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/70">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 bg-[#0B101B] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-slate-400">
                      <div
                        className="grid flex-1 gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(1, snapshot.leftColumns.length)}, minmax(0, 1fr))`,
                        }}
                      >
                        {snapshot.leftColumns.map((col) => (
                          <div
                            key={col.name}
                            className={`truncate ${
                              col.isJoinKey ? 'text-sky-300' : ''
                            }`}
                          >
                            {col.name}
                            {col.isJoinKey && ' ★'}
                          </div>
                        ))}
                      </div>
                      <div className="w-14 shrink-0 text-right text-[9px] text-slate-500">
                        KEY
                      </div>
                    </div>

                    {/* Body Rows */}
                    {snapshot.leftRows.map((row) => {
                      const palette = getColorStyle(row.colorIndex);
                      const isMatchHovered =
                        hoveredRow &&
                        ((hoveredRow.side === 'left' &&
                          hoveredRow.rid === row.rid) ||
                          (hoveredRow.side === 'right' &&
                            snapshot.edges.some(
                              (e) =>
                                e.leftRid === row.rid &&
                                e.rightRid === hoveredRow.rid
                            )));
                      const dimBecauseHover = hoveredRow && !isMatchHovered;

                      return (
                        <div
                          key={row.rid}
                          ref={(el) => {
                            leftAnchorRefs.current[row.rid] = el;
                          }}
                          onMouseEnter={() =>
                            setHoveredRow({ side: 'left', rid: row.rid })
                          }
                          onMouseLeave={() => setHoveredRow(null)}
                          className={`relative flex items-center justify-between gap-2 border-l-2 px-2.5 py-2 font-mono text-[11px] transition-all ${
                            row.hasPartner && palette
                              ? `${palette.border} ${palette.bg}`
                              : 'border-slate-700 bg-slate-900/40'
                          } ${dimBecauseHover ? 'opacity-35' : 'opacity-100'}`}
                        >
                          <div
                            className="grid flex-1 gap-1.5"
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(1, snapshot.leftColumns.length)}, minmax(0, 1fr))`,
                            }}
                          >
                            {snapshot.leftColumns.map((col) => (
                              <div
                                key={col.name}
                                className={`truncate ${
                                  col.isJoinKey && palette
                                    ? 'font-bold text-white'
                                    : 'text-slate-200'
                                }`}
                              >
                                {formatCellValue(row.data[col.name] ?? null)}
                              </div>
                            ))}
                          </div>

                          <div className="flex w-14 shrink-0 justify-end">
                            {row.hasPartner && palette ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${palette.badge}`}
                              >
                                ={String(row.joinKeyVal)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[9px] text-slate-400">
                                no match
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CENTER CONNECTOR SPACER */}
                <div className="hidden flex-col items-center justify-center pt-10 lg:flex">
                  <div className="rounded-full border border-slate-700/80 bg-slate-900/90 px-2 py-1 font-mono text-[10px] font-bold text-slate-300 shadow">
                    ON =
                  </div>
                </div>

                {/* RIGHT TABLE (Table B) */}
                <div className="overflow-hidden rounded-lg border border-violet-500/30 bg-[#0A0F1A]">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-violet-500/10 px-3 py-2">
                    <span className="font-mono text-xs font-bold text-violet-300">
                      Table B (Right): {snapshot.rightTableName}
                      {snapshot.rightAlias !== snapshot.rightTableName &&
                        ` (${snapshot.rightAlias})`}
                    </span>
                    <span className="font-mono text-[10px] text-violet-200/75">
                      key: {snapshot.parsed.join?.rightColumn}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-800/70">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-2 bg-[#0B101B] px-2.5 py-1.5 font-mono text-[10px] font-semibold text-slate-400">
                      <div className="w-14 shrink-0 text-[9px] text-slate-500">
                        KEY
                      </div>
                      <div
                        className="grid flex-1 gap-1.5"
                        style={{
                          gridTemplateColumns: `repeat(${Math.max(1, snapshot.rightColumns.length)}, minmax(0, 1fr))`,
                        }}
                      >
                        {snapshot.rightColumns.map((col) => (
                          <div
                            key={col.name}
                            className={`truncate ${
                              col.isJoinKey ? 'text-violet-300' : ''
                            }`}
                          >
                            {col.name}
                            {col.isJoinKey && ' ★'}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Body Rows */}
                    {snapshot.rightRows.map((row) => {
                      const palette = getColorStyle(row.colorIndex);
                      const isMatchHovered =
                        hoveredRow &&
                        ((hoveredRow.side === 'right' &&
                          hoveredRow.rid === row.rid) ||
                          (hoveredRow.side === 'left' &&
                            snapshot.edges.some(
                              (e) =>
                                e.rightRid === row.rid &&
                                e.leftRid === hoveredRow.rid
                            )));
                      const dimBecauseHover = hoveredRow && !isMatchHovered;

                      return (
                        <div
                          key={row.rid}
                          ref={(el) => {
                            rightAnchorRefs.current[row.rid] = el;
                          }}
                          onMouseEnter={() =>
                            setHoveredRow({ side: 'right', rid: row.rid })
                          }
                          onMouseLeave={() => setHoveredRow(null)}
                          className={`relative flex items-center justify-between gap-2 border-r-2 px-2.5 py-2 font-mono text-[11px] transition-all ${
                            row.hasPartner && palette
                              ? `${palette.border} ${palette.bg}`
                              : 'border-slate-700 bg-slate-900/40'
                          } ${dimBecauseHover ? 'opacity-35' : 'opacity-100'}`}
                        >
                          <div className="flex w-14 shrink-0 justify-start">
                            {row.hasPartner && palette ? (
                              <span
                                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-bold ${palette.badge}`}
                              >
                                ={String(row.joinKeyVal)}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded border border-slate-700 bg-slate-800/80 px-1.5 py-0.5 text-[9px] text-slate-400">
                                0 match
                              </span>
                            )}
                          </div>

                          <div
                            className="grid flex-1 gap-1.5"
                            style={{
                              gridTemplateColumns: `repeat(${Math.max(1, snapshot.rightColumns.length)}, minmax(0, 1fr))`,
                            }}
                          >
                            {snapshot.rightColumns.map((col) => (
                              <div
                                key={col.name}
                                className={`truncate ${
                                  col.isJoinKey && palette
                                    ? 'font-bold text-white'
                                    : 'text-slate-200'
                                }`}
                              >
                                {formatCellValue(row.data[col.name] ?? null)}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================== */}
          {/* VIEW 3: JOIN MERGED STAGE (JOIN -> WHERE -> SELECT)        */}
          {/* ========================================================== */}
          {isJoinMode && activeStep !== 'FROM' && (
            <motion.div
              key={`join-merged-${joinType}-${activeStep}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col gap-4"
            >
              {/* Compact Row Retention Summary Strip for Table A & Table B */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-sky-500/25 bg-[#0A0F1A] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold text-sky-300">
                      Left: {snapshot.leftTableName}
                    </span>
                    <span className="text-slate-400">
                      {snapshot.leftRows.filter((r) => r.keptByJoin).length}/
                      {snapshot.leftRows.length} included
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {snapshot.leftRows.map((row) => {
                      const palette = getColorStyle(row.colorIndex);
                      const label = String(
                        row.data.name ?? row.data.id ?? `#${row.rid}`
                      );
                      return (
                        <span
                          key={row.rid}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] transition-opacity ${
                            !row.keptByJoin
                              ? 'border-slate-800 bg-slate-900/50 text-slate-500 line-through opacity-35'
                              : row.hasPartner && palette
                                ? `${palette.badge}`
                                : 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                          }`}
                        >
                          {label}
                          {row.keptByJoin && !row.hasPartner && (
                            <span className="rounded bg-slate-900/80 px-1 text-[9px] text-slate-300">
                              +NULL
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-lg border border-violet-500/25 bg-[#0A0F1A] p-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-mono font-semibold text-violet-300">
                      Right: {snapshot.rightTableName}
                    </span>
                    <span className="text-slate-400">
                      {snapshot.rightRows.filter((r) => r.keptByJoin).length}/
                      {snapshot.rightRows.length} included
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {snapshot.rightRows.map((row) => {
                      const palette = getColorStyle(row.colorIndex);
                      const label = String(
                        row.data.name ?? row.data.id ?? `#${row.rid}`
                      );
                      return (
                        <span
                          key={row.rid}
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] transition-opacity ${
                            !row.keptByJoin
                              ? 'border-slate-800 bg-slate-900/50 text-slate-500 line-through opacity-35'
                              : row.hasPartner && palette
                                ? `${palette.badge}`
                                : 'border-amber-500/50 bg-amber-500/15 text-amber-200'
                          }`}
                        >
                          {label}
                          {!row.keptByJoin && (
                            <span className="text-[9px] opacity-75">
                              (faded)
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Combined Sliding Joined Rows */}
              <div className="overflow-x-auto rounded-lg border border-slate-800 bg-[#0A0F1A]">
                {/* Column Header Strip */}
                <div className="flex min-w-[680px] items-stretch border-b border-slate-800 bg-[#0B101B] font-mono text-[10px] font-semibold">
                  <div
                    className="grid flex-1 gap-2 border-r border-slate-800/80 px-3 py-2 text-sky-300"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(1, snapshot.leftColumns.length)}, minmax(0, 1fr))`,
                    }}
                  >
                    {snapshot.leftColumns.map((col) => {
                      const colDim = showSelectHighlights && !col.selected;
                      return (
                        <div
                          key={`lh-${col.name}`}
                          className={`flex items-center gap-1 truncate transition-opacity ${
                            colDim
                              ? 'text-slate-600 opacity-30'
                              : showSelectHighlights && col.selected
                                ? 'text-sky-200 underline decoration-sky-400 underline-offset-4'
                                : ''
                          }`}
                        >
                          <span>
                            {snapshot.leftAlias}.{col.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex w-16 shrink-0 items-center justify-center bg-slate-900/70 px-1 text-[9px] uppercase tracking-wider text-slate-500">
                    {joinType}
                  </div>

                  <div
                    className="grid flex-1 gap-2 border-l border-slate-800/80 px-3 py-2 text-violet-300"
                    style={{
                      gridTemplateColumns: `repeat(${Math.max(1, snapshot.rightColumns.length)}, minmax(0, 1fr))`,
                    }}
                  >
                    {snapshot.rightColumns.map((col) => {
                      const colDim = showSelectHighlights && !col.selected;
                      return (
                        <div
                          key={`rh-${col.name}`}
                          className={`flex items-center gap-1 truncate transition-opacity ${
                            colDim
                              ? 'text-slate-600 opacity-30'
                              : showSelectHighlights && col.selected
                                ? 'text-violet-200 underline decoration-violet-400 underline-offset-4'
                                : ''
                          }`}
                        >
                          <span>
                            {snapshot.rightAlias}.{col.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Sliding Merged Rows */}
                <div className="min-w-[680px] divide-y divide-slate-800/60">
                  {snapshot.mergedRows.map((mRow, idx) => {
                    const palette = getColorStyle(mRow.colorIndex);
                    const whereFilteredOut =
                      showWhereHighlights && !mRow.keptByWhere;
                    const whereKept = showWhereHighlights && mRow.keptByWhere;

                    return (
                      <motion.div
                        key={mRow.id}
                        initial={{ opacity: 0.3 }}
                        animate={{
                          opacity: whereFilteredOut ? 0.22 : 1,
                        }}
                        transition={{ duration: 0.35, delay: idx * 0.04 }}
                        className={`flex items-stretch font-mono text-[11px] ${
                          whereKept
                            ? 'bg-emerald-500/12 shadow-[inset_3px_0_0_#10B981]'
                            : ''
                        }`}
                      >
                        {/* Left Side Cells — slides from left */}
                        <motion.div
                          initial={{ x: -24, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 24,
                            delay: idx * 0.05,
                          }}
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(1, snapshot.leftColumns.length)}, minmax(0, 1fr))`,
                          }}
                          className={`grid flex-1 items-center gap-2 px-3 py-2.5 ${
                            mRow.isNullPaddedLeft
                              ? 'null-hatch border-r border-dashed border-slate-700'
                              : palette && !whereKept
                                ? `${palette.bg} border-l-2 ${palette.border}`
                                : 'bg-sky-500/5'
                          }`}
                        >
                          {mRow.isNullPaddedLeft
                            ? snapshot.leftColumns.map((col) => (
                                <div key={`lnull-${col.name}`}>
                                  <span className="inline-flex items-center rounded border border-slate-600 bg-slate-800/95 px-2 py-0.5 text-[10px] font-bold italic text-slate-300">
                                    NULL
                                  </span>
                                </div>
                              ))
                            : snapshot.leftColumns.map((col) => {
                                const colDim =
                                  showSelectHighlights && !col.selected;
                                return (
                                  <div
                                    key={`l-${col.name}`}
                                    className={`truncate transition-opacity ${
                                      colDim
                                        ? 'opacity-20'
                                        : showSelectHighlights && col.selected
                                          ? 'font-semibold text-sky-100'
                                          : 'text-slate-200'
                                    }`}
                                  >
                                    {formatCellValue(
                                      mRow.leftRow?.data[col.name] ?? null
                                    )}
                                  </div>
                                );
                              })}
                        </motion.div>

                        {/* Center Seam Badge */}
                        <div className="flex w-16 shrink-0 items-center justify-center border-x border-slate-800/80 bg-slate-950/60 px-1">
                          {mRow.isNullPaddedRight || mRow.isNullPaddedLeft ? (
                            <span className="rounded border border-slate-600/80 bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">
                              NULL
                            </span>
                          ) : palette ? (
                            <span
                              className={`rounded border px-1.5 py-0.5 text-[9px] font-bold ${palette.badge}`}
                            >
                              ={String(
                                mRow.leftRow?.joinKeyVal ??
                                  mRow.rightRow?.joinKeyVal ??
                                  '✓'
                              )}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">×</span>
                          )}
                        </div>

                        {/* Right Side Cells — slides from right (or grey NULL placeholders!) */}
                        <motion.div
                          initial={{ x: 24, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{
                            type: 'spring',
                            stiffness: 260,
                            damping: 24,
                            delay: idx * 0.05 + 0.06,
                          }}
                          style={{
                            gridTemplateColumns: `repeat(${Math.max(1, snapshot.rightColumns.length)}, minmax(0, 1fr))`,
                          }}
                          className={`grid flex-1 items-center gap-2 px-3 py-2.5 ${
                            mRow.isNullPaddedRight
                              ? 'null-hatch border-r-2 border-dashed border-slate-600'
                              : palette && !whereKept
                                ? `${palette.bg} border-r-2 ${palette.border}`
                                : 'bg-violet-500/5'
                          }`}
                        >
                          {mRow.isNullPaddedRight
                            ? snapshot.rightColumns.map((col) => (
                                <div key={`rnull-${col.name}`}>
                                  <span className="inline-flex items-center rounded border border-slate-600 bg-slate-800/95 px-2 py-0.5 text-[10px] font-bold italic text-slate-300 shadow-sm">
                                    NULL
                                  </span>
                                </div>
                              ))
                            : snapshot.rightColumns.map((col) => {
                                const colDim =
                                  showSelectHighlights && !col.selected;
                                return (
                                  <div
                                    key={`r-${col.name}`}
                                    className={`truncate transition-opacity ${
                                      colDim
                                        ? 'opacity-20'
                                        : showSelectHighlights && col.selected
                                          ? 'font-semibold text-violet-100'
                                          : 'text-slate-200'
                                    }`}
                                  >
                                    {formatCellValue(
                                      mRow.rightRow?.data[col.name] ?? null
                                    )}
                                  </div>
                                );
                              })}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Unmatched / Faded Rows Callout */}
              <ExcludedRowsFooter
                leftRows={snapshot.leftRows}
                rightRows={snapshot.rightRows}
                leftTableName={snapshot.leftTableName}
                rightTableName={snapshot.rightTableName || ''}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function ExcludedRowsFooter({
  leftRows,
  rightRows,
  leftTableName,
  rightTableName,
}: {
  leftRows: VizSourceRow[];
  rightRows: VizSourceRow[];
  leftTableName: string;
  rightTableName: string;
}) {
  const droppedLeft = leftRows.filter((r) => !r.keptByJoin);
  const droppedRight = rightRows.filter((r) => !r.keptByJoin);

  if (droppedLeft.length === 0 && droppedRight.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2 text-[11px] text-slate-400">
      <span className="font-semibold text-slate-300">Faded Out by JOIN:</span>
      {droppedLeft.map((r) => (
        <span
          key={`dl-${r.rid}`}
          className="inline-flex items-center gap-1.5 rounded border border-slate-800 bg-slate-900/70 px-2 py-0.5 font-mono text-[10px] text-slate-400 opacity-60"
        >
          <span className="text-sky-400/70">{leftTableName}:</span>
          {String(r.data.name ?? r.data.id)} (no matching key)
        </span>
      ))}
      {droppedRight.map((r) => (
        <span
          key={`dr-${r.rid}`}
          className="inline-flex items-center gap-1.5 rounded border border-slate-800 bg-slate-900/70 px-2 py-0.5 font-mono text-[10px] text-slate-400 opacity-60"
        >
          <span className="text-violet-400/70">{rightTableName}:</span>
          {String(r.data.name ?? r.data.id)} (no matching rows)
        </span>
      ))}
    </div>
  );
}
