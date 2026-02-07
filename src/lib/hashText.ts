export async function hashTextSHA256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = enc.encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const bytes = Array.from(new Uint8Array(hashBuf));
  return "0x" + bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
}
