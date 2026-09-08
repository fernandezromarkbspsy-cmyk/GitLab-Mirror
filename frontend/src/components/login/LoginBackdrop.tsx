export function LoginBackdrop() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-page via-page to-page-2 px-4 py-6">
      <div
        aria-hidden
        className="drift absolute -top-32 left-[12%] h-[360px] w-[360px] rounded-full bg-accent/25 blur-[100px]"
      />
      <div
        aria-hidden
        className="drift-slow absolute -bottom-36 right-[8%] h-[380px] w-[380px] rounded-full bg-[#82a9ff]/20 blur-[110px]"
      />
      <div className="relative w-full max-w-[860px] overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] shadow-[0_30px_70px_-28px_rgba(14,24,54,0.65)] backdrop-blur-2xl">
        <div className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-accent font-display text-2xl font-bold shadow-lg shadow-accent/20">
              S5
            </div>
            <p className="mt-4 text-muted">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
