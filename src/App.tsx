import { useMemo, useState } from "react";
import { hashFileSHA256 } from "./lib/hashFile";
import { getContentHash } from "./lib/contentHash"; // if you haven’t added this yet, comment it out + use strict only
import { getReadContract, getSignerContract } from "./lib/contract";

type Mode = "strict" | "content";

export default function App() {
  const [mode, setMode] = useState<Mode>("strict");

  const [fileName, setFileName] = useState<string>("");
  const [fileHash, setFileHash] = useState<string>("");
  const [contentHash, setContentHash] = useState<string>("");
  const [cid, setCid] = useState<string>("");

  const [status, setStatus] = useState<string>("");
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

  async function onFileChange(file: File | null) {
    setStatus("");
    setResult(null);
    setFileName("");
    setFileHash("");
    setContentHash("");

    if (!file) return;

    setFileName(file.name);

    // Strict hash (fast, works for all)
    setStatus("Hashing file (strict)...");
    const fh = await hashFileSHA256(file);
    setFileHash(fh);

    // Content hash (optional, slower; works best for PDF/DOCX/TXT)
    setStatus("Extracting content (content hash)...");
    try {
      const { contentHash: ch } = await getContentHash(file);
      setContentHash(ch);
      setStatus("");
    } catch {
      setStatus(
        "Content extraction failed (maybe scanned PDF / unsupported). Strict hash still works."
      );
    }
  }

  async function onRegister() {
    if (!selectedHash) return;
    try {
      setStatus("Opening MetaMask...");
      const c = await getSignerContract();
      const tx = await c.register(selectedHash, cid);
      setStatus(`Transaction pending: ${tx.hash}`);
      await tx.wait();
      setStatus("✅ Registered on-chain!");
    } catch (e: any) {
      setStatus("❌ " + (e?.reason || e?.message || "Register failed"));
    }
  }

  async function onVerify() {
    if (!selectedHash) return;
    try {
      setStatus("Verifying on-chain...");
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
    }
  }

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
    setStatus("Copied ✅");
    setTimeout(() => setStatus(""), 900);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Blockchain Content Verification
            </h1>
            <p className="text-sm text-slate-400">
              Hash client-side → store on-chain → verify authenticity anytime
            </p>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
            Testnet Ready
          </span>
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* File + Mode */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">1) Select a file</h2>
              <p className="text-sm text-slate-400">
                Strict mode checks exact bytes. Content mode checks
                extracted/normalized content.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mode:</span>
              <div className="inline-flex rounded-xl border border-slate-800 bg-slate-950/40 p-1">
                <button
                  onClick={() => setMode("strict")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    mode === "strict"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  Strict
                </button>
                <button
                  onClick={() => setMode("content")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition ${
                    mode === "content"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  Content
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
            <label className="relative inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 cursor-pointer hover:bg-slate-800/30 transition">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
              <span className="text-sm font-medium">Choose file</span>
              <span className="ml-3 text-xs text-slate-400 truncate max-w-[240px]">
                {fileName || "No file selected"}
              </span>
            </label>

            <div className="flex-1" />

            <div className="text-xs text-slate-400">
              Tip: register a file, then edit 1 character and verify again to
              show tampering.
            </div>
          </div>

          {/* Hashes */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <HashCard
              title="Strict file hash (bytes)"
              value={fileHash}
              onCopy={() => copy(fileHash)}
              active={mode === "strict"}
            />
            <HashCard
              title="Content hash (extracted)"
              value={contentHash}
              onCopy={() => copy(contentHash)}
              active={mode === "content"}
            />
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="text-xs text-slate-400">
              Using for register/verify:
            </div>
            <div className="mt-1 flex items-start gap-2">
              <code className="text-xs md:text-sm break-all text-slate-100">
                {selectedHash || "—"}
              </code>
              <button
                onClick={() => copy(selectedHash)}
                disabled={!selectedHash}
                className="shrink-0 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-slate-900"
              >
                Copy
              </button>
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Register */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-base font-semibold">2) Register on-chain</h2>
            <p className="text-sm text-slate-400 mt-1">
              Stores the selected hash + timestamp + owner address in the
              contract.
            </p>

            <label className="block mt-4">
              <span className="text-xs text-slate-400">Optional IPFS CID</span>
              <input
                value={cid}
                onChange={(e) => setCid(e.target.value)}
                placeholder="bafy..."
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-600"
              />
            </label>

            <button
              onClick={onRegister}
              disabled={!selectedHash}
              className="mt-4 w-full rounded-xl bg-slate-100 text-slate-900 px-4 py-2.5 text-sm font-semibold hover:bg-white disabled:opacity-50 disabled:hover:bg-slate-100"
            >
              Register
            </button>

            <p className="text-xs text-slate-400 mt-3">
              If MetaMask opens on the wrong chain, switch to <b>Sepolia</b>.
            </p>
          </div>

          {/* Verify */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <h2 className="text-base font-semibold">3) Verify authenticity</h2>
            <p className="text-sm text-slate-400 mt-1">
              Re-hash the file, then check if that hash exists on-chain.
            </p>

            <button
              onClick={onVerify}
              disabled={!selectedHash}
              className="mt-4 w-full rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2.5 text-sm font-semibold hover:bg-slate-800/40 disabled:opacity-50"
            >
              Verify
            </button>

            <div className="mt-4">
              {!result ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-sm text-slate-400">
                  Upload a file and click verify.
                </div>
              ) : result.exists ? (
                <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-emerald-200 font-semibold">
                      ✅ Verified
                    </div>
                    <span className="text-xs text-emerald-200/70">
                      exists = true
                    </span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <InfoRow label="Owner" value={result.owner} />
                    <InfoRow
                      label="Time"
                      value={new Date(result.timestamp * 1000).toLocaleString()}
                    />
                    <InfoRow label="CID" value={result.ipfsCid || "(none)"} />
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-rose-800 bg-rose-900/20 p-4">
                  <div className="text-rose-200 font-semibold">
                    ❌ Not registered / different content
                  </div>
                  <p className="text-sm text-rose-200/80 mt-2">
                    If you changed even 1 byte (or converted formats in Strict
                    mode), the hash won’t match.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Status */}
        {status && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-200">
            {status}
          </div>
        )}
      </main>

      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
          Strict mode = exact file integrity • Content mode = cross-format
          content match (best for PDF/DOCX/TXT)
        </div>
      </footer>
    </div>
  );
}

function HashCard({
  title,
  value,
  onCopy,
  active,
}: {
  title: string;
  value: string;
  onCopy: () => void;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-slate-200/50 bg-slate-950/40"
          : "border-slate-800 bg-slate-950/20"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-100">{title}</div>
        <button
          onClick={onCopy}
          disabled={!value}
          className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs hover:bg-slate-800 disabled:opacity-50"
        >
          Copy
        </button>
      </div>
      <code className="mt-3 block text-xs md:text-sm break-all text-slate-200">
        {value || "—"}
      </code>
      {active && (
        <div className="mt-3 inline-flex items-center rounded-full bg-slate-100 text-slate-900 px-2 py-0.5 text-[11px] font-semibold">
          Selected
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-sm text-slate-100 break-all">{value}</div>
    </div>
  );
}
