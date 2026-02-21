import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Annotation } from "./types";

interface ExportOptions {
  pdfBytes: Uint8Array;
  annotations: Annotation[];
  filename: string;
}

export async function createAnnotatedPdf({
  pdfBytes,
  annotations,
  filename,
}: ExportOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const ann of annotations) {
    const pageIndex = ann.page - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    // Convert percentage position to absolute coordinates
    // Note: PDF coordinate system has origin at bottom-left
    const x = (ann.x / 100) * width;
    const y = height - (ann.y / 100) * height;

    const isPositive = ann.points >= 0;
    const bgColor = isPositive ? rgb(0.16, 0.72, 0.42) : rgb(0.87, 0.25, 0.25);
    const textColor = rgb(1, 1, 1);

    // Build label text
    let labelText: string;
    if (ann.isPointStamp) {
      labelText = `${ann.points > 0 ? "+" : ""}${ann.points}`;
    } else {
      labelText = ann.label;
      if (ann.points !== 0) {
        labelText += ` (${ann.points > 0 ? "+" : ""}${ann.points})`;
      }
    }

    const labelWidth = helveticaBold.widthOfTextAtSize(labelText, 9);
    const padding = 6;
    const boxHeight = 16;
    let totalHeight = boxHeight;

    // Calculate description dimensions
    let descLines: string[] = [];
    if (ann.description) {
      descLines = wrapText(ann.description, 180, helvetica, 7);
      totalHeight += descLines.length * 10 + 4;
    }

    const boxWidth = Math.max(labelWidth + padding * 2, ann.description ? 180 + padding * 2 : 0);

    // Draw stamp background
    page.drawRectangle({
      x: x - boxWidth / 2,
      y: y - totalHeight / 2,
      width: boxWidth,
      height: totalHeight,
      color: bgColor,
      borderWidth: 0,
    });

    // Draw label
    page.drawText(labelText, {
      x: x - labelWidth / 2,
      y: y + totalHeight / 2 - boxHeight + 4,
      size: 9,
      font: helveticaBold,
      color: textColor,
    });

    // Draw description lines
    if (descLines.length > 0) {
      const descStartY = y + totalHeight / 2 - boxHeight - 2;
      descLines.forEach((line, i) => {
        page.drawText(line, {
          x: x - boxWidth / 2 + padding,
          y: descStartY - i * 10,
          size: 7,
          font: helvetica,
          color: rgb(1, 1, 1, 0.85),
        });
      });
    }
  }

  return pdfDoc.save();
}

function wrapText(
  text: string,
  maxWidth: number,
  font: ReturnType<typeof StandardFonts.Helvetica extends infer T ? never : never>,
  fontSize: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Approximate width (pdf-lib font measurement)
    const testWidth = testLine.length * fontSize * 0.5;
    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  return lines.slice(0, 4); // Max 4 lines
}

export function downloadBlob(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.replace(".pdf", "_graded.pdf");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
