# PDF Workbench by itenium

Merge PDFs, drag the pages into the order you want, cut the stack into separate files, drop what you do not need.
It runs entirely in the browser — no upload, no backend.

**[itenium-be.github.io/PdfMerge](https://itenium-be.github.io/PdfMerge/)**

| Does | Detail |
|---------------|-----------------------------------------------------------------------------------------|
| Merge         | Drop or pick several PDFs; their pages queue up on one canvas                            |
| Reorder       | Drag a page, or select several and drag them as a block                                  |
| Split         | Cut the canvas anywhere; each cut starts a new output file with its own Download button  |
| Fix pages     | Rotate or remove single pages, or a whole selection                                      |
| Detail rail   | Where the selected page came from: source file, original page number, output, rotation   |
| Verifying     | Every output is written, read back and checked (page count, size, rotation) before it downloads |
| Undo          | Ctrl+Z / Ctrl+Shift+Z over every edit                                                    |

## Commands

| | |
|-----------------|--------------------------------|
| `bun install`   | install                        |
| `bun run dev`   | dev server                     |
| `bun test`      | model, build and verify suites |
| `bun run build` | production build into `dist/`  |

## How it hangs together

`src/model` is pure page-list logic — outputs, splits, moves — and carries the test suite that matters.
`src/pdf` wraps the two libraries: pdf-lib writes and re-reads, pdf.js renders thumbnails. Both load on
demand, so the first paint costs 70 KB instead of 375 KB. `src/ui` is thin on purpose: it holds selection,
focus and undo history, and defers every decision about pages to the model.

## Mockups

Three UI directions were drawn before any code; the workbench won. They are plain HTML with no build step,
kept in [`mockups/`](mockups/) as the record — [`mockups/index.html`](mockups/index.html) compares them.
Open questions that are still open: [QUESTIONS.md](QUESTIONS.md).

Design tokens, light/dark handling and chrome follow [itenium-be/QRGenerator](https://github.com/itenium-be/QRGenerator).

offered by [itenium.be](https://itenium.be)
