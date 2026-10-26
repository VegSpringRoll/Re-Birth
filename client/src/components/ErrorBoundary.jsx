import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('rebirth_active_provider');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#060814] text-slate-100 p-6 select-text">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-xl text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
              <AlertCircle className="w-8 h-8" />
            </div>

            <h2 className="text-lg font-bold font-display uppercase tracking-wider text-slate-100">
              Roleplay State Recovered
            </h2>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              A temporary render interruption was caught. Your roleplay chronicles, saved personas, and messages remain safe in MongoDB and local storage.
            </p>

            {this.state.error && (
              <pre className="p-3 rounded-xl bg-black/60 border border-white/10 text-[10px] font-mono text-rose-300 overflow-x-auto text-left max-h-28">
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Chronicle</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetState}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white font-mono text-xs transition-colors"
                title="Reset temporary session state"
              >
                Reset State
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
