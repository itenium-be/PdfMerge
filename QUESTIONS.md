# Open questions

Answer what you care about; everything has a default I will run with otherwise.

## 1. Direction — answered

**A, the workbench**, with B's detail rail on the right. Mockup updated to match; B and C stay in the repo as the record.

## 2. Scope

The mockups cover merge, reorder, rotate, delete, extract, replace, split. What else is in v1?

| Feature                     | In v1? | Note                                                       |
|-----------------------------|--------|------------------------------------------------------------|
| Images (jpg/png) → PDF page | likely | cheap with pdf-lib, makes "replace a page" actually useful  |
| PDF → images (png per page) | ?      | the renderer is there anyway for thumbnails                 |
| Compress / downsample       | no     | not doable well client-side                                 |
| Page numbers / watermark    | ?      | pdf-lib does both easily                                    |
| Encrypt / decrypt           | ?      | see 4                                                       |
| Extract text                | no     |                                                             |

**Default:** merge/reorder/rotate/delete/extract/replace/split, plus images→PDF. Nothing else.

## 3. Rendering & PDF library

Plan: **pdf-lib** to write, **pdf.js** to render thumbnails, both bundled (no CDN — GitHub Pages, works offline).
pdf.js is ~1 MB gzipped and is effectively the whole weight budget. The alternative is a pdfium wasm build: heavier, better fidelity.

**Default:** pdf-lib + pdf.js, thumbnails rendered lazily and low-res in a Web Worker.

## 4. Password-protected PDFs

pdf.js opens them given a password; pdf-lib cannot load an encrypted file at all, and cannot write encryption.
"Open a protected PDF, merge it, save it unprotected" therefore needs a decrypt path pdf-lib does not have.

**Default:** detect it, say we can't open protected files, no password prompt in v1.

## 5. Limits

Everything is in memory: a 200 MB scan is a tab crash, not an error message.

**Default:** soft-warn above 100 MB per file or 500 pages total, then continue anyway.

## 6. Does work survive a reload?

Files can't ride in the URL hash the way the QR design does. IndexedDB could hold them.

**Default:** no persistence. Reload = empty workbench, with a line explaining that the files never left the tab.

## 7. Downloading several outputs

Split gives n files, and browsers block the second and later sequential downloads.

**Default:** zip them (fflate, ~10 KB) when there is more than one output; a single output downloads as a plain PDF.

## 8. What gets dropped on merge

pdf-lib's `copyPages` keeps page content and most annotations, but **form fields, bookmarks/outlines and attachments do not survive**.
Silently losing a filled-in form is how a tool loses trust.

**Default:** detect forms/bookmarks in the input and warn before saving.

## 9. Verification bar

QRGenerator's rule is "decode it before you offer it". The PDF equivalent I would test against: rebuild the output, re-parse it,
assert page count, page order (per-page content hash matches the source page it came from) and rotation.

**Confirm this is the bar** — it decides how much test infrastructure this needs.

## 10. Naming & chrome

- The repo is `PdfMerge` but the tool also splits. The product name in the mockups is a placeholder (*PDF Workbench* / *PDF Studio* / *PDF Assembly*).
- Vite `base` becomes `/PdfMerge/` unless the repo gets renamed.
- Accent is **itenium orange** (`#E78200`) instead of QRGenerator's blue, since there is no user-picked colour to bind it to. Say the word for blue.
- English only, no analytics, no cookie banner — same as QRGenerator.

## 11. Mobile

Two-pane C is the weakest on a phone. Does mobile matter here, or is this a desktop job?

**Default:** it works down to 390px but is not optimised for it.
