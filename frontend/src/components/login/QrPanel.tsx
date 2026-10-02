import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import trucksImage from "../../assets/trucks.jpg";
import { createSingleFlight } from "../../lib/singleFlight";
import { Reveal } from "./Reveal";

declare global {
  interface Window {
    SEATALK_LOGIN?: { init: () => void };
  }
}

let seaTalkSdkPromise: Promise<void> | null = null;

interface QrPanelProps {
  enabled?: boolean;
}

export function QrPanel({ enabled: _enabled = true }: QrPanelProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const sdkContainerRef = useRef<HTMLDivElement>(null);
  const renderLoginOnce = useRef<(() => Promise<void>) | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  function renderSeaTalkLogin() {
    if (!renderLoginOnce.current) {
      renderLoginOnce.current = createSingleFlight(renderSeaTalkLoginImpl);
    }

    return renderLoginOnce.current();
  }

  async function renderSeaTalkLoginImpl() {
    const container = sdkContainerRef.current;
    if (!container) return;
    setStatus("loading");
    setError("");
    container.replaceChildren();

    try {
      const response = await fetch("/api/v1/auth/seatalk/config", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      const config = (await response.json()) as {
        app_id?: string;
        redirect_uri?: string;
        response_type?: string;
        state?: string;
        sdk_url?: string;
        message?: string;
      };
      if (!response.ok || !config.app_id || !config.state) {
        throw new Error(config.message || "SeaTalk login is not configured.");
      }
      const appInfo = document.createElement("div");
      appInfo.id = "seatalk_login_app_info";
      appInfo.dataset.redirect_uri = config.redirect_uri || "";
      appInfo.dataset.appid = config.app_id;
      appInfo.dataset.response_type = config.response_type || "code";
      appInfo.dataset.state = config.state;

      const loginButton = document.createElement("div");
      loginButton.id = "seatalk_login_button";
      loginButton.dataset.size = "large";
      loginButton.dataset.logo_size = "22";
      loginButton.dataset.copywriting = "Continue with SeaTalk";
      loginButton.dataset.theme = "light";
      loginButton.dataset.align = "center";
      container.append(appInfo, loginButton);

      await loadSeaTalkSdk(config.sdk_url);
      window.SEATALK_LOGIN?.init();
      if (!loginButton.childElementCount) {
        throw new Error("Unable to initialize the SeaTalk login button.");
      }
      setStatus("ready");
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Unable to load SeaTalk login.");
      throw cause;
    }
  }

  useEffect(() => {
    if (_enabled) void renderSeaTalkLogin().catch(() => undefined);
  }, [_enabled]);

  return (
    <section className="relative hidden lg:flex flex-col overflow-hidden px-5 pb-24 pt-6 sm:px-7">
      <div
        aria-hidden
        className="dot-grid absolute right-2 top-28 h-48 w-36 opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]"
      />
      <div
        aria-hidden
        className="absolute -left-20 top-1/3 h-52 w-52 rounded-full bg-accent/15 blur-3xl"
      />

      {/* brand */}
      <Reveal>
        <div className="flex items-center gap-2.5">
          <img
            src="/dashboard-icon/icon_logo.png"
            alt="SOC 5"
            className="h-[52px] w-[52px] shrink-0 rounded-xl object-cover shadow-lg shadow-accent/30"
          />
          <div>
            <p className="font-display text-[17px] font-bold tracking-tight leading-snug text-ink">
              SOC 5 OUTBOUND
            </p>
            <p className="text-[11.5px] font-medium text-faint leading-snug">
              Operations Management System
            </p>
          </div>
        </div>
      </Reveal>

      {/* heading */}
      <Reveal delay={90} className="mt-5">
        <h1 className="font-display text-[22px] font-bold leading-tight tracking-tight text-ink">
          Login to continue
        </h1>
        <p className="mt-2 text-[12.5px] text-muted leading-relaxed">
          Use your work email or Ops ID to sign in below.
        </p>
      </Reveal>

      <Reveal delay={180} className="mt-6">
        <div className="rounded-2xl border border-line bg-white/[0.03] p-4 text-center">
          <div ref={widgetRef} className="mx-auto flex min-h-[176px] items-center justify-center rounded-xl bg-white p-3" aria-label="SeaTalk login">
            <div ref={sdkContainerRef} />
            {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-accent" />}
          </div>
          {status === "error" && (
            <div className="mt-3 text-[12px] leading-relaxed text-danger">
              <p>{error}</p>
              <button type="button" onClick={() => void renderSeaTalkLogin().catch(() => undefined)} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-link hover:underline">
                <RefreshCw className="h-3.5 w-3.5" /> Retry SeaTalk login
              </button>
            </div>
          )}
          {status !== "error" && <p className="mt-3 text-[12px] leading-relaxed text-muted">Continue with SeaTalk to sign in.</p>}
        </div>
      </Reveal>

      {/* freight scene */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
      >
        <img
          src={trucksImage}
          alt=""
          className="h-full w-full object-cover object-bottom [mask-image:linear-gradient(to_top,black_45%,transparent)]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-2/60 via-transparent to-transparent" />
        <div className="absolute bottom-[42%] left-[27%]">
          <span className="ping-soft absolute inset-0 rounded-full bg-accent/50" />
          <span className="floaty relative grid h-7 w-7 place-items-center rounded-full bg-accent shadow-lg shadow-accent/50 ring-4 ring-accent/25">
            <MapPin className="h-3.5 w-3.5 text-white" fill="currentColor" />
          </span>
        </div>
      </div>
    </section>
  );
}

function loadSeaTalkSdk(url?: string): Promise<void> {
  if (window.SEATALK_LOGIN) return Promise.resolve();
  if (!url) return Promise.reject(new Error("SeaTalk SDK URL is not configured."));
  if (seaTalkSdkPromise) return seaTalkSdkPromise;

  seaTalkSdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.async = true;
    script.dataset.seatalkSdk = "true";
    script.onload = () => {
      if (!window.SEATALK_LOGIN) {
        script.remove();
        seaTalkSdkPromise = null;
        reject(new Error("The SeaTalk login SDK did not initialize."));
        return;
      }
      resolve();
    };
    script.onerror = () => {
      script.remove();
      seaTalkSdkPromise = null;
      reject(new Error("Unable to load the SeaTalk login widget."));
    };
    document.head.appendChild(script);
  });
  return seaTalkSdkPromise;
}
