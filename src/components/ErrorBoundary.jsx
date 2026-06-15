import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen gap-4 bg-canvas text-brand-text">
          <div className="w-14 h-14 rounded-full bg-brand-danger/10 flex items-center justify-center">
            <i className="fa-solid fa-triangle-exclamation text-xl text-brand-danger" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold">Something went wrong</p>
            <p className="text-sm text-brand-muted mt-1">Refresh the page or contact support if the issue persists.</p>
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            className="px-4 py-2 bg-emerald text-white text-sm font-semibold rounded-lg hover:bg-emerald-hover transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
