import { ReactNode } from 'react';
import { AmbientGlows } from './AmbientGlows';
import { QrPanel } from './QrPanel';
import { FooterBar } from './FooterBar';
import { Reveal } from './Reveal';

interface LoginCardProps {
  children: ReactNode;
  modal?: boolean;
  visible?: boolean;
}

export function LoginCard({ 
  children, 
  modal = false, 
  visible = true,
}: LoginCardProps) {
  if (modal) {
    return (
      <div className={`login-modal-layer${visible ? ' is-visible' : ''}`} aria-hidden={!visible}>
        <main
          className="login-modal-card"
          role="dialog"
          aria-modal="true"
          aria-label="Sign in to SOC 5 Outbound"
        >
          <div className="relative grid lg:grid-cols-[1fr_1fr]">
            <QrPanel enabled={visible} />
            <div aria-hidden className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-line lg:block" />
            <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-[10.5px] font-bold tracking-widest text-muted backdrop-blur-md">OR</span>
            </div>
            <div className="flex items-center gap-3 px-5 lg:hidden">
              <span className="h-px flex-1 bg-line" /><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-[10.5px] font-bold tracking-widest text-muted">OR</span><span className="h-px flex-1 bg-line" />
            </div>
            <section className="flex items-center justify-center px-5 py-7 sm:px-7"><Reveal delay={140} className="w-full max-w-[330px]">{children}</Reveal></section>
          </div>
          <FooterBar />
        </main>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-page via-page to-page-2 px-4 py-6">
      <AmbientGlows />

      <main className="relative w-full max-w-[860px] overflow-hidden rounded-2xl border border-white/20 bg-white/[0.08] shadow-[0_30px_70px_-28px_rgba(14,24,54,0.65)] backdrop-blur-2xl">
        <div className="relative grid lg:grid-cols-[1fr_1fr]">
          {/* Left panel - QR Panel */}
          <QrPanel />

          {/* Vertical divider */}
          <div
            aria-hidden
            className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-line lg:block"
          />
          <div className="absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <span className="grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-[10.5px] font-bold tracking-widest text-muted backdrop-blur-md">
              OR
            </span>
          </div>

          {/* Mobile divider */}
          <div className="flex items-center gap-3 px-5 lg:hidden">
            <span className="h-px flex-1 bg-line" />
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/25 bg-white/10 font-display text-[10.5px] font-bold tracking-widest text-muted">
              OR
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          {/* Right panel - Form */}
          <section className="flex items-center justify-center px-5 py-7 sm:px-7">
            <Reveal delay={140} className="w-full max-w-[330px]">
              {children}
            </Reveal>
          </section>
        </div>

        {/* Footer bar */}
        <FooterBar />
      </main>
    </div>
  );
}
