import { Component } from 'react';
import { Button } from '@/components/ui/button';

/** Keeps one broken page from blanking the whole app. */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="container py-20 text-center">
        <h1 className="text-2xl font-extrabold">Something went wrong on this page</h1>
        <p className="mt-2 text-muted-foreground">Reload to try again. If it keeps happening, go back to the job list.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={() => window.location.reload()}>Reload</Button>
          <Button variant="outline" onClick={() => window.location.assign('/jobs')}>
            Job list
          </Button>
        </div>
      </div>
    );
  }
}
