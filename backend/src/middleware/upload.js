import multer from 'multer';
import { AppError } from '../lib/errors.js';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

const isPdf = (b) => b.subarray(0, 5).toString('latin1') === '%PDF-';
const isPng = (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
const isJpeg = (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
const isWebp = (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';

/** Checks the bytes themselves, not just the name or the browser's claimed type. */
const KINDS = {
  pdf: { label: 'a PDF', sniff: (b) => (isPdf(b) ? 'application/pdf' : null) },
  image: { label: 'a JPG, PNG or WebP image', sniff: (b) => (isPng(b) ? 'image/png' : isJpeg(b) ? 'image/jpeg' : isWebp(b) ? 'image/webp' : null) },
};

/** Accepts optional files in the given fields, e.g. { resume: 'pdf', photo: 'image' }. */
export function uploads(fields) {
  const parse = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: Object.keys(fields).length } }).fields(
    Object.keys(fields).map((name) => ({ name, maxCount: 1 })),
  );
  return (req, res, next) =>
    parse(req, res, (err) => {
      if (err?.code === 'LIMIT_FILE_SIZE') return next(new AppError(400, 'Files must be 2 MB or smaller'));
      if (err) return next(new AppError(400, err.code === 'LIMIT_UNEXPECTED_FILE' ? `Unexpected file field "${err.field}"` : 'Could not read the upload'));
      for (const [name, kind] of Object.entries(fields)) {
        const file = req.files?.[name]?.[0];
        if (!file) continue;
        const mime = KINDS[kind].sniff(file.buffer);
        if (!mime) return next(new AppError(400, `The ${name} must be ${KINDS[kind].label}`));
        file.mimetype = mime;
      }
      next();
    });
}
