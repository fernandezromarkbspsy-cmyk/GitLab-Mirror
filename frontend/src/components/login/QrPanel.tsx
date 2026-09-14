import { MapPin } from "lucide-react";
import { Reveal } from "./Reveal";
import { SeatalkQrLogin } from "./SeatalkQrLogin";
import trucksImage from "../../assets/trucks.jpg";

interface QrPanelProps {
  onSeatalkError?: (error: string) => void;
  enabled?: boolean;
}

export function QrPanel({ onSeatalkError, enabled = true }: QrPanelProps) {
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
          Scan QR code with Seatalk or use email/password below
        </p>
      </Reveal>

      {/* QR - Seatalk Login */}
      <Reveal delay={180} className="mt-5 flex flex-col items-center">
        <SeatalkQrLogin
          onError={onSeatalkError || (() => {})}
          enabled={enabled}
        />
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
