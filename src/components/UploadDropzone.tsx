import { useEffect, useMemo, useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  X,
  RefreshCcw,
} from "lucide-react";

type Stage = "idle" | "hashing" | "ready" | "error";

export default function UploadDropzone({
  onFile,
  accept,
  fileName,
  fileSize,
  stage,
  hint = "or drag and drop them here",
}: {
  onFile: (file: File | null) => void;
  accept?: string;
  fileName?: string;
  fileSize?: number;
  stage: Stage;
  hint?: string;
}) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (stage === "hashing") {
      setProgress(8);
      const t = setInterval(() => {
        setProgress((p) =>
          p < 92 ? p + Math.max(1, Math.round((92 - p) / 8)) : p
        );
      }, 120);
      return () => clearInterval(t);
    }
    if (stage === "ready") setProgress(100);
    if (stage === "idle") setProgress(0);
    if (stage === "error") setProgress(20);
  }, [stage]);

  const statusText = useMemo(() => {
    if (stage === "hashing") return "Processing file…";
    if (stage === "ready") return "Uploaded ✓";
    if (stage === "error") return "Upload failed";
    return "Choose files to Upload";
  }, [stage]);

  const borderClass =
    stage === "ready"
      ? "border-emerald-400/60"
      : stage === "error"
      ? "border-rose-400/60"
      : drag
      ? "border-sky-300/70"
      : "border-white/20";

  const glowClass =
    stage === "ready"
      ? "shadow-[0_0_40px_-10px_rgba(16,185,129,0.55)]"
      : stage === "error"
      ? "shadow-[0_0_40px_-10px_rgba(244,63,94,0.55)]"
      : drag
      ? "shadow-[0_0_40px_-10px_rgba(56,189,248,0.55)]"
      : "shadow-[0_0_30px_-14px_rgba(255,255,255,0.25)]";

  const buttonClass =
    stage === "ready"
      ? "bg-emerald-600 hover:bg-emerald-500"
      : stage === "hashing"
      ? "bg-slate-600 cursor-not-allowed"
      : stage === "error"
      ? "bg-rose-600 hover:bg-rose-500"
      : "bg-emerald-600 hover:bg-emerald-500";

  const openPicker = () => {
    if (stage === "hashing") return;
    inputRef.current?.click();
  };

  return (
    <div
      onClick={openPicker}
      onDragEnter={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        onFile(e.dataTransfer.files?.[0] ?? null);
      }}
      className={[
        "relative overflow-hidden rounded-2xl border-2 border-dashed p-8 md:p-10 text-center",
        "transition duration-300",
        "bg-white/[0.04] hover:bg-white/[0.06]",
        "backdrop-blur-xl",
        "cursor-pointer select-none",
        "hover:-translate-y-0.5",
        borderClass,
        glowClass,
      ].join(" ")}
    >
      {/* Animated background accents */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      {drag && (
        <div className="pointer-events-none absolute inset-0 bg-sky-500/10 animate-pulse" />
      )}

      {/* IMPORTANT: input is NOT overlaying everything */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />

      {/* Top icon */}
      <div className="mx-auto w-fit rounded-full p-4 border border-white/10 bg-black/20">
        <div
          className={
            stage === "hashing"
              ? "animate-pulse"
              : "transition-transform duration-300 hover:scale-105"
          }
        >
          {stage === "ready" ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
          ) : stage === "error" ? (
            <X className="h-10 w-10 text-rose-300" />
          ) : (
            <UploadCloud className="h-10 w-10 text-sky-300" />
          )}
        </div>
      </div>

      {/* Main action button */}
      <button
        type="button"
        disabled={stage === "hashing"}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation(); // so it doesn't double-trigger
          openPicker();
        }}
        className={[
          "mt-5 inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold text-white shadow-md transition",
          "active:scale-[0.98]",
          buttonClass,
        ].join(" ")}
      >
        {statusText}
      </button>

      <div className="mt-3 text-sm text-slate-200/80">{hint}</div>

      {/* File details + actions */}
      {fileName && (
        <div
          className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-left"
          onClick={(e) => e.stopPropagation()} // allow clicking inside without opening picker
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 grid place-items-center">
                <FileText className="h-5 w-5 text-slate-200" />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{fileName}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300/80">
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    {getExt(fileName)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    {fileSize ? prettyBytes(fileSize) : "—"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                    {stage}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openPicker();
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 active:scale-[0.98]"
              >
                <RefreshCcw className="h-4 w-4" />
                Replace
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // ✅ stops bubbling to container click
                  if (inputRef.current) inputRef.current.value = "";
                  onFile(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 active:scale-[0.98]"
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            </div>
          </div>

          {/* Progress bar with shimmer */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-300/80">
              <span>{stage === "hashing" ? "Hashing…" : "Progress"}</span>
              <span>{Math.round(progress)}%</span>
            </div>

            <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className={[
                  "h-full rounded-full transition-all",
                  stage === "hashing" ? "relative bg-white/70" : "bg-white",
                ].join(" ")}
                style={{ width: `${progress}%` }}
              >
                {stage === "hashing" && (
                  <div className="absolute inset-0 translate-x-[-60%] animate-[shimmer_1.2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                )}
              </div>
            </div>

            {/* keyframes without editing tailwind config: inline style tag */}
            <style>{`
              @keyframes shimmer {
                0% { transform: translateX(-60%); }
                100% { transform: translateX(140%); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  );
}

function getExt(name: string) {
  const i = name.lastIndexOf(".");
  if (i === -1) return "FILE";
  return name.slice(i + 1).toUpperCase();
}

function prettyBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  return `${v.toFixed(v >= 10 || u === 0 ? 0 : 1)} ${units[u]}`;
}
