// Where uploaded files are kept.
//
//  - Backblaze B2: used when B2_ENDPOINT, B2_BUCKET, B2_KEY_ID and B2_APP_KEY are set in .env.
//    B2 speaks the S3 protocol, so we use Amazon's official S3 client.
//  - Local disk (server/uploads): used otherwise — handy for development.
//
// The rest of the app only calls putObject / getObject / deleteObject, so switching
// storage never touches the controllers.
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

export const UPLOAD_DIR = path.join(import.meta.dirname, '..', 'uploads');

const b2Config = () => {
  const { B2_ENDPOINT, B2_BUCKET, B2_KEY_ID, B2_APP_KEY } = process.env;
  if (!B2_ENDPOINT || !B2_BUCKET || !B2_KEY_ID || !B2_APP_KEY) return null;
  const host = B2_ENDPOINT.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return {
    // "s3.us-east-005.backblazeb2.com" → https://…; a full http(s):// URL is used as given
    url: /^https?:\/\//.test(B2_ENDPOINT) ? B2_ENDPOINT.replace(/\/+$/, '') : `https://${host}`,
    bucket: B2_BUCKET,
    region: (host.startsWith('s3.') && host.split('.')[1]) || 'us-east-005', // s3.<region>.backblazeb2.com
    keyId: B2_KEY_ID,
    appKey: B2_APP_KEY,
  };
};

let client = null;
const s3 = () => {
  if (!client) {
    const cfg = b2Config();
    client = new S3Client({
      endpoint: cfg.url,
      region: cfg.region,
      forcePathStyle: true, // https://endpoint/bucket/file — supported by B2 and every S3 service
      credentials: { accessKeyId: cfg.keyId, secretAccessKey: cfg.appKey },
      // Only send checksums when required; keeps S3-compatible services like B2 happy
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }
  return client;
};

export const usingB2 = () => Boolean(b2Config());

export const describeStorage = () =>
  usingB2() ? `Backblaze B2 (bucket "${b2Config().bucket}")` : `local disk (${UPLOAD_DIR})`;

// Save a file under `key` (the unique file name stored in MongoDB)
export const putObject = async (key, buffer, mimeType) => {
  if (usingB2()) {
    await s3().send(
      new PutObjectCommand({ Bucket: b2Config().bucket, Key: key, Body: buffer, ContentType: mimeType })
    );
  } else {
    await fsp.mkdir(UPLOAD_DIR, { recursive: true });
    await fsp.writeFile(path.join(UPLOAD_DIR, key), buffer);
  }
};

// Read a file as a stream. Returns null if it doesn't exist.
export const getObject = async (key) => {
  if (usingB2()) {
    try {
      const out = await s3().send(new GetObjectCommand({ Bucket: b2Config().bucket, Key: key }));
      return { stream: out.Body, size: out.ContentLength };
    } catch (err) {
      if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) return null;
      throw err;
    }
  }
  const file = path.join(UPLOAD_DIR, key);
  try {
    const { size } = await fsp.stat(file);
    return { stream: fs.createReadStream(file), size };
  } catch {
    return null;
  }
};

// Delete a file; does nothing if it's already gone
export const deleteObject = async (key) => {
  if (usingB2()) {
    await s3().send(new DeleteObjectCommand({ Bucket: b2Config().bucket, Key: key }));
  } else {
    await fsp.unlink(path.join(UPLOAD_DIR, key)).catch(() => {});
  }
};
