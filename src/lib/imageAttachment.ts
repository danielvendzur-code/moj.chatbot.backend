import type { LeadAttachment } from "./leadApi";

/* Photos come off a phone at 4-12 MB, which no serverless request body will
   take. They are downscaled and re-encoded in the browser before they ever
   leave it: the visitor waits on their own CPU instead of on an upload that
   was going to be refused. */
export const MAX_ATTACHMENTS = 3;
const MAX_EDGE = 1_600;
const TARGET_BYTES = 900_000;
/* What still goes through untouched when the browser cannot decode the file
   (HEIC on an older desktop, a PDF a visitor drops in). */
const RAW_LIMIT_BYTES = 2_400_000;
const QUALITY_STEPS = [0.82, 0.7, 0.58];

export type AttachmentError = "too-large" | "unreadable";

export class AttachmentFailure extends Error {
  readonly kind: AttachmentError;

  constructor(kind: AttachmentError) {
    super(kind);
    this.kind = kind;
  }
}

const readAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new AttachmentFailure("unreadable"));
    reader.readAsDataURL(blob);
  });

const base64Of = (dataUrl: string): string => dataUrl.slice(dataUrl.indexOf(",") + 1);

const loadBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Safari refuses some sources here but still decodes them in an <img>. */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new AttachmentFailure("unreadable"));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
};

const encode = (canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));

const renamed = (name: string): string => {
  const base = name.replace(/\.[^.]+$/, "").slice(0, 60) || "fotka";
  return `${base}.jpg`;
};

/** Turns a picked file into something the lead endpoint can carry. Throws an
 *  {@link AttachmentFailure} when even the untouched file is too big. */
export async function toAttachment(file: File): Promise<LeadAttachment> {
  const passthrough = async (): Promise<LeadAttachment> => {
    if (file.size > RAW_LIMIT_BYTES) throw new AttachmentFailure("too-large");
    return {
      filename: file.name.slice(0, 80) || "priloha",
      contentType: file.type || "application/octet-stream",
      data: base64Of(await readAsDataUrl(file)),
    };
  };

  if (!file.type.startsWith("image/")) return passthrough();

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await loadBitmap(file);
  } catch {
    return passthrough();
  }

  const width = "naturalWidth" in source ? source.naturalWidth : source.width;
  const height = "naturalHeight" in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, MAX_EDGE / Math.max(width || 1, height || 1));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  const context = canvas.getContext("2d");
  if (!context) return passthrough();
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  for (const quality of QUALITY_STEPS) {
    const blob = await encode(canvas, quality);
    if (!blob) break;
    if (blob.size <= TARGET_BYTES || quality === QUALITY_STEPS.at(-1)) {
      if (blob.size > RAW_LIMIT_BYTES) throw new AttachmentFailure("too-large");
      return {
        filename: renamed(file.name),
        contentType: "image/jpeg",
        data: base64Of(await readAsDataUrl(blob)),
      };
    }
  }

  return passthrough();
}
