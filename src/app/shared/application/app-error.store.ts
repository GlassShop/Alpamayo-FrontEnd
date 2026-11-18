import {Injectable, signal} from '@angular/core';

const RELOAD_KEY = 'alpamayo.chunk-reload-at';
const RELOAD_WINDOW_MS = 15_000;

/** Messages of a lazy-loaded piece of the app that could not be downloaded, per browser. */
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Outdated Optimize Dep|ChunkLoadError|Loading chunk .* failed/i;

/**
 * Keeps the app from ending on a blank screen when a page cannot be opened.
 *
 * @remarks
 * - If a page's code cannot be downloaded (typically a stale tab after the dev
 *   server restarted or dependencies changed), the page is reloaded once.
 * - Any other navigation error, or a repeated download failure, is shown to
 *   the user with the technical detail and a reload button.
 */
@Injectable({providedIn: 'root'})
export class AppErrorStore {
  private readonly errorSignal = signal<string | null>(null);
  readonly error = this.errorSignal.asReadonly();

  handleNavigationError(error: unknown): void {
    const message = describe(error);
    console.error('[navigation] Could not open the page:', error);
    if (CHUNK_ERROR.test(message) && this.reloadOnce()) return;
    this.errorSignal.set(message);
  }

  dismiss(): void { this.errorSignal.set(null); }

  reload(): void { globalThis.location?.reload(); }

  /** Reloads unless a reload already happened moments ago (avoids loops). */
  private reloadOnce(): boolean {
    try {
      const last = Number(globalThis.sessionStorage?.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last < RELOAD_WINDOW_MS) return false;
      globalThis.sessionStorage?.setItem(RELOAD_KEY, String(Date.now()));
    } catch {
      return false;
    }
    this.reload();
    return true;
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'error' in error) return describe((error as {error: unknown}).error);
  return String(error);
}
