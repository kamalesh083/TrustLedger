import { useMemo, useRef, useState } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { sepolia } from "wagmi/chains";

import UploadDropzone from "../components/UploadDropzone";
import { hashFileSHA256 } from "../lib/hashFile";
import { getContentHash } from "../lib/contentHash";
import { getSignerContract } from "../lib/contract";

import { QRCodeCanvas } from "qrcode.react";

type Mode = "strict" | "content";
type Stage = "idle" | "hashing" | "ready" | "error";

export default function RegisterPage() {
  // Wallet / chain
  const { isConnected, address } = useAccount();
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

  const [cid, setCid] = useState("");

  // UI
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState<"" | "register">("");
  const [registeredTx, setRegisteredTx] = useState<string>(""); // ✅ new

  const selectedHash = useMemo(
    () => (mode === "strict" ? fileHash : contentHash),
    [mode, fileHash, contentHash]
  );

  // ✅ Identity QR payload (generated once user is connected)
  const identityPayload = useMemo(() => {
    if (!address) return "";
    return `${window.location.origin}/verify-issuer?address=${address}&network=sepolia`;
  }, [address]);

  // ✅ QR download ref
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);

  function downloadQR() {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;

    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `trustledger-identity-${address?.slice(0, 6) || "user"}.png`;
    a.click();
  }

  async function onPick(file: File | null) {
    // clear page state
    setStatus("");
    setBusy("");
    setFileName("");
    setFileSize(0);
    setFileHash("");
    setContentHash("");
    setStage("idle");
    setRegisteredTx(""); // ✅ reset QR section when new file chosen

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

  async function onRegister() {
    if (!selectedHash) return setStatus("Upload a file first.");
    if (!isConnected) return setStatus("Connect wallet first.");
    if (!isSepolia) return setStatus("Switch to Sepolia first.");

    setBusy("register");
    setStatus("Opening wallet...");
    try {
      const c = await getSignerContract();
      const tx = await c.register(selectedHash, cid);

      setRegisteredTx(tx.hash); // ✅ store tx hash to show after wait
      setStatus(`Transaction pending: ${tx.hash}`);

      await tx.wait();
      setStatus("✅ Registered on-chain! Your Identity QR is ready below.");
    } catch (e: any) {
      setRegisteredTx("");
      setStatus("❌ " + (e?.reason || e?.message || "Register failed"));
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
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
              On-chain Registry
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Register
            </h2>
            <p className="text-sm text-slate-300/70 mt-1">
              Upload → hash → register on Sepolia
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
            Selected hash for register
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

        {/* CID */}
        <label className="relative block mt-5">
          <span className="text-xs text-slate-300/70">Optional IPFS CID</span>
          <input
            value={cid}
            onChange={(e) => setCid(e.target.value)}
            placeholder="bafy..."
            className="mt-2 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-100/90 outline-none focus:ring-2 focus:ring-cyan-300/20 focus:border-white/15"
          />
          <div className="mt-2 text-[11px] text-slate-300/60">
            Store the file on IPFS and paste the CID here (optional).
          </div>
        </label>

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

        {/* Register button */}
        <button
          onClick={onRegister}
          disabled={
            busy === "register" || !selectedHash || !isConnected || !isSepolia
          }
          className="relative mt-4 w-full rounded-2xl px-4 py-3 text-sm font-semibold
                     bg-gradient-to-r from-emerald-400 to-cyan-300 text-black
                     hover:opacity-95 active:opacity-90 disabled:opacity-50"
        >
          {busy === "register" ? "Registering..." : "Register"}
        </button>

        {/* ✅ Identity QR section (appears after on-chain register) */}
        {registeredTx && address && identityPayload && (
          <div className="relative mt-6 rounded-3xl border border-white/10 bg-black/25 p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Your Identity QR</div>
                <div className="text-xs text-slate-300/70 mt-1">
                  Paste this QR on documents to show who issued them.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => copy(identityPayload)}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                >
                  Copy payload
                </button>
                <button
                  onClick={downloadQR}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs hover:bg-white/10"
                >
                  Download QR (PNG)
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col md:flex-row gap-4">
              <div className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-4">
                <QRCodeCanvas
                  value={identityPayload}
                  size={220}
                  includeMargin
                  ref={qrCanvasRef}
                />
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-xs text-slate-300/70">Wallet</div>
                <code className="block text-xs break-all text-slate-100/90">
                  {address}
                </code>

                <div className="text-xs text-slate-300/70 mt-3">
                  Registration TX
                </div>
                <code className="block text-xs break-all text-slate-100/90">
                  {registeredTx}
                </code>

                <div className="mt-3 text-[11px] text-slate-300/60">
                  Note: This Identity QR proves “who issued it”. For
                  tamper-proof verification of a specific file, also generate a
                  Document QR per upload (fileHash + txHash).
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {status && (
          <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            {status}
          </div>
        )}
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
