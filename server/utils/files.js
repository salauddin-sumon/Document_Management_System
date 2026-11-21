import path from 'path';
import crypto from 'crypto';
import AppError from './AppError.js';
import { putObject, getObject, deleteObject } from './storage.js';

// Save an uploaded file (from multer) to storage under a new unique name.
// Returns the info we keep in MongoDB.
export const storeUpload = async (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const fileName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  await putObject(fileName, file.buffer, file.mimetype);
  return {
    originalName: file.originalname,
    fileName,
    mimeType: file.mimetype,
    size: file.size,
  };
};

// Delete a stored file; never fails the request if it's already gone
export const removeFile = async (fileName) => {
  if (!fileName) return;
  try {
    await deleteObject(fileName);
  } catch (err) {
    console.error(`Could not delete file ${fileName}: ${err.message}`);
  }
};

// Stream a stored file to the browser.
// inline = true opens it in the browser ("View"); otherwise it downloads.
export const sendStoredFile = async (res, info, { inline = false } = {}) => {
  const file = await getObject(info.fileName);
  if (!file) throw new AppError('File not found in storage', 404);

  const disposition = inline ? 'inline' : 'attachment';
  res.setHeader('Content-Type', info.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `${disposition}; filename*=UTF-8''${encodeURIComponent(info.originalName)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (file.size) res.setHeader('Content-Length', file.size);

  await new Promise((resolve, reject) => {
    file.stream.on('error', reject);
    res.on('finish', resolve);
    res.on('close', resolve);
    file.stream.pipe(res);
  });
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
