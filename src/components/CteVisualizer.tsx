'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit,
  ArrowRight,
  TableProperties,
  Sparkles,
  Layers,
} from 'lucide-react';
import { VizCteSnapshot } from '@/lib/buildVizPlan';
import { SqlValue } from '@/types/sql';

interface CteVisualizerProps {
  snapshot: VizCteSnapshot;
}

export function CteVisualizer({ snapshot }: CteVisualizerProps) {
  const [selectedNodeIdx, setSelectedNodeIdx] = useState<number>(0);
  const activeNode = snapshot.nodes[selectedNodeIdx] || snapshot.nodes[0];

  return (
    <div className="flex flex-col gap-4 font-mono text-xs">
      {/* CTE Pipeline Flowchart Header */}
      <div className="neu-panel rounded-xl p-3.5">
        <div className="mb-2.5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Layers className="h-4 w-4 text-violet-400" />
            <span>Common Table Expression (CTE) Pipeline</span>
          </div>
          <span className="text-slate-400">Click a node to inspect virtual table</span>
        </div>

        {/* DAG Nodes Flow */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          {snapshot.nodes.map((node, idx) => {
            const isSelected = idx === selectedNodeIdx;
            return (
              <React.Fragment key={node.name}>
                <button
                  type="button"
                  onClick={() => setSelectedNodeIdx(idx)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left transition ${
                    isSelected
                      ? 'neu-btn-active border-violet-500 text-white shadow-[0_0_15px_rgba(167,139,250,0.25)]'
                      : 'neu-btn text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <GitCommit className={`h-4 w-4 ${isSelected ? 'text-violet-300' : 'text-slate-500'}`} />
                  <div>
                    <div className="font-bold text-[11px] text-slate-100">{node.name}</div>
                    <div className="text-[10px] opacity-75">{node.rowCount} row(s)</div>
                  </div>
                </button>

                {idx < snapshot.nodes.length - 1 && (
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />
                )}
              </React.Fragment>
            );
          })}

          <ArrowRight className="h-4 w-4 shrink-0 text-slate-600" />

          {/* Final Query Output Pill */}
          <div className="neu-raised-sm flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-emerald-200">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <div>
              <div className="font-bold text-[11px]">Main Query</div>
              <div className="text-[10px] text-emerald-300/80">Final Output</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected CTE Virtual Table Inspector */}
      {activeNode && (
        <motion.div
          key={activeNode.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="neu-card overflow-hidden rounded-xl"
        >
          {/* Virtual Table Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] bg-[#0c1320] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <TableProperties className="h-4 w-4 text-violet-400" />
              <span className="font-semibold text-xs text-white">
                Virtual Table: <span className="text-violet-300">{activeNode.name}</span>
              </span>
              <span className="neu-badge rounded px-2 py-0.5 text-[10px] text-slate-400">
                {activeNode.rowCount} row(s)
              </span>
            </div>

            {activeNode.upstreamCtes.length > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>Reads from:</span>
                {activeNode.upstreamCtes.map((up) => (
                  <span key={up} className="neu-badge rounded px-1.5 py-0.5 font-bold text-violet-300">
                    {up}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* SQL Snippet Definition */}
          <div className="neu-inset m-2.5 rounded-lg p-3 text-[11px] text-slate-300">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              CTE Definition:
            </div>
            <pre className="overflow-x-auto text-sky-200/90 whitespace-pre-wrap">
              {activeNode.querySql}
            </pre>
          </div>

          {/* Virtual Table Data Grid */}
          <div className="neu-inset m-2.5 max-h-60 overflow-auto rounded-xl p-1">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="sticky top-0 bg-[#0c1320] border-b border-white/[0.05] text-slate-400 text-[11px]">
                <tr>
                  <th className="w-10 px-3 py-2 text-center text-slate-500 font-normal">#</th>
                  {activeNode.columns.map((c) => (
                    <th key={c} className="px-3 py-2 font-semibold text-slate-300">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {activeNode.rows.length === 0 ? (
                  <tr>
                    <td colSpan={activeNode.columns.length + 1} className="p-4 text-center text-slate-500">
                      CTE produced 0 rows.
                    </td>
                  </tr>
                ) : (
                  activeNode.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="neu-table-row transition-colors">
                      <td className="px-3 py-2 text-center text-slate-500 text-[10px]">{rIdx + 1}</td>
                      {row.map((val, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-200">
                          {formatCell(val)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function formatCell(val: SqlValue): React.ReactNode {
  if (val === null || val === undefined) {
    return (
      <span className="rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[9px] italic text-slate-400">
        NULL
      </span>
    );
  }
  return String(val);
}
