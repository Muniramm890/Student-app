// WhatsApp-style documents: Android app me file pehle phone me download hoti hai (progress ke saath),
// phir system chooser se Google Drive PDF viewer / Files / WPS / koi bhi installed app me khulti hai.
// Browser (web/PWA) par purana behaviour: nayi tab. Ek baar download hui file dobara internet se nahi aati.
import { isNative } from "../native";

export type DocRef = { url: string; name?: string; mime?: string };

const DIR = "downloads"; // Directory.Data (app-private, koi storage permission nahi chahiye) ke andar
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

const fileName = (d: DocRef) => {
  let n = d.name || "";
  if (!n) { try { n = decodeURIComponent(baseUrl(d.url).split("/").pop() || ""); } catch { n = ""; } }
  n = (n || "document").replace(/[^\w.\- ()]+/g, "_").slice(-80);
  if (!extOf(n) && d.mime && EXT_OF_MIME[d.mime]) n += "." + EXT_OF_MIME[d.mime];
  return n;
};
export const mimeOf = (d: DocRef) => d.mime || MIME[extOf(fileName(d))] || "";
const relPath = (d: DocRef) => `${DIR}/${hash(baseUrl(d.url))}_${fileName(d)}`; // same file = same path = dobara download nahi

const inflight = new Map<string, Promise<void>>();

export const isDocDownloaded = async (d: DocRef): Promise<boolean> => {
  if (!isNative || !d.url) return false;
  try {
    const { Filesystem, Directory } = await import("@capacitor/filesystem");
    await Filesystem.stat({ path: relPath(d), directory: Directory.Data });
    return true;
  } catch { return false; }
};

export const openDocument = async (d: DocRef, onProgress?: (pct: number) => void): Promise<void> => {
  if (!d.url) throw new Error("This file is not available.");
  if (!isNative) { window.open(d.url, "_blank", "noopener"); return; }

  const key = relPath(d);
  const { Filesystem, Directory } = await import("@capacitor/filesystem");
  const { FileOpener } = await import("@capawesome-team/capacitor-file-opener");

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
        } catch (e) {
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
  try {
    await FileOpener.openFile({ path: uri, mimeType: mimeOf(d) || undefined });
  } catch {
    throw new Error("No app on this phone can open this file type. Install a viewer (for example Google Drive or a PDF reader) and try again.");
  }
};
