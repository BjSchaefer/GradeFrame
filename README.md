<div align="center">

# GradeFrame

**The fast, lightweight PDF grading tool for universities.**

Grade exams, exercise sheets, and student submissions — directly on the PDF.
No cloud. No subscriptions. Just open a folder and start correcting.

[![macOS](https://img.shields.io/badge/macOS-Download-000?logo=apple&logoColor=white)](https://github.com/BjSchaefer/gradeframe/releases/latest/download/GradeFrame_universal.dmg)
[![Windows](https://img.shields.io/badge/Windows-Download-0078D4?logo=windows&logoColor=white)](https://github.com/BjSchaefer/gradeframe/releases/latest/download/GradeFrame_x64-setup.exe)
[![Linux (.deb)](https://img.shields.io/badge/Linux%20.deb-Download-FCC624?logo=linux&logoColor=black)](https://github.com/BjSchaefer/gradeframe/releases/latest/download/GradeFrame_amd64.deb)
[![Linux (.AppImage)](https://img.shields.io/badge/Linux%20.AppImage-Download-FCC624?logo=linux&logoColor=black)](https://github.com/BjSchaefer/gradeframe/releases/latest/download/GradeFrame_amd64.AppImage)

[All releases & changelogs →](https://github.com/BjSchaefer/gradeframe/releases)

</div>

---

## Why GradeFrame?

Correcting stacks of student PDFs shouldn't mean juggling browser tabs, clunky
annotation tools, or manual spreadsheets. **GradeFrame** gives you a
purpose-built desktop app that keeps everything in one place — tasks, point
stamps, comments, and final export — so you can focus on what matters:
giving good feedback.

- **Works offline** — no account, no cloud upload, no data leaves your machine.
- **Blazing fast** — built with [Tauri](https://tauri.app), React, and Rust;
  starts in under a second and stays snappy even with large PDFs.
- **Cross-platform** — native builds for macOS, Windows, and Linux.

What's more, a **generated report** collects all feedback in one file - so the lecturer has a one glance overview on strengths and weaknesses in the course.

---

## Features at a Glance

| Feature | Description |
|---|---|
| **Tasks** | Define tasks (e.g. *Task 1 – 10 pts*) with per-task max points. |
| **Correction mode** | For each task a correction is mode is chosen: **additive** = total points are the sum of assigned points; **negative** = total points are *max* minus missed points, **manual** = manual. |
| **Point stamps** | One-click stamps assign points to selected tasks. Stamps appear directly on the PDF page. |
| **Comment stamps** | Create reusable comment annotations with a label, description, and associated point value. Perfect for recurring feedback. |
| **Points summary table** | A draggable, scalable summary table rendered on page 1 of each PDF — shows per-task and total points at a glance. |
| **Export** | Export the annotated submissions and the points table burned in. Exported files are saved to a `graded/` subfolder. |
| **Report** | All comments are collected in one report. If three students made the same mistake, you see it instantly. |

---

## Quick Start

1. **Download & install** GradeFrame for your platform using the badges above.
2. **Launch** the app and click **Open Folder…**.
3. **Select a directory** containing the student PDF files you want to grade.
4. **Define tasks** in the right-hand panel (e.g. *Task 1 — 10 pts, subtractive*).
5. **Select a stamp** (point value or comment) from the left-hand palette, then **click on the PDF** to place it.
6. **Export** — hit the Export button to generate annotated PDFs and a grading report in the `graded/` subfolder.

```
YourFolder/
├── gradeframe.config.json   ← auto-managed by GradeFrame
├── Student_A.pdf
├── Student_B.pdf
├── ...
└── graded/                  ← generated on export
    ├── Student_A.pdf
    ├── Student_B.pdf
    └── report.md
```

---

## Building from Source

<details>
<summary>Prerequisites</summary>

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- Platform-specific Tauri dependencies:
  - **macOS** — Xcode Command Line Tools (`xcode-select --install`)
  - **Windows** — [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) & WebView2
  - **Linux** — `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`

</details>

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

---

## Project Structure

```
gradeframe/
├── src/                    # React + TypeScript frontend
│   ├── components/         # UI components (Editor, PdfViewer, StampPalette, …)
│   ├── lib/                # Business logic — config I/O, PDF export, types
│   ├── App.tsx             # App entry & routing
│   └── main.tsx            # Vite entry point
├── src-tauri/              # Tauri / Rust backend
│   ├── src/                # Rust source
│   └── tauri.conf.json     # App metadata & window config
└── package.json
```

---

<div align="center">
  <sub>Built with <a href="https://tauri.app">Tauri</a> · <a href="https://react.dev">React</a> · <a href="https://www.typescriptlang.org">TypeScript</a> · <a href="https://www.rust-lang.org">Rust</a></sub>
</div>
