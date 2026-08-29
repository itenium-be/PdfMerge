# PDF tool by itenium

Merge, reorder, split and patch PDFs in the browser. No upload, no backend — it runs on GitHub Pages.

**Status: mockups only.** Three clickable UI directions live in [`mockups/`](mockups/); open
[`mockups/index.html`](mockups/index.html) to compare them. Open questions before building: [QUESTIONS.md](QUESTIONS.md).

The mockups are plain HTML — open the file, no build step. They share the design tokens, light/dark handling and
chrome of [itenium-be/QRGenerator](https://github.com/itenium-be/QRGenerator).

| File                       | Direction                                                                 |
|----------------------------|---------------------------------------------------------------------------|
| `mockups/a-workbench.html` | **Chosen.** One canvas of all pages, cut into output files                |
| `mockups/b-steps.html`     | Numbered step rail, one decision per screen (QRGenerator's layout)         |
| `mockups/c-assembly.html`  | Sources left, outputs right, built out of labelled page runs               |
