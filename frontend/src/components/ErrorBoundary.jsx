import { Component } from "react";

export class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#08080a] px-6 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#e50914]">Signal lost</p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Something glitched in the void.</h1>
        <button
          type="button"
          data-testid="error-reload"
          onClick={() => window.location.reload()}
          className="rounded-md bg-[#e50914] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#f5111c]"
        >
          Reload Scarcine
        </button>
      </div>
    );
  }
}
