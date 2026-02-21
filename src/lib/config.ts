import { readTextFile, writeTextFile, exists } from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { ProjectConfig } from "./types";

const CONFIG_FILENAME = ".config.json";

function defaultConfig(name: string): ProjectConfig {
  return {
    name,
    tasks: [],
    stamps: [],
    grading: {},
  };
}

export async function loadConfig(folderPath: string): Promise<ProjectConfig> {
  const configPath = await join(folderPath, CONFIG_FILENAME);
  const fileExists = await exists(configPath);

  if (!fileExists) {
    // Extract folder name for project name
    const parts = folderPath.replace(/\\/g, "/").split("/");
    const name = parts[parts.length - 1] || "Untitled";
    return defaultConfig(name);
  }

  try {
    const content = await readTextFile(configPath);
    const config = JSON.parse(content) as ProjectConfig;

    // Ensure all fields exist (backwards compatibility)
    return {
      name: config.name || "Untitled",
      tasks: config.tasks || [],
      stamps: config.stamps || [],
      grading: config.grading || {},
    };
  } catch (err) {
    console.error("Failed to parse .config.json:", err);
    const parts = folderPath.replace(/\\/g, "/").split("/");
    const name = parts[parts.length - 1] || "Untitled";
    return defaultConfig(name);
  }
}

export async function saveConfig(
  folderPath: string,
  config: ProjectConfig
): Promise<void> {
  const configPath = await join(folderPath, CONFIG_FILENAME);
  const content = JSON.stringify(config, null, 2);
  await writeTextFile(configPath, content);
}

export async function listPdfFiles(folderPath: string): Promise<string[]> {
  // Use Tauri's readDir to list files
  const { readDir } = await import("@tauri-apps/plugin-fs");
  const entries = await readDir(folderPath);

  return entries
    .filter(
      (entry) =>
        entry.name?.toLowerCase().endsWith(".pdf") &&
        !entry.name?.startsWith(".")
    )
    .map((entry) => entry.name!)
    .sort((a, b) => a.localeCompare(b));
}
