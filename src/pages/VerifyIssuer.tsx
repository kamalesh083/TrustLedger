import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { sepolia } from "wagmi/chains";

export default function VerifyIssuer() {
  const [params] = useSearchParams();

  const address = params.get("address") || "";
  const network = params.get("network") || "sepolia";

  const isValidAddress = useMemo(() => {
    // simple check (optional)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }, [address]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200/80">
          <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.7)]" />
          Issuer Verification
        </div>

        <h2 className="mt-3 text-xl font-semibold tracking-tight">
          Verify Issuer
        </h2>

        {!address ? (
          <p className="mt-3 text-sm text-slate-300/70">
            ❌ No address found in the QR link.
          </p>
        ) : !isValidAddress ? (
          <p className="mt-3 text-sm text-slate-300/70">
            ❌ Invalid wallet address format.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-300/70">
              This QR indicates the document was issued by this wallet.
            </p>

            <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-slate-300/70">Wallet Address</div>
              <code className="mt-2 block break-all text-sm text-slate-100/90">
                {address}
              </code>

              <div className="mt-4 text-xs text-slate-300/70">Network</div>
              <div className="mt-2 text-sm text-slate-100/90">
                {network === "sepolia"
                  ? `Sepolia (chainId ${sepolia.id})`
                  : network}
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
              ✅ Issuer identity extracted from QR.
              <div className="mt-2 text-xs text-slate-300/70">
                For tamper-proof verification of a specific file, use a Document
                QR containing fileHash + txHash.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
