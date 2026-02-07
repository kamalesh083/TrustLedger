import { extractTextFromDocx } from "./extractDocx";
import { extractTextFromPdf } from "./extractPdf";
import { normalizeText } from "./normalizeText";
import { hashTextSHA256 } from "./hashText";

export async function getContentHash(
  file: File
): Promise<{ contentHash: string; normalizedText: string }> {
  const name = file.name.toLowerCase();

  let rawText = "";
  if (name.endsWith(".docx")) {
    rawText = await extractTextFromDocx(file);
  } else if (name.endsWith(".pdf")) {
    rawText = await extractTextFromPdf(file);
  } else if (name.endsWith(".txt")) {
    rawText = await file.text();
  } else {
    // fallback: try plain text, may be empty for binaries
    rawText = await file.text().catch(() => "");
  }

  const normalized = normalizeText(rawText);
  const contentHash = await hashTextSHA256(normalized);
  return { contentHash, normalizedText: normalized };
}
