import { useMemo, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import UploadDropzone from "../components/UploadDropzone";
import { hashFileSHA256 } from "../lib/hashFile";
import { getContentHash } from "../lib/contentHash";
import { getReadContract } from "../lib/contract";

type Mode = "strict" | "content";
type Stage = "idle" | "hashing" | "ready" | "error";

export default function VerifyPage() {
  // Wallet / chain
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isSepolia = chainId === sepolia.id;

  // Upload + hashes (local to this page)
  const [mode, setMode] = useState<Mode>("strict");
  const [stage, setStage] = useState<Stage>("idle");

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState<number>(0);

  const [fileHash, setFileHash] = useState("");
  const [contentHash, setContentHash] = useState("");

  // UI
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<"" | "verify">("");
  const [result, setResult] = useState<null | {
    exists: boolean;
    owner: string;
    timestamp: number;
    ipfsCid: string;
  }>(null);

  const selectedHash = useMemo(
    () => (mode === "strict" ? fileHash : contentHash),
    [mode, fileHash, contentHash]
  );

  async function onPick(file: File | null) {
    setStatus("");
    setBusy("");
    setResult(null);

    setFileName("");
    setFileSize(0);
    setFileHash("");
    setContentHash("");
    setStage("idle");

    if (!file) return;

    setFileName(file.name);
    setFileSize(file.size);
    setStage("hashing");

    try {
      setStatus("Hashing file (strict)...");
      const fh = await hashFileSHA256(file);
      setFileHash(fh);

      setStatus("Extracting content (content hash)...");
      try {
        const { contentHash: ch } = await getContentHash(file);
        setContentHash(ch);
        setStatus("");
      } catch {
        setStatus(
          "Content hash failed (unsupported). Strict hash still works."
        );
      }

      setStage("ready");
    } catch (e: any) {
      setStage("error");
      setStatus("❌ " + (e?.message || "Failed to process file"));
    }
  }

  async function onVerify() {
    if (!selectedHash) return setStatus("Upload a file first.");
    if (!isConnected) return setStatus("Connect wallet first.");
    if (!isSepolia) return setStatus("Switch to Sepolia first.");

    setBusy("verify");
    setStatus("Verifying on-chain...");
    setResult(null);

    try {
      const c = await getReadContract();
      const [exists, owner, timestamp, ipfsCid] = await c.getRecord(
        selectedHash
      );

      setResult({
        exists,
        owner,
        timestamp: Number(timestamp),
        ipfsCid,
      });
      setStatus("");
    } catch (e: any) {
      setStatus("❌ " + (e?.message || "Verify failed"));
    } finally {
      setBusy("");
    }
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setStatus("Copied ✅");
    setTimeout(() => setStatus(""), 900);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] relative overflow-hidden">
        {/* subtle card glow to match theme */}
        <div className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.14),transparent_55%),radial-gradient(circle_at_85%_20%,rgba(167,139,250,0.12),transparent_55%)]" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
              <span className="h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.75)]" />
              Authenticity Check
            </div>

            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Verify
            </h2>
            <p className="text-sm text-slate-300/70 mt-1">
              Upload → hash → verify on Sepolia
            </p>
          </div>

          {/* Mode toggle (theme-styled) */}
          <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
            <button
              onClick={() => setMode("strict")}
              className={[
                "px-3 py-2 text-sm rounded-xl transition",
                mode === "strict"
                  ? "bg-gradient-to-r from-cyan-300 to-white text-black shadow-[0_0_18px_rgba(34,211,238,0.22)]"
                  : "text-slate-200/80 hover:bg-white/5",
              ].join(" ")}
            >
              Strict
            </button>
            <button
              onClick={() => setMode("content")}
              className={[
                "px-3 py-2 text-sm rounded-xl transition",
                mode === "content"
                  ? "bg-gradient-to-r from-violet-300 to-white text-black shadow-[0_0_18px_rgba(167,139,250,0.18)]"
                  : "text-slate-200/80 hover:bg-white/5",
              ].join(" ")}
            >
              Content
            </button>
          </div>
        </div>

        {/* Upload */}
        <div className="relative mt-5">
          <UploadDropzone
            onFile={onPick}
            fileName={fileName}
            fileSize={fileSize}
            stage={stage}
          />
        </div>

        {/* Hashes */}
        <div className="relative mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <HashMini
            title="Strict hash"
            value={fileHash}
            active={mode === "strict"}
            onCopy={() => copy(fileHash)}
          />
          <HashMini
            title="Content hash"
            value={contentHash}
            active={mode === "content"}
            onCopy={() => copy(contentHash)}
          />
        </div>

        {/* Selected hash */}
        <div className="relative mt-5 rounded-3xl border border-white/10 bg-black/25 p-5">
          <div className="text-xs text-slate-300/70">
            Selected hash for verify
          </div>
          <div className="mt-2 flex items-start gap-2">
            <code className="text-xs break-all text-slate-100/90">
              {selectedHash || "—"}
            </code>
            <button
              onClick={() => copy(selectedHash)}
              disabled={!selectedHash}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
            >
              Copy
            </button>
          </div>
        </div>

        {/* Network switch */}
        {isConnected && !isSepolia && (
          <button
            onClick={() => switchChain?.({ chainId: sepolia.id })}
            className="relative mt-4 w-full md:w-auto rounded-2xl px-4 py-2 text-sm font-semibold
                       bg-gradient-to-r from-cyan-300 to-violet-300 text-black
                       hover:opacity-95 active:opacity-90"
          >
            Switch to Sepolia
          </button>
        )}

        {/* Verify button */}
        <button
          onClick={onVerify}
          disabled={
            busy === "verify" || !selectedHash || !isConnected || !isSepolia
          }
          className="relative mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold
                     bg-gradient-to-r from-sky-300 to-cyan-300 text-black
                     hover:opacity-95 active:opacity-90 disabled:opacity-50"
        >
          {busy === "verify" ? "Verifying..." : "Verify"}
        </button>

        {/* Result */}
        <div className="relative mt-4">
          {status && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              {status}
            </div>
          )}

          {result && (
            <div className="mt-4">
              {result.exists ? (
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-5 relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(52,211,153,0.16),transparent_60%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,0.10),transparent_55%)]" />
                  <div className="relative font-semibold text-emerald-100">
                    ✅ Verified
                  </div>
                  <div className="relative mt-2 text-sm space-y-1 text-emerald-50/90">
                    <div className="break-all">Owner: {result.owner}</div>
                    <div>
                      Time: {new Date(result.timestamp * 1000).toLocaleString()}
                    </div>
                    <div className="break-all">
                      CID: {result.ipfsCid || "(none)"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 relative overflow-hidden">
                  <div className="pointer-events-none absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.16),transparent_60%),radial-gradient(circle_at_90%_10%,rgba(167,139,250,0.08),transparent_55%)]" />
                  <div className="relative font-semibold text-rose-100">
                    ❌ Not registered / tampered
                  </div>
                  <div className="relative text-sm text-rose-100/70 mt-2">
                    Strict mode fails if even 1 byte changes.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HashMini({
  title,
  value,
  active,
  onCopy,
}: {
  title: string;
  value: string;
  active: boolean;
  onCopy: () => void;
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

      <div className="relative flex items-center justify-between gap-2">
        <div className="text-sm font-semibold">{title}</div>
        <button
          onClick={onCopy}
          disabled={!value}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 disabled:opacity-50"
        >
          Copy
        </button>
      </div>

      <code className="relative mt-3 block text-xs break-all text-slate-100/90">
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
