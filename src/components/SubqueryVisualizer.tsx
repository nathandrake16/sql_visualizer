'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Code,
  ArrowDown,
  CheckCircle2,
  XCircle,
  Filter,
} from 'lucide-react';
import { VizSubquerySnapshot } from '@/lib/buildVizPlan';

interface SubqueryVisualizerProps {
  snapshot: VizSubquerySnapshot;
}

export function SubqueryVisualizer({ snapshot }: SubqueryVisualizerProps) {
  const { subquery, innerScalarValue, innerValues, outerRows } = snapshot;

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* Step 1: Inner Subquery Resolution Banner */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-amber-500/40 bg-[#0E1420] p-4 shadow-sm"
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-amber-400" />
            <span className="font-semibold text-xs text-white">Step 1: Inner Subquery Evaluation</span>
          </div>
          <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {subquery.isCorrelated ? 'Correlated Loop' : 'Uncorrelated (Evaluates Once)'}
          </span>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#080C14] p-2.5 text-[11px] text-amber-200/90">
          <pre className="overflow-x-auto whitespace-pre-wrap">{subquery.subquerySql}</pre>
        </div>

        {/* Resolved Inner Result */}
        <div className="mt-3 flex items-center gap-2">
          <span className="text-slate-400">Resolved Value:</span>
          {innerScalarValue !== undefined ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 font-bold text-emerald-200 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {String(innerScalarValue)}
            </span>
          ) : innerValues !== undefined ? (
            <div className="flex flex-wrap gap-1">
              {innerValues.map((v, i) => (
                <span key={i} className="rounded bg-slate-800 px-2 py-0.5 font-bold text-slate-200">
                  {String(v)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic">Evaluated per outer row</span>
          )}
        </div>
      </motion.div>

      {/* Downward Transition */}
      <div className="flex justify-center -my-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-slate-400">
          <ArrowDown className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Step 2: Outer Row Evaluation */}
      <div className="rounded-xl border border-slate-800 bg-[#0A0F1A] p-4">
        <div className="flex items-center justify-between mb-3 text-[11px]">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Filter className="h-4 w-4 text-sky-400" />
            <span>Step 2: Outer Table Row-by-Row Matching</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-emerald-400">
              {outerRows.filter((r) => r.matched).length} Matched
            </span>
            <span className="text-slate-600">
              {outerRows.filter((r) => !r.matched).length} Excluded
            </span>
          </div>
        </div>

        {/* Rows List */}
        <div className="divide-y divide-slate-800/70 border border-slate-800 rounded-lg overflow-hidden">
          {outerRows.map((row) => (
            <div
              key={row.rid}
              className={`flex items-center justify-between gap-3 px-3 py-2 transition ${
                row.matched
                  ? 'bg-emerald-500/10 text-emerald-100'
                  : 'bg-slate-900/30 text-slate-500 opacity-40'
              }`}
            >
              <div className="flex items-center gap-2">
                {row.matched ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-slate-600" />
                )}
                <span className="font-semibold text-white">
                  {String(row.data.name ?? row.data.id)}
                </span>
                {row.outerVal !== undefined && (
                  <span className="text-[10px] text-slate-400">
                    ({subquery.outerColumn}: {String(row.outerVal)})
                  </span>
                )}
              </div>

              <div>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                    row.matched
                      ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                      : 'border border-slate-800 bg-slate-900 text-slate-600'
                  }`}
                >
                  {row.matched ? 'KEPT' : 'FILTERED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
