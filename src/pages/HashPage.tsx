import { useMemo, useRef, useState } from "react";
import { hashFileSHA256 } from "../lib/hashFile";
import { getContentHash } from "../lib/contentHash";
import { useHashStore } from "../store/useHashStore";

type Mode = "strict" | "content";

export default function HashPage() {
  const {
    mode,
    setMode,
    fileName,
    fileHash,
    contentHash,
    setFileName,
    setFileHash,
    setContentHash,
    reset,
  } = useHashStore();

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const selectedHash = mode === "strict" ? fileHash : contentHash;

  const hints = useMemo(() => {
    if (!fileName) return "PDF/DOCX/images supported (strict always works)";
    if (busy) return "Computing cryptographic fingerprints…";
    return "You can now Register or Verify using the selected hash.";
  }, [fileName, busy]);

  async function onFileChange(file: File | null) {
    setStatus("");
    reset();
    if (!file) return;

    setBusy(true);
    setFileName(file.name);

    try {
      setStatus("Hashing file (strict SHA-256)…");
      const fh = await hashFileSHA256(file);
      setFileHash(fh);

      setStatus("Extracting content fingerprint…");
      try {
        const { contentHash: ch } = await getContentHash(file);
        setContentHash(ch);
        setStatus("");
      } catch {
        setStatus(
          "Content extraction failed (scanned PDF/unsupported). Strict hash still works."
        );
      }
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setStatus("Copied ✅");
    setTimeout(() => setStatus(""), 900);
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    void onFileChange(file);
  }

  return (
    <div className="space-y-6">
      {/* Top title / console header */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
              Verification Console
            </div>

            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              1) Hash your file
            </h2>
            <p className="text-sm text-slate-300/70 mt-1">
              Generate a cryptographic fingerprint. Then use Register / Verify.
            </p>
          </div>

          {/* Mode toggle */}
          <ModeToggle mode={mode} setMode={setMode} />
        </div>

        {/* Upload panel */}
        <div className="mt-6">
          <div
            onClick={openPicker}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOver(false);
            }}
            onDrop={onDrop}
            className={[
              "relative rounded-3xl border border-dashed p-6 md:p-7 cursor-pointer select-none",
              "bg-gradient-to-b from-white/5 to-black/30 backdrop-blur-md",
              "transition",
              dragOver
                ? "border-cyan-300/60 shadow-[0_0_0_1px_rgba(34,211,238,0.25),0_0_60px_rgba(34,211,238,0.12)]"
                : "border-white/15 hover:border-white/25 hover:bg-white/[0.06]",
            ].join(" ")}
          >
            {/* subtle inner glow */}
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(167,139,250,0.12),transparent_50%)]" />

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />

            <div className="relative flex items-start gap-4">
              <div className="mt-1 h-11 w-11 rounded-2xl border border-white/10 bg-white/5 grid place-items-center">
                <span className="text-lg">⛓️</span>
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold">
                  {busy
                    ? "Processing…"
                    : dragOver
                    ? "Drop the file to hash"
                    : "Click or drag & drop to upload"}
                </div>

                <div className="text-xs text-slate-300/70 mt-1 truncate">
                  {fileName || hints}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-200/70">
                  <Chip label="Strict SHA-256" tone="cyan" />
                  <Chip label="Content fingerprint" tone="violet" />
                  <span className="text-slate-400/70">
                    (content mode needs extractable text)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hash outputs */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <HashCard
              title="Strict hash (SHA-256)"
              desc="Best for exact file identity. Any tiny change → different hash."
              value={fileHash}
              active={mode === "strict"}
              badge={fileHash ? "READY" : "—"}
              badgeTone={fileHash ? "ok" : "muted"}
              onCopy={() => copy(fileHash)}
              onSelect={() => setMode("strict")}
            />

            <HashCard
              title="Content hash (fingerprint)"
              desc="Tries to match same text/content across formats (PDF/DOCX)."
              value={contentHash}
              active={mode === "content"}
              badge={contentHash ? "READY" : "NOT AVAILABLE"}
              badgeTone={contentHash ? "ok" : "warn"}
              onCopy={() => copy(contentHash)}
              onSelect={() => setMode("content")}
            />
          </div>

          {/* Selected hash */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xs text-slate-300/70">Selected hash</div>
                <code className="mt-2 block text-xs md:text-sm break-all text-slate-100/90">
                  {selectedHash || "—"}
                </code>
              </div>

              <button
                onClick={() => copy(selectedHash)}
                disabled={!selectedHash}
                className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
              >
                Copy
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300/70">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-300/80" />
                Use this hash on{" "}
                <span className="text-slate-200">Register</span> page to write
                on-chain
              </span>
              <span className="text-white/20">•</span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-violet-300/80" />
                Use it on <span className="text-slate-200">Verify</span> to
                check authenticity
              </span>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {status}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ModeToggle({
  mode,
  setMode,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
}) {
  return (
    <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
      <button
        onClick={() => setMode("strict")}
        className={[
          "px-3 py-2 text-sm rounded-xl transition",
          mode === "strict"
            ? "bg-gradient-to-r from-cyan-300 to-white text-black shadow-[0_0_18px_rgba(34,211,238,0.25)]"
            : "text-slate-100/80 hover:bg-white/5",
        ].join(" ")}
      >
        Strict
      </button>
      <button
        onClick={() => setMode("content")}
        className={[
          "px-3 py-2 text-sm rounded-xl transition",
          mode === "content"
            ? "bg-gradient-to-r from-violet-300 to-white text-black shadow-[0_0_18px_rgba(167,139,250,0.22)]"
            : "text-slate-100/80 hover:bg-white/5",
        ].join(" ")}
      >
        Content
      </button>
    </div>
  );
}

function Chip({ label, tone }: { label: string; tone: "cyan" | "violet" }) {
  const cls =
    tone === "cyan"
      ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-100/80"
      : "border-violet-300/20 bg-violet-300/10 text-violet-100/80";
  return (
    <span className={`rounded-full border px-2.5 py-1 ${cls}`}>{label}</span>
  );
}

function Badge({
  text,
  tone,
}: {
  text: string;
  tone: "ok" | "warn" | "muted";
}) {
  const cls =
    tone === "ok"
      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100/85"
      : tone === "warn"
      ? "border-amber-400/20 bg-amber-400/10 text-amber-100/85"
      : "border-white/10 bg-white/5 text-slate-200/70";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] ${cls}`}>
      {text}
    </span>
  );
}

function HashCard({
  title,
  desc,
  value,
  active,
  badge,
  badgeTone,
  onCopy,
  onSelect,
}: {
  title: string;
  desc: string;
  value: string;
  active: boolean;
  badge: string;
  badgeTone: "ok" | "warn" | "muted";
  onCopy: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      className={[
        "rounded-3xl border p-5 transition relative overflow-hidden",
        active
          ? "border-white/20 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_rgba(0,0,0,0.35)]"
          : "border-white/10 bg-black/20 hover:bg-white/[0.05] hover:border-white/15",
      ].join(" ")}
    >
      {/* subtle accent */}
      <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(circle_at_90%_20%,rgba(167,139,250,0.10),transparent_55%)]" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-semibold">{title}</div>
            <Badge text={badge} tone={badgeTone} />
          </div>
          <div className="text-xs text-slate-300/70 mt-1">{desc}</div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
          >
            Select
          </button>
          <button
            onClick={onCopy}
            disabled={!value}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
          >
            Copy
          </button>
        </div>
      </div>

      <code className="relative mt-4 block text-xs break-all text-slate-100/90">
        {value || "—"}
      </code>

      {active && (
        <div className="relative mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 text-black px-3 py-1 text-[11px] font-semibold">
          <span className="h-2 w-2 rounded-full bg-black/50" />
          Selected
        </div>
      )}
    </div>
  );
}
