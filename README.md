# GradeFrame

A lightweight desktop application for grading student PDF submissions. Built with Tauri + React + TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- System dependencies for Tauri:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/), WebView2
  - **Linux**: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

## Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

## Usage

1. Launch GradeFrame
2. Click **Open Folder…** and select a directory containing student PDF files
3. Define tasks (assignments) with maximum points in the right panel
4. Select a stamp or comment from the left panel and click on the PDF to annotate
5. Use **Export** to generate graded PDFs with burned-in annotations

## Project Structure

```
gradeframe/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── lib/                # Business logic (config, PDF export, types)
│   ├── App.tsx             # App router
│   └── main.tsx            # Entry point
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/                # Rust source
│   └── tauri.conf.json     # App configuration
└── package.json
```

## Working Directory

When you open a folder, GradeFrame creates a `gradeframe.config.json` file that stores:
- Task definitions and correction modes
- Comment stamp templates
- Annotations and points per PDF

```
YourFolder/
├── gradeframe.config.json  # Auto-managed by GradeFrame
├── Student_A.pdf
├── Student_B.pdf
└── ...
```
