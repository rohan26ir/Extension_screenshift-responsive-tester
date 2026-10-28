/**
 * Standardized Client-Side PDF Document Exporter
 * Generates a clean, valid PDF 1.4 document containing the rendered canvas image.
 * Uses zero third-party dependencies, adhering strictly to the ISO 32000-1 PDF specification.
 */

export type PdfPageSize = 'a4' | 'letter' | 'legal' | 'a3';

export interface PdfPageSizePreset {
  id: PdfPageSize;
  name: string;
  dimensionsMm: string;
  widthPt: number;
  heightPt: number;
}

export const PDF_PAGE_PRESETS: Record<PdfPageSize, PdfPageSizePreset> = {
  a4: {
    id: 'a4',
    name: 'A4 (Default)',
    dimensionsMm: '210 × 297 mm',
    widthPt: 595.28,
    heightPt: 841.89,
  },
  letter: {
    id: 'letter',
    name: 'US Letter',
    dimensionsMm: '8.5 × 11 in (216 × 279 mm)',
    widthPt: 612.0,
    heightPt: 792.0,
  },
  legal: {
    id: 'legal',
    name: 'US Legal',
    dimensionsMm: '8.5 × 14 in (216 × 356 mm)',
    widthPt: 612.0,
    heightPt: 1008.0,
  },
  a3: {
    id: 'a3',
    name: 'A3',
    dimensionsMm: '297 × 420 mm',
    widthPt: 841.89,
    heightPt: 1190.55,
  },
};

/**
 * Exports an HTML canvas into a single-page PDF with standardized page dimensions,
 * proportional scale-to-fit without clipping, and clean margin centering.
 */
export async function exportCanvasToPdfBlob(
  canvas: HTMLCanvasElement,
  pageSize: PdfPageSize = 'a4',
  marginMm: number = 12
): Promise<Blob> {
  // Paint white background if canvas is transparent so JPEG stream doesn't turn transparent pixels black
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas, 0, 0);
  }

  // High-DPI JPEG encoding (0.96 quality for ultra-sharp text and borders)
  const jpegBlob = await new Promise<Blob | null>((resolve) =>
    exportCanvas.toBlob(resolve, 'image/jpeg', 0.96)
  );
  if (!jpegBlob) {
    throw new Error('Failed to generate JPEG buffer for PDF');
  }

  const jpegBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(jpegBuffer);

  const preset = PDF_PAGE_PRESETS[pageSize] || PDF_PAGE_PRESETS.a4;

  // Auto-orient page to best match the aspect ratio of the captured canvas:
  // If canvas is landscape (e.g. desktop viewport or 3-device split view), orient page in landscape.
  // If canvas is portrait (e.g. mobile device, tablet, or full-page stitch), orient page in portrait.
  const isCanvasLandscape = canvas.width > canvas.height;
  const pageW = isCanvasLandscape
    ? Math.max(preset.widthPt, preset.heightPt)
    : Math.min(preset.widthPt, preset.heightPt);
  const pageH = isCanvasLandscape
    ? Math.min(preset.widthPt, preset.heightPt)
    : Math.max(preset.widthPt, preset.heightPt);

  // Clean outer margin (default 12 mm = ~34 points)
  const marginPt = (marginMm / 25.4) * 72;
  const availW = Math.max(10, pageW - marginPt * 2);
  const availH = Math.max(10, pageH - marginPt * 2);

  // Proportional single-page fit: scale down so content fits completely on 1 page with 0 overflow
  const scale = Math.min(availW / canvas.width, availH / canvas.height);
  const destW = canvas.width * scale;
  const destH = canvas.height * scale;

  // Center the image horizontally and vertically within the page margins
  const offsetX = marginPt + (availW - destW) / 2;
  const offsetY = marginPt + (availH - destH) / 2;

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let currentOffset = 0;

  function writeString(str: string) {
    const bytes = encoder.encode(str);
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  function writeBytes(bytes: Uint8Array) {
    chunks.push(bytes);
    currentOffset += bytes.length;
  }

  function recordObjectStart(objNum: number) {
    offsets[objNum] = currentOffset;
    writeString(`${objNum} 0 obj\n`);
  }

  function recordObjectEnd() {
    writeString('endobj\n');
  }

  // 1. PDF Header (ISO 32000-1 compliant)
  writeString('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');

  // Object 1: Catalog
  recordObjectStart(1);
  writeString('<< /Type /Catalog /Pages 2 0 R >>\n');
  recordObjectEnd();

  // Object 2: Pages (Single-Page constraint: exactly 1 page)
  recordObjectStart(2);
  writeString('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\n');
  recordObjectEnd();

  // Object 3: Page (MediaBox matches the exact selected preset points)
  recordObjectStart(3);
  writeString(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\n`
  );
  recordObjectEnd();

  // Object 4: Contents (Page drawing stream with proportional scaling and centering matrix)
  // Paint solid pure-white background rectangle across the entire MediaBox first (1 1 1 rg 0 0 pageW pageH re f)
  // to guarantee a 100% white, print-ready document regardless of viewer theme or printer transparency settings.
  const contentStream =
    `q\n` +
    `1 1 1 rg\n` +
    `0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)} re\n` +
    `f\n` +
    `Q\n` +
    `q\n` +
    `${destW.toFixed(2)} 0 0 ${destH.toFixed(2)} ${offsetX.toFixed(2)} ${offsetY.toFixed(2)} cm\n` +
    `/Im1 Do\n` +
    `Q\n`;
  recordObjectStart(4);
  writeString(`<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\n`);
  recordObjectEnd();

  // Object 5: Image XObject with DCTDecode (JPEG stream at full pixel resolution)
  recordObjectStart(5);
  writeString(
    `<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`
  );
  writeBytes(jpegBytes);
  writeString('\nendstream\n');
  recordObjectEnd();

  // Cross-reference table (xref)
  const xrefOffset = currentOffset;
  writeString(`xref\n0 6\n0000000000 65535 f \n`);
  for (let i = 1; i <= 5; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    writeString(`${offStr} 00000 n \n`);
  }

  // Trailer
  writeString(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  // Concatenate all chunks into a single ArrayBuffer
  const finalPdf = new Uint8Array(currentOffset);
  let pos = 0;
  for (const chunk of chunks) {
    finalPdf.set(chunk, pos);
    pos += chunk.length;
  }

  return new Blob([finalPdf.buffer as ArrayBuffer], { type: 'application/pdf' });
}
