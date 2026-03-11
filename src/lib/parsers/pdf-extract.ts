/**
 * Simple PDF text extractor — works for unencrypted, text-based PDFs.
 *
 * For full PDF support (including password-protected PDFs and complex layouts),
 * install pdfjs-dist:
 *   npm install pdfjs-dist
 * Then replace this module with a pdfjs-dist based implementation.
 */
export function extractTextFromPDF(buffer: Buffer): string {
  const content = buffer.toString("latin1");

  // Extract text from PDF content streams using the Tj and TJ operators
  const lines: string[] = [];

  // Match (text)Tj pattern
  const tjMatches = content.match(/\(([^)]{0,200})\)\s*Tj/g) ?? [];
  for (const match of tjMatches) {
    const inner = match.match(/\(([^)]*)\)/)?.[1] ?? "";
    const decoded = inner.replace(/\\(\d{3})/g, (_, oct) =>
      String.fromCharCode(parseInt(oct, 8))
    ).replace(/\\\\/g, "\\").replace(/\\n/g, "\n").replace(/\\r/g, "\r");
    if (decoded.trim()) lines.push(decoded.trim());
  }

  // Match [(text)]TJ pattern (array form)
  const tjArrayMatches = content.match(/\[([^\]]{0,500})\]\s*TJ/g) ?? [];
  for (const match of tjArrayMatches) {
    const inner = match.slice(1, match.lastIndexOf("]"));
    const parts = inner.match(/\(([^)]*)\)/g) ?? [];
    const decoded = parts
      .map((p) => p.slice(1, -1))
      .join("")
      .replace(/\\(\d{3})/g, (_, oct) =>
        String.fromCharCode(parseInt(oct, 8))
      ).replace(/\\\\/g, "\\");
    if (decoded.trim()) lines.push(decoded.trim());
  }

  return lines.join("\n");
}
