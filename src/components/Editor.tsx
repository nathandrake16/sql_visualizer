'use client';

import React, { useMemo } from 'react';
import CodeMirror, { Prec, keymap } from '@uiw/react-codemirror';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import {
  Play,
  RotateCcw,
  Sparkles,
  Terminal,
  RefreshCw,
} from 'lucide-react';
import { SCHEMA_METADATA } from '@/data/seed';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: (overrideSql?: string) => void;
  onReplayViz: () => void;
  onResetStarter: () => void;
  onResetDb: () => void;
  isDbReady: boolean;
  hasStarter: boolean;
}

export function Editor({
  value,
  onChange,
  onRun,
  onReplayViz,
  onResetStarter,
  onResetDb,
  isDbReady,
  hasStarter,
}: EditorProps) {
  const extensions = useMemo(() => {
    const schemaObj: Record<string, string[]> = {};
    for (const table of SCHEMA_METADATA) {
      schemaObj[table.name] = table.columns.map((c) => c.name);
    }

    const suppressModEnterNewline = Prec.highest(
      keymap.of([
        {
          key: 'Mod-Enter',
          run: () => true,
        },
      ])
    );

    return [
      sql({
        dialect: SQLite,
        upperCaseKeywords: true,
        schema: schemaObj,
      }),
      suppressModEnterNewline,
    ];
  }, []);

  const handleKeyDownCapture = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isDbReady) {
        onRun();
      }
    }
  };

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-slate-800/90 bg-[#0E1420] shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 bg-[#0B101B] px-3.5 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              SQL Query Editor
            </span>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${
              isDbReady
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDbReady ? 'bg-emerald-400' : 'animate-pulse bg-amber-400'
              }`}
            />
            {isDbReady ? 'SQLite WASM Ready' : 'Loading SQLite...'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasStarter && (
            <button
              type="button"
              onClick={onResetStarter}
              title="Reset editor to starter query"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Reset Code
            </button>
          )}

          <button
            type="button"
            onClick={onResetDb}
            title="Restore initial seed tables in sql.js"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Reset DB
          </button>

          <button
            type="button"
            onClick={onReplayViz}
            disabled={!isDbReady}
            title="Replay step-by-step query visualization"
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Visualize
          </button>

          <button
            type="button"
            onClick={() => onRun()}
            disabled={!isDbReady}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.28)] transition hover:bg-sky-400 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Run Query
            <kbd className="ml-1 hidden rounded bg-slate-950/20 px-1 py-0.5 font-mono text-[10px] font-bold sm:inline">
              Ctrl+↵
            </kbd>
          </button>
        </div>
      </div>

      {/* CodeMirror Surface */}
      <div
        className="relative bg-[#0A0F1A] text-sm"
        onKeyDownCapture={handleKeyDownCapture}
      >
        <CodeMirror
          value={value}
          height="168px"
          theme={oneDark}
          extensions={extensions}
          onChange={(val) => onChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: false,
            autocompletion: true,
            closeBrackets: true,
          }}
          className="text-[13px] [&_.cm-editor]:!bg-[#0A0F1A] [&_.cm-gutters]:!border-slate-800/80 [&_.cm-gutters]:!bg-[#0A0F1A] [&_.cm-scroller]:font-mono"
        />
      </div>
    </section>
  );
}
