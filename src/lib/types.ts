// ─── Core Types ──────────────────────────────────────────────

export type CorrectionMode = "additive" | "subtractive" | "manual";

export interface Task {
  id: string;
  label: string;
  maxPoints: number;
  mode: CorrectionMode;
}

export interface Annotation {
  id: string;
  taskId: string;
  stampId: string;
  page: number;
  x: number; // percentage 0–100
  y: number; // percentage 0–100
  points: number;
  label: string;
  description: string;
  isPointStamp: boolean;
}

export interface CommentStamp {
  id: string;
  label: string;
  description: string;
  points: number;
  sign: "positive" | "negative";
}

export interface PdfGrading {
  annotations: Annotation[];
  manualPoints: Record<string, number>; // taskId → points
}

export interface ProjectConfig {
  name: string;
  tasks: Task[];
  stamps: CommentStamp[];
  grading: Record<string, PdfGrading>; // filename → grading data
}

export interface RecentFolder {
  path: string;
  name: string;
  date: string;
}

export interface PdfFile {
  filename: string;
  path: string;
}

// ─── Stamp Selection ─────────────────────────────────────────

export interface ActiveStamp {
  id: string;
  points: number;
  label?: string;
  description?: string;
}
