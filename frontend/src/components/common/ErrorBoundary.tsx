import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Application rendering failed.", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-slate-950">
          <section className="max-w-lg rounded-2xl bg-white p-8 shadow dark:bg-slate-900">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              This page could not be displayed
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Try reloading the application. Your saved tasks are not affected.
            </p>
            <button
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}
