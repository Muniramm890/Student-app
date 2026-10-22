// Documents:
//  • PDF  -> app ke andar premium PdfViewer (Android app + web, kabhi browser/bahar nahi jata)
//  • baaki (docx/xlsx/...) -> Android app me download karke system chooser (Drive/Files/WPS...), web par nayi tab
// Ek baar download hui file dobara internet se nahi aati (app-private storage).
import { isNative } from "../native";

export type DocRef = { url: string; name?: string; mime?: string; title?: string };

const DIR = "downloads"; // Directory.Data (app-private, storage permission nahi chahiye) ke andar
const MIME: Record<string, string> = {
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain", csv: "text/csv", zip: "application/zip", rar: "application/vnd.rar",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp",
  mp4: "video/mp4", mov: "video/quicktime", mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav",
};
const EXT_OF_MIME: Record<string, string> = Object.fromEntries(Object.entries(MIME).map(([e, m]) => [m, e]));

const baseUrl = (u: string) => u.split(/[?#]/)[0];
const extOf = (n: string) => (n.includes(".") ? n.split(".").pop()!.toLowerCase() : "");
const hash = (s: string) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); };

export const fileNameOf = (d: DocRef) => {
  let n = d.name || "";
  if (!n) { try { n = decodeURIComponent(baseUrl(d.url).split("/").pop() || ""); } catch { n = ""; } }
  n = (n || "document").replace(/[^\w.\- ()]+/g, "_").slice(-80);
  if (!extOf(n) && d.mime && EXT_OF_MIME[d.mime]) n += "." + EXT_OF_MIME[d.mime];
  return n;
};
export const mimeOf = (d: DocRef) => d.mime || MIME[extOf(fileNameOf(d))] || "";
export const isPdfDoc = (d: DocRef) => d.mime === "application/pdf" || extOf(d.name || "") === "pdf" || (!d.name && extOf(baseUrl(d.url)) === "pdf");
const relPath = (d: DocRef) => `${DIR}/${hash(baseUrl(d.url))}_${fileNameOf(d)}`; // same file = same path = dobara download nahi

// ── PDF viewer hook-up (PdfViewerProvider apna opener yahan register karta hai) ──
let pdfOpener: ((d: DocRef) => void) | null = null;
export const registerPdfOpener = (fn: ((d: DocRef) => void) | null) => { pdfOpener = fn; };
/** Kahin se bhi PDF app ke andar kholo (receipt, payslip, marksheet...). */
export const openPdf = (d: DocRef) => { if (pdfOpener) pdfOpener(d); else void openExternally(d); };

const inflight = new Map<string, Promise<void>>();

export const isDocDownloaded = async (d: DocRef): Promise<boolean> => {
  if (!isNative || !d.url) return false;
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    await Filesystem.stat({ path: relPath(d), directory: Directory.Data });
    return true;
  } catch { return false; }
};

// Android: file phone me download (progress ke saath) -> { path, uri }
const ensureLocal = async (d: DocRef, onProgress?: (pct: number) => void) => {
  const key = relPath(d);
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  if (!(await isDocDownloaded(d))) {
    let job = inflight.get(key);
    if (!job) {
      job = (async () => {
        const { FileTransfer } = await import("@capacitor/file-transfer");
        await Filesystem.mkdir({ path: DIR, directory: Directory.Data, recursive: true }).catch(() => {});
        const part = await Filesystem.getUri({ path: key + ".part", directory: Directory.Data });
        const handle = await FileTransfer.addListener("progress", (p: any) => {
          if (p?.type === "download" && p.url === d.url && p.contentLength > 0) onProgress?.(Math.min(99, Math.round((p.bytes / p.contentLength) * 100)));
        });
        try {
          await FileTransfer.downloadFile({ url: d.url, path: part.uri, progress: true });
          await Filesystem.rename({ from: key + ".part", to: key, directory: Directory.Data, toDirectory: Directory.Data });
        } catch {
          await Filesystem.deleteFile({ path: key + ".part", directory: Directory.Data }).catch(() => {});
          throw new Error("Could not download the file. Please check your internet connection and try again.");
        } finally { handle.remove(); }
      })().finally(() => inflight.delete(key));
      inflight.set(key, job);
    }
    await job;
  }
  onProgress?.(100);
  const { uri } = await Filesystem.getUri({ path: key, directory: Directory.Data });
  return { path: key, uri };
};

/** File ke bytes (viewer ke liye). Android: download + local read (CORS ka sawal hi nahi). Web: fetch with progress. */
export const loadDocBytes = async (d: DocRef, onProgress?: (pct: number) => void, signal?: AbortSignal): Promise<Uint8Array> => {
  if (!d.url) throw new Error("This file is not available.");
  if (isNative) {
    const { uri, path } = await ensureLocal(d, onProgress);
    const { Capacitor } = await import("@capacitor/core");
    try {
      const res = await fetch(Capacitor.convertFileSrc(uri), { signal });
      if (res.ok) return new Uint8Array(await res.arrayBuffer());
    } catch (e: any) { if (e?.name === "AbortError") throw e; }
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    const r: any = await Filesystem.readFile({ path, directory: Directory.Data });
    const bin = atob(String(r.data)); const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  let res: Response;
  try { res = await fetch(d.url, { signal, credentials: "omit" }); }
  catch (e: any) { if (e?.name === "AbortError") throw e; throw new Error("Could not load the document. Please check your internet connection and try again."); }
  if (!res.ok) throw new Error(`Could not load the document (${res.status}).`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !total) { onProgress?.(50); return new Uint8Array(await res.arrayBuffer()); }
  const reader = res.body.getReader(); const out = new Uint8Array(total); let got = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (got + value.length > out.length) { const bigger = new Uint8Array(got + value.length); bigger.set(out.subarray(0, got)); return finishStream(reader, bigger, got, value, onProgress); }
    out.set(value, got); got += value.length; onProgress?.(Math.min(99, Math.round((got / total) * 100)));
  }
  onProgress?.(100);
  return got === out.length ? out : out.slice(0, got);
};
const finishStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, buf: Uint8Array, got: number, first: Uint8Array, onProgress?: (p: number) => void) => {
  const parts: Uint8Array[] = [buf.subarray(0, got), first];
  for (;;) { const { done, value } = await reader.read(); if (done) break; parts.push(value); }
  const len = parts.reduce((n, p) => n + p.length, 0); const out = new Uint8Array(len); let o = 0;
  parts.forEach((p) => { out.set(p, o); o += p.length; }); onProgress?.(100); return out;
};

/** Android: file download karke system chooser (Drive / Files / WPS ...). Web: nayi tab. */
export const openExternally = async (d: DocRef, onProgress?: (pct: number) => void): Promise<void> => {
  if (!d.url) throw new Error("This file is not available.");
  if (!isNative) { window.open(d.url, "_blank", "noopener"); return; }
  const { uri } = await ensureLocal(d, onProgress);
  const { FileOpener } = await import("@capawesome-team/capacitor-file-opener");
  try {
    await FileOpener.openFile({ path: uri, mimeType: mimeOf(d) || undefined });
  } catch {
    throw new Error("No app on this phone can open this file type. Install a viewer (for example Google Drive or a PDF reader) and try again.");
  }
};

/** Main entry: PDF -> in-app viewer, baaki -> openExternally. */
export const openDocument = async (d: DocRef, onProgress?: (pct: number) => void): Promise<void> => {
  if (isPdfDoc(d) && pdfOpener) { pdfOpener(d); return; }
  return openExternally(d, onProgress);
};
