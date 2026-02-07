import { Outlet, NavLink } from "react-router-dom";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import logo from "./assets/logo.jpeg"; // replace later

export default function AppShell() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isSepolia = chainId === sepolia.id;

  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "";

  return (
    <div className="min-h-screen text-slate-100 bg-[#040712] relative overflow-hidden">
      {/* ===== Background: blockchain mesh + glows + scanline ===== */}
      <div className="pointer-events-none absolute inset-0">
        {/* soft gradients */}
        <div className="absolute -top-48 -left-48 h-[560px] w-[560px] rounded-full bg-cyan-400/12 blur-[140px]" />
        <div className="absolute -bottom-56 -right-44 h-[680px] w-[680px] rounded-full bg-violet-400/12 blur-[160px]" />

        {/* Blockchain mesh (SVG) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-[0.22]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
          style={{
            maskImage:
              "radial-gradient(circle at 55% 25%, black 0%, black 35%, transparent 75%)",
          }}
        >
          <defs>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(34,211,238,0.55)" />
              <stop offset="0.5" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="1" stopColor="rgba(167,139,250,0.45)" />
            </linearGradient>

            <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="rgba(255,255,255,0.9)" />
              <stop offset="0.4" stopColor="rgba(34,211,238,0.55)" />
              <stop offset="1" stopColor="rgba(34,211,238,0)" />
            </radialGradient>
          </defs>

          {/* links */}
          <g stroke="url(#lineGrad)" strokeWidth="1.2" opacity="0.9">
            <path
              d="M120 120 L320 220 L520 140 L760 240 L980 160"
              fill="none"
            />
            <path
              d="M180 360 L360 300 L560 420 L740 340 L1020 420"
              fill="none"
            />
            <path
              d="M220 620 L420 520 L620 660 L820 540 L1040 620"
              fill="none"
            />
            <path d="M320 220 L360 300 L420 520" fill="none" />
            <path d="M520 140 L560 420 L620 660" fill="none" />
            <path d="M760 240 L740 340 L820 540" fill="none" />
            <path d="M980 160 L1020 420 L1040 620" fill="none" />
          </g>

          {/* nodes */}
          <g>
            {[
              [120, 120],
              [320, 220],
              [520, 140],
              [760, 240],
              [980, 160],
              [180, 360],
              [360, 300],
              [560, 420],
              [740, 340],
              [1020, 420],
              [220, 620],
              [420, 520],
              [620, 660],
              [820, 540],
              [1040, 620],
            ].map(([cx, cy], i) => (
              <g key={i}>
                <circle cx={cx} cy={cy} r="18" fill="url(#nodeGrad)" />
                <circle cx={cx} cy={cy} r="3.2" fill="rgba(255,255,255,0.85)" />
              </g>
            ))}
          </g>
        </svg>

        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        {/* scanline sweep */}
        <div className="absolute inset-0 opacity-[0.10]">
          <div className="absolute -top-24 left-0 right-0 h-24 bg-gradient-to-b from-white/0 via-white/35 to-white/0 blur-sm animate-[scan_5s_linear_infinite]" />
        </div>
      </div>

      <header className="relative border-b border-white/10 bg-white/[0.04] backdrop-blur-xl">
        {/* Header Row: Brand | Center Tabs | Wallet */}
        <div className="mx-auto max-w-6xl px-4 py-4 grid grid-cols-3 items-center gap-4">
          {/* LEFT: Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/25 via-white/10 to-violet-400/20 blur-md" />
              <div className="relative h-11 w-11 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md grid place-items-center overflow-hidden shadow-lg shadow-black/40">
                <img
                  src={logo}
                  alt="TrustLedger Logo"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
                <span className="font-bold text-sm tracking-wide text-white">
                  TL
                </span>
              </div>
            </div>

            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <div className="text-lg font-semibold tracking-tight">
                  TrustLedger
                </div>
                <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.9)]" />
              </div>

              <div className="text-xs text-slate-300/70">
                Hash → Register → Verify
              </div>
            </div>
          </div>

          {/* CENTER: Tabs */}
          <div className="flex justify-center">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
              <Tab to="/">Hash</Tab>
              <Tab to="/register">Register</Tab>
              <Tab to="/verify">Verify</Tab>
            </div>
          </div>

          {/* RIGHT: Wallet / Status */}
          <div className="flex items-center justify-end gap-3">
            <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  isConnected ? "bg-emerald-400" : "bg-slate-500"
                } shadow-[0_0_14px_rgba(52,211,153,0.7)]`}
              />
              <div className="text-xs text-slate-200/80">
                {isConnected ? (
                  <>
                    <span className="font-semibold text-white">{short}</span>
                    <span className="mx-2 text-white/20">|</span>
                    <span
                      className={
                        isSepolia ? "text-emerald-200/90" : "text-amber-200/90"
                      }
                    >
                      {isSepolia ? "Sepolia Ready" : "Wrong Network"}
                    </span>
                  </>
                ) : (
                  "Wallet Disconnected"
                )}
              </div>
            </div>

            {isConnected && !isSepolia && (
              <button
                onClick={() => switchChain?.({ chainId: sepolia.id })}
                className="hidden md:inline-flex rounded-xl px-3 py-2 text-xs font-semibold
                           bg-gradient-to-r from-cyan-300 to-violet-300 text-black
                           hover:opacity-95 active:opacity-90"
              >
                Switch to Sepolia
              </button>
            )}

            <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      </header>

      <main className="relative mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <style>{`
        @keyframes scan {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: .55; }
          50%  { opacity: .25; }
          90%  { opacity: .55; }
          100% { transform: translateY(120vh); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `relative rounded-2xl px-4 py-2 text-sm border transition overflow-hidden ${
          isActive
            ? "border-white/20 bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_12px_40px_rgba(0,0,0,0.35)]"
            : "border-white/10 bg-white/[0.03] text-slate-200/80 hover:bg-white/8 hover:border-white/15"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {children}
          <span
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          />
        </>
      )}
    </NavLink>
  );
}
