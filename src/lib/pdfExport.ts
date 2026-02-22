import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import { writeFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { Annotation, Task } from "./types";

interface ExportOptions {
  pdfBytes: Uint8Array;
  annotations: Annotation[];
  filename: string;
}

export async function createAnnotatedPdf({
  pdfBytes,
  annotations,
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
          color: rgb(1, 1, 1),
        });
      });
    }
  }

  return pdfDoc.save();
}

function wrapText(
  text: string,
  maxWidth: number,
  _font: PDFFont,
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

async function ensureGradedDir(outputDir: string): Promise<string> {
  const gradedDir = await join(outputDir, "graded");
  const dirExists = await exists(gradedDir);
  if (!dirExists) {
    await mkdir(gradedDir, { recursive: true });
  }
  return gradedDir;
}

export async function savePdfToFolder(
  bytes: Uint8Array,
  outputDir: string,
  filename: string
): Promise<void> {
  const gradedDir = await ensureGradedDir(outputDir);
  const outPath = await join(gradedDir, filename);
  await writeFile(outPath, bytes);
}

export interface ReportEntry {
  filename: string;
  annotations: Annotation[];
}

export function generateMarkdownReport(
  entries: ReportEntry[],
  tasks: Task[]
): string {
  const lines: string[] = ["# Grading Report", ""];

  for (const task of tasks) {
    lines.push(`## ${task.label} (Max: ${task.maxPoints} points)`, "");

    let hasContent = false;
    for (const entry of entries) {
      const taskAnnotations = entry.annotations.filter(
        (a) => a.taskId === task.id
      );
      if (taskAnnotations.length === 0) continue;
      hasContent = true;
      lines.push(`### ${entry.filename}`, "");
      for (const ann of taskAnnotations) {
        const pointsStr =
          ann.points > 0 ? `+${ann.points}` : `${ann.points}`;
        const desc = ann.description ? `: ${ann.description}` : "";
        lines.push(`- ${ann.label} (${pointsStr})${desc}`);
      }
      lines.push("");
    }

    if (!hasContent) {
      lines.push("No comments for this task.", "");
    }
  }

  return lines.join("\n");
}

export async function saveMarkdownReport(
  outputDir: string,
  content: string
): Promise<void> {
  const gradedDir = await ensureGradedDir(outputDir);
  const outPath = await join(gradedDir, "report.md");
  const encoder = new TextEncoder();
  await writeFile(outPath, encoder.encode(content));
}
