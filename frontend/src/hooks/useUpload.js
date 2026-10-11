export const MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Client-side check before upload; the API checks the file contents again. */
export function checkFile(file, kind) {
  if (!file) return null;
  if (file.size > MAX_FILE_BYTES) return 'Files must be 2 MB or smaller';
  if (kind === 'pdf' && file.type !== 'application/pdf') return 'Upload your resume as a PDF';
  if (kind === 'image' && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return 'Use a JPG, PNG or WebP image';
  return null;
}
