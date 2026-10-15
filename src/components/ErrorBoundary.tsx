import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Flame, RefreshCw, RotateCcw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Burn Ops ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetDataAndReload = () => {
    try {
      localStorage.removeItem('burn_ops_v2');
      sessionStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    window.location.href = window.location.pathname;
  };

  private handleQuickReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      const stored = localStorage.getItem('burn_ops_v2');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.tab = 'home';
        parsed.td = null;
        localStorage.setItem('burn_ops_v2', JSON.stringify(parsed));
      }
    } catch {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 p-6 sm:p-8 space-y-6 animate-in fade-in duration-200">
            {/* Header / Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E8590C] text-white flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <Flame className="w-7 h-7 fill-white text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold font-heading text-stone-900 dark:text-stone-100">
                    BURN Ops
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    System Recovery
                  </span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Cookstoves &amp; Supply Chain Management
                </p>
              </div>
            </div>

            {/* Error Notice */}
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{this.props.fallbackTitle || 'The application encountered an unexpected state'}</span>
              </div>
              <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                A display or data synchronization issue occurred. You can restore the fresh operational state or reload immediately below.
              </p>
              {this.state.error?.message && (
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700 dark:text-amber-400 block mb-1">
                    Error Diagnostic:
                  </span>
                  <pre className="text-[11px] font-mono bg-black/5 dark:bg-black/30 p-2.5 rounded-xl overflow-x-auto text-amber-950 dark:text-amber-200 max-h-32">
                    {this.state.error.message}
                  </pre>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleResetDataAndReload}
                className="w-full py-3 px-4 rounded-xl bg-[#E8590C] hover:bg-[#d44e08] text-white font-bold text-xs tracking-wide shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Clean Operational State &amp; Refresh</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={this.handleGoHome}
                  className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs border border-stone-200 dark:border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Return to Home</span>
                </button>

                <button
                  type="button"
                  onClick={this.handleQuickReload}
                  className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 font-semibold text-xs border border-stone-200 dark:border-stone-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Quick Reload</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-center text-stone-400">
              Burn Manufacturing Supply Chain Engine &bull; Version 2.2
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
