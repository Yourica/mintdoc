import PizZip from "pizzip";

/**
 * Open a .docx (or any Office Open XML) buffer as a PizZip instance.
 */
export function openZip(buffer: Buffer | ArrayBuffer | Uint8Array): PizZip {
  return new PizZip(buffer);
}

/**
 * Read a file inside the ZIP archive as a UTF-8 string.
 * Returns `null` if the file does not exist.
 */
export function getFile(zip: PizZip, path: string): string | null {
  const file = zip.file(path);
  if (!file) return null;
  return file.asText();
}

/**
 * Write (or overwrite) a file inside the ZIP archive.
 */
export function setFile(zip: PizZip, path: string, content: string): void {
  zip.file(path, content);
}

/**
 * Generate the ZIP as a Node.js Buffer.
 */
export function generateZip(zip: PizZip): Buffer {
  return zip.generate({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}
