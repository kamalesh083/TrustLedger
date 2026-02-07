export function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "") // remove zero-width chars
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
