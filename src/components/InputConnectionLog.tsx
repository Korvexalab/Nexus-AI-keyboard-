import React from 'react';
import { ImeEventLog } from '../types';
import { Terminal, Trash2, Shield } from 'lucide-react';

interface InputConnectionLogProps {
  logs: ImeEventLog[];
  onClear: () => void;
}

export const InputConnectionLog: React.FC<InputConnectionLogProps> = ({ logs, onClear }) => {
  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase">
            Android InputConnection Live Trace
          </h3>
          <span className="px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 text-[10px] font-mono border border-blue-700/40">
            {logs.length} calls
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 text-xs flex items-center gap-1"
            title="Clear Log"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="text-[11px]">Clear</span>
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400">
        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          Real Android keyboards never modify Activities directly; they dispatch via <code className="text-emerald-400 font-mono">android.view.inputmethod.InputConnection</code>.
        </span>
      </div>

      {/* Log Entries */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs flex flex-col gap-1.5 divide-y divide-slate-800/40">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-600">
            <Terminal className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">No InputConnection calls recorded yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Tap any key on the simulated keyboard to observe live Android method dispatches.
            </p>
          </div>
        ) : (
          logs.map((item) => {
            const badgeColor =
              item.tag === 'commit'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/50'
                : item.tag === 'delete'
                ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                : item.tag === 'action'
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/50'
                : item.tag === 'state'
                ? 'bg-purple-950/60 text-purple-300 border-purple-800/50'
                : 'bg-blue-950/60 text-blue-300 border-blue-800/50';

            return (
              <div key={item.id} className="pt-1.5 first:pt-0 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                    {item.method}
                  </span>
                  <span className="text-slate-300 text-[11px] break-all leading-tight">
                    {item.detail}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">
                  {item.timestamp}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
