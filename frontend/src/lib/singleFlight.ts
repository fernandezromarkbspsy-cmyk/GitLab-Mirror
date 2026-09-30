export function createSingleFlight<T>(run: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;

  return () => {
    if (pending) return pending;

    const attempt = run();
    const tracked = attempt.finally(() => {
      if (pending === tracked) pending = null;
    });
    pending = tracked;
    return tracked;
  };
}
