import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const EXT = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const newKey = (folder, ownerId, mime) => `${folder}/${ownerId}/${randomUUID()}.${EXT[mime] ?? 'bin'}`;

/** Private S3 bucket; files are read through short-lived signed links. */
export function createS3Storage({ bucket, region, accessKeyId, secretAccessKey }) {
  const s3 = new S3Client({ region, credentials: accessKeyId ? { accessKeyId, secretAccessKey } : undefined });
  return {
    async put(folder, ownerId, file) {
      const key = newKey(folder, ownerId, file.mimetype);
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: file.buffer, ContentType: file.mimetype }));
      return key;
    },
    async remove(key) {
      if (key) await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
    },
    url(key, downloadName) {
      if (!key) return Promise.resolve(null);
      const disposition = downloadName ? `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}` : undefined;
      return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key, ResponseContentDisposition: disposition }), { expiresIn: 3600 });
    },
  };
}

/** In-memory storage for tests and for running without AWS. */
export function createMemoryStorage() {
  const files = new Map();
  return {
    files,
    async put(folder, ownerId, file) {
      const key = newKey(folder, ownerId, file.mimetype);
      files.set(key, file.buffer);
      return key;
    },
    async remove(key) {
      files.delete(key);
    },
    async url(key) {
      return key ? `memory://${key}` : null;
    },
  };
}
