const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

const MAX_BYTES = 8 * 1024 * 1024;

export function assertUploadType(contentType: string, byteSize: number): string {
  const ext = ALLOWED_TYPES[contentType];
  if (!ext) {
    throw new Error("File type is not allowed.");
  }
  if (byteSize > MAX_BYTES) {
    throw new Error("File is too large.");
  }
  return ext;
}
