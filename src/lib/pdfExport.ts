import { PDFDocument, rgb, StandardFonts, PDFString, PDFName, PDFArray } from "pdf-lib";
import { writeFile, mkdir, exists } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { Annotation, Task, PointsTableConfig } from "./types";

interface ExportOptions {
  pdfBytes: Uint8Array;
  annotations: Annotation[];
  filename: string;
  pointsTable?: {
    tasks: { label: string; points: number; maxPoints: number }[];
    config: PointsTableConfig;
  };
}

export async function createAnnotatedPdf({
  pdfBytes,
  annotations,
  pointsTable,
}: ExportOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
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
    const isNeutral = ann.points === 0;

    // Colors
    const bgColor = isNeutral
      ? rgb(0.94, 0.94, 0.94)
      : isPositive
        ? rgb(0.86, 0.96, 0.86)
        : rgb(0.96, 0.86, 0.86);
    const textColor = isNeutral
      ? rgb(0.3, 0.3, 0.3)
      : isPositive
        ? rgb(0.1, 0.45, 0.1)
        : rgb(0.6, 0.1, 0.1);
    const borderColor = isNeutral
      ? rgb(0.7, 0.7, 0.7)
      : isPositive
        ? rgb(0.3, 0.7, 0.3)
        : rgb(0.7, 0.3, 0.3);

    // Build display text – append points suffix only for comment stamps (not pure point values)
    const isLabelNumericOnly = /^[+-]?\d+(\.\d+)?$/.test(ann.label);
    const pointsStr = (ann.points !== 0 && !isLabelNumericOnly)
      ? ` ${ann.points > 0 ? '+' : ''}${ann.points}P`
      : '';
    const displayText = ann.label + pointsStr;

    // Calculate text dimensions
    const fontSize = 8;
    const textWidth = font.widthOfTextAtSize(displayText, fontSize);
    const paddingH = 4;
    const paddingV = 3;
    const boxWidth = textWidth + paddingH * 2;
    const boxHeight = fontSize + paddingV * 2;

    // Position: centered at click point
    const boxX = x - boxWidth / 2;
    const boxY = y - boxHeight / 2;

    // Background rectangle
    page.drawRectangle({
      x: boxX,
      y: boxY,
      width: boxWidth,
      height: boxHeight,
      color: bgColor,
      borderColor: borderColor,
      borderWidth: 0.5,
    });

    // Text
    page.drawText(displayText, {
      x: boxX + paddingH,
      y: boxY + paddingV,
      size: fontSize,
      font: font,
      color: textColor,
    });

    // Add PDF popup annotation if description is present
    // Icon is positioned to the right of the badge
    if (ann.description) {
      const iconSize = 12;
      const iconGap = 2;
      // NoZoom (16) + NoRotate (8) = 24
      const annotFlags = 24;
      const annotDict = pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Text', // Text annotation = clickable popup note
        Rect: [
          boxX + boxWidth + iconGap,
          boxY,
          boxX + boxWidth + iconGap + iconSize,
          boxY + iconSize,
        ],
        Contents: PDFString.of(ann.description),
        Name: 'Comment', // Icon style shown in PDF viewer
        C: isPositive ? [0.3, 0.7, 0.3] : [0.7, 0.3, 0.3],
        F: annotFlags,
      });

      const existingAnnots = page.node.lookup(PDFName.of('Annots'));
      if (existingAnnots instanceof PDFArray) {
        existingAnnots.push(pdfDoc.context.register(annotDict));
      } else {
        page.node.set(PDFName.of('Annots'), pdfDoc.context.obj([pdfDoc.context.register(annotDict)]));
      }
    }
  }

  // Draw points summary table on page 1
  if (pointsTable && pointsTable.tasks.length > 0 && pages.length > 0) {
    const firstPage = pages[0];
    const { width: pageWidth, height: pageHeight } = firstPage.getSize();
    const cfg = pointsTable.config;

    const scale = cfg.scale;
    const tableFontSize = 8 * scale;
    const padH = 4 * scale;
    const padV = 3 * scale;

    const sigmaLabel = "\u03A3";
    const totalPoints = pointsTable.tasks.reduce((s, t) => s + t.points, 0);
    const totalMax = pointsTable.tasks.reduce((s, t) => s + t.maxPoints, 0);
    const sigmaValue = `${totalPoints}/${totalMax}`;

    // Build columns: all tasks + sigma
    const columns = [
      ...pointsTable.tasks.map((t) => ({
        header: t.label,
        value: `${t.points}/${t.maxPoints}`,
      })),
      { header: sigmaLabel, value: sigmaValue },
    ];

    // Calculate cell widths based on content
    const cellWidths = columns.map((col) => {
      const labelW = font.widthOfTextAtSize(col.header, tableFontSize);
      const valueW = font.widthOfTextAtSize(col.value, tableFontSize);
      return Math.max(labelW, valueW) + padH * 2;
    });

    const cellHeight = tableFontSize + padV * 2;
    const tableX = (cfg.x / 100) * pageWidth;
    const tableTopY = pageHeight - (cfg.y / 100) * pageHeight;

    const red = rgb(0.9, 0.2, 0.2);
    const darkRed = rgb(0.6, 0.1, 0.1);
    const white = rgb(1, 1, 1);

    // Header row (red background, white text)
    let currentX = tableX;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const w = cellWidths[i];

      firstPage.drawRectangle({
        x: currentX,
        y: tableTopY - cellHeight,
        width: w,
        height: cellHeight,
        color: red,
        borderColor: darkRed,
        borderWidth: 0.5 * scale,
      });

      const textW = font.widthOfTextAtSize(col.header, tableFontSize);
      firstPage.drawText(col.header, {
        x: currentX + (w - textW) / 2,
        y: tableTopY - cellHeight + padV,
        size: tableFontSize,
        font,
        color: white,
      });

      currentX += w;
    }

    // Data row (white background, red text)
    currentX = tableX;
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const w = cellWidths[i];

      firstPage.drawRectangle({
        x: currentX,
        y: tableTopY - cellHeight * 2,
        width: w,
        height: cellHeight,
        color: white,
        borderColor: darkRed,
        borderWidth: 0.5 * scale,
      });

      const textW = font.widthOfTextAtSize(col.value, tableFontSize);
      firstPage.drawText(col.value, {
        x: currentX + (w - textW) / 2,
        y: tableTopY - cellHeight * 2 + padV,
        size: tableFontSize,
        font,
        color: darkRed,
      });

      currentX += w;
    }
  }

  return pdfDoc.save();
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
