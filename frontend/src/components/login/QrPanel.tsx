import { Camera, MapPin } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Reveal } from "./Reveal";
import trucksImage from "../../assets/trucks.jpg";

export function QrPanel() {
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
            <p className="font-display text-[17px] font-semibold tracking-wide text-ink">
              SOC 5 OUTBOUND
            </p>
            <p className="text-[11.5px] text-faint">
              Operations Management System
            </p>
          </div>
        </div>
      </Reveal>

      {/* heading */}
      <Reveal delay={90} className="mt-5">
        <h1 className="font-display text-[22px] font-semibold leading-tight text-ink">
          Login to continue
        </h1>
        <p className="mt-1.5 text-[12.5px] text-muted">
          Scan QR code or use your credentials to login
        </p>
      </Reveal>

      {/* QR */}
      <Reveal delay={180} className="mt-5 flex flex-col items-center">
        <div
          role="img"
          aria-label="QR code for mobile login"
          className="relative z-10 rounded-xl bg-white p-2.5 shadow-2xl shadow-[#141f3d]/40 ring-1 ring-white/50 outline-none transition-all duration-700 ease-out transform-gpu hover:z-20 hover:-translate-y-1 hover:scale-125 hover:shadow-[0_24px_48px_-18px_rgba(14,24,54,0.6)] focus-visible:z-20 focus-visible:-translate-y-1 focus-visible:scale-125 focus-visible:ring-4 focus-visible:ring-accent/30"
        >
          <QRCodeSVG
            value="https://soc5-outbound.app/scan?session=demo-4821"
            size={124}
            bgColor="#ffffff"
            fgColor="#0d1730"
            level="M"
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="rounded bg-white px-1.5 py-1 shadow-md">
              <span className="text-accent font-display text-xs font-bold">
                S5
              </span>
            </div>
          </div>
          <span className="qr-scan" aria-hidden />
        </div>

        <div className="mt-3.5 flex items-center gap-1.5">
          <Camera className="h-4 w-4 text-link" strokeWidth={2.2} />
          <span className="font-display text-[12.5px] font-semibold text-ink">
            Use Camera App to Scan QR
          </span>
        </div>
        <p className="mt-1 max-w-[215px] text-center text-[11.5px] leading-snug text-muted">
          Click the generated link to redirect to the mobile app
        </p>
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
