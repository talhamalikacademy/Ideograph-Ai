const MAX_IMPORT_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_PDF_PAGES = 200;

/**
 * Shared document parser for .TXT, .DOCX, and .PDF files used across Clipper Studio and Devil's Advocate Lab.
 */
export const parseDocument = async (file: File): Promise<string> => {
  if (file.size > MAX_IMPORT_BYTES) {
    throw new Error(
      `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum supported size is 15 MB.`
    );
  }

  let extractedText = "";

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url
    ).toString();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    if (pdf.numPages > MAX_PDF_PAGES) {
      throw new Error(
        `This PDF has ${pdf.numPages} pages (limit is ${MAX_PDF_PAGES} pages). Please upload a shorter document or paste the relevant section.`
      );
    }

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str || "")
        .join(" ")
        .trim();
      if (pageText) {
        extractedText += pageText + "\n\n";
      }
    }

    if (!extractedText.trim()) {
      throw new Error(
        "Scanned PDF detected (no selectable text layer found). Please paste the text or upload a text-based PDF/DOCX."
      );
    }
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.name.toLowerCase().endsWith(".docx")
  ) {
    const mammothModule = await import("mammoth");
    const mammothLib = mammothModule.default || mammothModule;
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammothLib.extractRawText({ arrayBuffer });
    extractedText = result.value;
  } else if (
    file.type === "text/plain" ||
    file.name.toLowerCase().endsWith(".txt") ||
    file.name.toLowerCase().endsWith(".md")
  ) {
    extractedText = await file.text();
  } else {
    throw new Error("Unsupported file format. Please upload a PDF, DOCX, or TXT file.");
  }

  const cleaned = extractedText.trim();
  if (!cleaned) {
    throw new Error("No readable text could be extracted from this file.");
  }
  return cleaned;
};
