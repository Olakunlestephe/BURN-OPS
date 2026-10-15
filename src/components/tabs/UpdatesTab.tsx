import React, { useState } from 'react';
import { useBurnOps } from '../../context/BurnOpsContext';
import { Newspaper, Send, TrendingUp, AlertTriangle } from 'lucide-react';

export const UpdatesTab: React.FC = () => {
  const { state, currentUser, postUpdate } = useBurnOps();

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'Progress' | 'Challenge'>('Progress');
  const [body, setBody] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = postUpdate(title, kind, body);
    if (success) {
      setTitle('');
      setBody('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="border-b border-stone-200 dark:border-stone-800 pb-3">
        <h1 className="text-2xl font-bold font-heading text-stone-900 dark:text-stone-100 tracking-tight">
          Field Operations Updates &amp; Bulletin
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Share operational milestones, delivery progress, and escalate logistical challenges across depots
        </p>
      </div>

      {/* Post Update Form (available to all non-read-only users) */}
      {currentUser.r !== 'smt' && (
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#E8590C]" />
            <h3 className="font-bold font-heading text-base text-stone-900 dark:text-stone-100">
              Broadcast Operational Update
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Update Category
                </label>
                <select
                  value={kind}
                  onChange={(e) => setKind(e.target.value as 'Progress' | 'Challenge')}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Progress">Progress (Positive Milestone)</option>
                  <option value="Challenge">Challenge (Escalation / Issue)</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Headline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mombasa Port container cleared for transport"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                Operational Details
              </label>
              <textarea
                rows={3}
                placeholder="Describe current status, timeline, impacts on warehouse stocking or regional dispatch..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-stone-50 dark:bg-stone-950 border border-stone-300 dark:border-stone-700 rounded-xl p-3 text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={!title.trim()}
              className="py-2.5 px-5 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Update</span>
            </button>
          </form>
        </div>
      )}

      {/* Feed of updates */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
          Recent Operational Dispatches ({state.news.length})
        </h3>

        {state.news.length === 0 ? (
          <p className="text-xs text-stone-400 italic py-4">No field updates published yet.</p>
        ) : (
          state.news.map((n) => (
            <div
              key={n.id || n.t}
              className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 space-y-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    n.k === 'Challenge'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {n.k}
                </span>

                <span className="text-xs text-stone-400">
                  {new Date(n.at).toLocaleDateString()} at{' '}
                  {new Date(n.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <h4 className="text-base font-bold font-heading text-stone-900 dark:text-stone-100">
                {n.t}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-line">
                {n.b}
              </p>

              <div className="pt-2 text-[11px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
                Posted by <strong className="text-stone-600 dark:text-stone-300">{n.by}</strong>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
