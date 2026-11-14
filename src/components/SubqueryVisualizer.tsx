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
        className="neu-card rounded-2xl p-4 sm:p-5"
      >
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-amber-400" />
            <span className="font-bold text-xs text-white">Step 1: Inner Subquery Evaluation</span>
          </div>
          <span className="neu-badge rounded-lg px-2.5 py-1 text-[10px] font-bold text-amber-300">
            {subquery.isCorrelated ? 'Correlated Loop' : 'Uncorrelated (Evaluates Once)'}
          </span>
        </div>

        <div className="neu-inset rounded-xl p-3 text-[11px] text-amber-200/90">
          <pre className="overflow-x-auto whitespace-pre-wrap">{subquery.subquerySql}</pre>
        </div>

        {/* Resolved Inner Result */}
        <div className="mt-3.5 flex items-center gap-2">
          <span className="text-slate-400">Resolved Value:</span>
          {innerScalarValue !== undefined ? (
            <span className="neu-raised-sm inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-bold text-emerald-200 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {String(innerScalarValue)}
            </span>
          ) : innerValues !== undefined ? (
            <div className="flex flex-wrap gap-1.5">
              {innerValues.map((v, i) => (
                <span key={i} className="neu-badge rounded-lg px-2.5 py-0.5 font-bold text-slate-200">
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
        <div className="neu-raised-sm flex h-7 w-7 items-center justify-center rounded-full text-slate-400">
          <ArrowDown className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Step 2: Outer Row Evaluation */}
      <div className="neu-panel rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 text-[11px]">
          <div className="flex items-center gap-2 font-bold text-slate-200">
            <Filter className="h-4 w-4 text-sky-400" />
            <span>Step 2: Outer Table Row-by-Row Matching</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span className="text-emerald-400 font-semibold">
              {outerRows.filter((r) => r.matched).length} Matched
            </span>
            <span className="text-slate-500">
              {outerRows.filter((r) => !r.matched).length} Excluded
            </span>
          </div>
        </div>

        {/* Rows List */}
        <div className="neu-inset rounded-xl overflow-hidden divide-y divide-white/[0.04]">
          {outerRows.map((row) => (
            <div
              key={row.rid}
              className={`flex items-center justify-between gap-3 px-3.5 py-2.5 transition ${
                row.matched
                  ? 'bg-emerald-500/10 text-emerald-100'
                  : 'bg-transparent text-slate-500 opacity-40'
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
                  className={`rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                    row.matched
                      ? 'neu-raised-sm border border-emerald-500/40 text-emerald-300'
                      : 'neu-badge text-slate-600'
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
