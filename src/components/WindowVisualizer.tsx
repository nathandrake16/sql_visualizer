'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  MoveRight,
  TrendingUp,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { VizWindowSnapshot } from '@/lib/buildVizPlan';
import { SqlValue } from '@/types/sql';

interface WindowVisualizerProps {
  snapshot: VizWindowSnapshot;
  replayNonce?: number;
  activeStage?: 1 | 2 | 3 | 4;
  hideTopControls?: boolean;
}

const PARTITION_THEMES = [
  {
    border: 'border-sky-500/40',
    bg: 'bg-sky-500/10',
    headerBg: 'bg-sky-500/20 text-sky-200',
    badge: 'border-sky-400/50 bg-sky-500/20 text-sky-200',
    dot: 'bg-sky-400',
  },
  {
    border: 'border-violet-500/40',
    bg: 'bg-violet-500/10',
    headerBg: 'bg-violet-500/20 text-violet-200',
    badge: 'border-violet-400/50 bg-violet-500/20 text-violet-200',
    dot: 'bg-violet-400',
  },
  {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    headerBg: 'bg-amber-500/20 text-amber-200',
    badge: 'border-amber-400/50 bg-amber-500/20 text-amber-200',
    dot: 'bg-amber-400',
  },
  {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    headerBg: 'bg-emerald-500/20 text-emerald-200',
    badge: 'border-emerald-400/50 bg-emerald-500/20 text-emerald-200',
    dot: 'bg-emerald-400',
  },
];

export function WindowVisualizer({
  snapshot,
  replayNonce = 0,
  activeStage,
  hideTopControls = false,
}: WindowVisualizerProps) {
  return (
    <WindowVisualizerInner
      key={replayNonce}
      snapshot={snapshot}
      activeStage={activeStage}
      hideTopControls={hideTopControls}
    />
  );
}

function WindowVisualizerInner({
  snapshot,
  activeStage,
  hideTopControls = false,
}: {
  snapshot: VizWindowSnapshot;
  activeStage?: 1 | 2 | 3 | 4;
  hideTopControls?: boolean;
}) {
  const steps = [
    { id: 1, label: '1. Partitioning', desc: 'Group rows into distinct partition buckets' },
    { id: 2, label: '2. In-Partition Sort', desc: 'Order rows within each partition' },
    { id: 3, label: '3. Window Frame & Pointers', desc: 'Slide frame / evaluate LEAD, LAG or aggregations' },
    { id: 4, label: '4. Window Projection', desc: 'Attach calculated window value to each output row' },
  ];

  const [internalStep, setInternalStep] = useState<number>(activeStage ?? 3);
  const activeStep = activeStage ?? internalStep;
  const win = snapshot.functionSpec;

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {!hideTopControls && (
        <>
          {/* Function Spec Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-500/30 bg-[#0A0F1A] px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-400" />
              <span className="font-semibold text-slate-100">Window Function:</span>
              <code className="rounded bg-sky-500/15 px-2 py-0.5 text-xs text-sky-300">
                {win.funcName}({win.funcArgs.join(', ')})
              </code>
              {win.alias && (
                <span className="text-slate-400">
                  AS <span className="text-white font-bold">{win.alias}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInternalStep((s) => (s < 4 ? s + 1 : 1))}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 hover:border-slate-600"
              >
                {activeStep === 4 ? (
                  <>
                    <RotateCcw className="h-3 w-3 text-sky-400" /> Reset View
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current text-emerald-400" /> Step {activeStep}/4
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Step Switcher */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {steps.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setInternalStep(s.id)}
                className={`rounded-lg border p-2 text-left transition ${
                  activeStep === s.id
                    ? 'border-sky-500 bg-sky-500/15 text-white shadow-sm'
                    : activeStep > s.id
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-semibold text-[11px] flex items-center justify-between">
                  <span>{s.label}</span>
                  {activeStep > s.id && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                </div>
                <div className="mt-0.5 text-[10px] opacity-75 truncate">{s.desc}</div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Explanatory Caption */}
      <div className="rounded-lg border border-slate-800/80 bg-[#0B101B] px-3.5 py-2 text-[11px] text-slate-300">
        {activeStep === 1 && (
          <div>
            <span className="font-semibold text-sky-300">Phase 1 (Partitioning): </span>
            {snapshot.hasPartitionBy
              ? `Rows are divided into ${snapshot.partitions.length} isolated partition buckets based on PARTITION BY (${win.partitionBy.join(', ')}). Ranks & calculations reset per partition.`
              : 'No PARTITION BY specified; all table rows reside in a single global partition.'}
          </div>
        )}
        {activeStep === 2 && (
          <div>
            <span className="font-semibold text-violet-300">Phase 2 (In-Partition Sort): </span>
            {snapshot.hasOrderBy
              ? `Rows within each bucket are ordered by ${win.orderBy.map((o) => `${o.column} ${o.direction}`).join(', ')}.`
              : 'No ORDER BY specified; default physical row order applies.'}
          </div>
        )}
        {activeStep === 3 && (
          <div>
            <span className="font-semibold text-amber-300">Phase 3 (Frame / Offset Calculation): </span>
            {win.funcName === 'LEAD' || win.funcName === 'LAG'
              ? `${win.funcName}() draws values from neighboring rows in the partition (marked with arrow pointers). Boundary rows receive NULL.`
              : snapshot.hasFrame
                ? `Sliding frame (${win.frameSpec?.raw}) aggregates preceding and current rows dynamically.`
                : `${win.funcName}() evaluates across all preceding rows in the partition.`}
          </div>
        )}
        {activeStep === 4 && (
          <div>
            <span className="font-semibold text-emerald-300">Phase 4 (Output Projection): </span>
            The computed window value ({win.alias || win.funcName}) is joined back onto each original row without collapsing or eliminating any records.
          </div>
        )}
      </div>

      {/* Partition Buckets Container */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatePresence>
          {snapshot.partitions.map((part, pIdx) => {
            const theme = PARTITION_THEMES[pIdx % PARTITION_THEMES.length];
            return (
              <motion.div
                key={part.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: pIdx * 0.08 }}
                className={`overflow-hidden rounded-xl border ${theme.border} bg-[#0A0F1A] shadow-sm`}
              >
                {/* Partition Header */}
                <div className={`flex items-center justify-between border-b border-slate-800 px-3 py-2 ${theme.headerBg}`}>
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5" />
                    <span className="font-semibold text-xs truncate">
                      Partition: {part.displayKey}
                    </span>
                  </div>
                  <span className="rounded bg-slate-900/60 px-1.5 py-0.5 text-[10px]">
                    {part.rows.length} row(s)
                  </span>
                </div>

                {/* Partition Rows */}
                <div className="divide-y divide-slate-800/60 p-1.5">
                  {part.rows.map((row) => {
                    const isPointerSource = part.rows.some((other) => other.leadLagPointerRowId === row.rowId);
                    return (
                      <div
                        key={row.rowId}
                        className={`flex items-center justify-between gap-2 rounded px-2.5 py-1.5 transition ${
                          isPointerSource && activeStep >= 3 ? 'border-r-2 border-sky-400/60 bg-sky-500/5' : ''
                        } ${activeStep >= 3 ? 'hover:bg-slate-800/40' : ''}`}
                      >
                        {/* Order Rank Badge */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                              activeStep >= 2
                                ? 'bg-sky-500/20 text-sky-200 border border-sky-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {row.orderRank}
                          </span>

                          {/* Primary label columns */}
                          <div className="flex items-center gap-2 text-slate-200">
                            <span className="font-semibold text-white">
                              {String(row.data.name ?? row.data.title ?? row.data.ticker ?? `#${row.rowId}`)}
                            </span>
                            {row.data.salary !== undefined && (
                              <span className="text-[10px] text-slate-400">
                                ${Number(row.data.salary).toLocaleString()}
                              </span>
                            )}
                            {row.data.close_price !== undefined && (
                              <span className="text-[10px] text-slate-400">
                                ${Number(row.data.close_price).toFixed(2)}
                              </span>
                            )}
                            {row.data.amount !== undefined && (
                              <span className="text-[10px] text-slate-400">
                                ${Number(row.data.amount).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Calculated Window Result Pill */}
                        <div className="flex items-center gap-1.5">
                          {activeStep >= 3 && (win.funcName === 'LEAD' || win.funcName === 'LAG') && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <MoveRight className="h-3 w-3 text-sky-400" />
                              {win.funcName}
                            </span>
                          )}

                          <span
                            className={`rounded border px-2 py-0.5 text-[11px] font-bold ${
                              activeStep >= 3
                                ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-200'
                                : 'border-slate-800 bg-slate-900 text-slate-500'
                            }`}
                          >
                            {activeStep >= 3 ? formatValue(row.windowVal) : '...'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatValue(val: SqlValue): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }
  return String(val);
}
