'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    return { hasError: true, message };
  }

  override componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    // Log for debugging — replace with Sentry/Datadog if added later
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <main className="flex flex-col items-center justify-center min-h-dvh px-6 text-center gap-4">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-xl font-bold text-ink">Quelque chose s&apos;est mal passé</h1>
          <p className="text-sm text-muted max-w-xs">{this.state.message}</p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, message: '' });
              window.location.reload();
            }}
            className="mt-2 px-6 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent-dark transition-all"
          >
            Recharger la page
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
