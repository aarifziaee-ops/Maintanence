import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
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
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-red-50 text-slate-800">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong.</h1>
            <details className="whitespace-pre-wrap font-mono text-xs bg-slate-100 p-4 rounded-lg overflow-auto border border-slate-200">
              <summary className="font-bold cursor-pointer text-slate-700 select-none pb-2">View Error Details</summary>
              <div className="text-red-500 font-bold mt-2">{this.state.error && this.state.error.toString()}</div>
              <div className="mt-2 text-slate-600">{this.state.errorInfo?.componentStack}</div>
            </details>
            <button 
              className="mt-6 px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition"
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
            >
              Clear Data & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
