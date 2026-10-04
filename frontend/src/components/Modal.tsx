import { type ReactNode, useEffect, useRef } from "react";
import { cn } from "../lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  role?: "dialog";
};

function getFocusable(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"),
  );
}

export function Modal({
  open,
  onClose,
  children,
  className = "",
  ariaLabelledBy,
  ariaLabel,
  role: _role,
}: Props) {
  const panelRef = useRef<HTMLElement>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastActiveRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusPanel = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusable(panel);
      (focusable[0] ?? panel).focus();
    }, 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = getFocusable(panel);
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusPanel);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      lastActiveRef.current?.focus?.();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 grid place-items-center bg-[rgb(11_24_25_/_43%)] p-[clamp(16px,4vw,40px)] backdrop-blur-[7px] animate-[dialog-backdrop-in_.2s_ease-out_both] motion-reduce:animate-none max-[640px]:items-end max-[640px]:p-3 max-[480px]:p-2.5"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      tabIndex={-1}
    >
      <section
        ref={panelRef}
        className={cn(
          "max-h-[min(760px,calc(100dvh-32px))] w-[min(1100px,100%)] overflow-hidden rounded-[20px] border border-[rgb(25_45_47_/_10%)] bg-white shadow-[0_28px_70px_rgb(10_30_31_/_0.2),0_5px_18px_rgb(10_30_31_/_0.08)] outline-none animate-[dialog-panel-in_.34s_cubic-bezier(.22,1,.36,1)_both] motion-reduce:animate-none max-[640px]:max-h-[calc(100dvh-24px)] max-[640px]:rounded-2xl",
          className,
        )}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}
