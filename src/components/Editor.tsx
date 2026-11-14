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
    <section className="neu-card flex flex-col overflow-hidden rounded-2xl">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.04] bg-[#0c1320] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Terminal className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              SQL Query Editor
            </span>
          </div>
          <span
            className={`neu-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
              isDbReady
                ? 'border-emerald-500/30 text-emerald-300'
                : 'border-amber-500/30 text-amber-300'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isDbReady ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'animate-pulse bg-amber-400'
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
              className="neu-btn inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Reset Code
            </button>
          )}

          <button
            type="button"
            onClick={onResetDb}
            title="Restore initial seed tables in sql.js"
            className="neu-btn inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
            Reset DB
          </button>

          <button
            type="button"
            onClick={onReplayViz}
            disabled={!isDbReady}
            title="Replay step-by-step query visualization"
            className="neu-btn inline-flex items-center gap-1.5 rounded-xl border border-violet-500/20 px-3 py-1.5 text-xs font-semibold text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5 text-violet-300" />
            Visualize
          </button>

          <button
            type="button"
            onClick={() => onRun()}
            disabled={!isDbReady}
            className="neu-btn-primary inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Run Query
            <kbd className="ml-1 hidden rounded bg-slate-950/30 px-1 py-0.5 font-mono text-[10px] font-bold sm:inline">
              Ctrl+↵
            </kbd>
          </button>
        </div>
      </div>

      {/* CodeMirror Surface */}
      <div
        className="neu-inset relative m-2.5 rounded-xl p-1 text-sm"
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
          className="text-[13px] [&_.cm-editor]:!bg-transparent [&_.cm-gutters]:!border-white/[0.04] [&_.cm-gutters]:!bg-transparent [&_.cm-scroller]:font-mono"
        />
      </div>
    </section>
  );
}
