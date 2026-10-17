/**
 * Nothing in this app is worth a blank screen. If a screen throws, show what
 * happened and keep the two things that matter reachable: going back, and
 * getting help.
 *
 * Help is never behind JavaScript that might also be broken, so the links here
 * are plain anchors rather than router links.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Console only: nothing a user typed is ever sent anywhere, errors included.
    console.error('Screen failed to render', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main id="main" className="edge flex min-h-screen flex-col justify-center py-24">
        <p className="text-[0.7rem] uppercase tracking-[0.22em] text-ink-mute">
          Something broke on this screen
        </p>

        <h1 className="display mt-4" style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)' }}>
          This part stopped working
        </h1>

        <p className="mt-5 max-w-xl text-[1.02rem] leading-[1.55] text-ink-soft">
          Nothing you typed was sent anywhere, and nothing was saved. If you were in the
          middle of checking a message, trust your own judgement: do not reply, do not pay,
          and verify through an official channel yourself.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <a className="pill pill-dark" href="/">
            Back to home
          </a>
          <a className="pill pill-light" href="/help">
            Get help now
          </a>
          <a className="pill pill-light" href="tel:1930">
            Call 1930
          </a>
        </div>

        <details className="mt-10 max-w-2xl">
          <summary className="cursor-pointer text-sm text-ink-mute">Technical detail</summary>
          <pre className="mt-3 overflow-auto rounded-2xl bg-white/70 p-4 font-mono text-xs leading-[1.6]">
            {error.message}
          </pre>
        </details>
      </main>
    );
  }
}
