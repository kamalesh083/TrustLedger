import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker?url";

// @ts-ignore
(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

export async function extractTextFromPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await (pdfjsLib as any).getDocument({ data: buffer }).promise;

  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const pageText = content.items
      .map((it: any) => (typeof it.str === "string" ? it.str : ""))
      .join(" ");

    fullText += pageText + "\n";
  }
  return fullText;
}
