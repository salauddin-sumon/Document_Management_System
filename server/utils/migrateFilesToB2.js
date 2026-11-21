// Copies files that are still in server/uploads into Backblaze B2.
// Run once after filling in the B2 settings: npm run storage:migrate
// Files are uploaded under the same name, so MongoDB doesn't need to change.
// The local copies are NOT deleted — remove them yourself once you've checked the app.
import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mime from 'mime-types';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import IssueLetter from '../models/IssueLetter.js';
import Document from '../models/Document.js';
import { putObject, getObject, usingB2, UPLOAD_DIR } from './storage.js';

if (!usingB2()) {
  console.error('B2 is not configured. Fill in B2_ENDPOINT, B2_BUCKET, B2_KEY_ID and B2_APP_KEY in server/.env first.');
  process.exit(1);
}

await connectDB();

// Every file name MongoDB knows about, with its type
const letters = await IssueLetter.find({ 'attachment.fileName': { $exists: true } }).select('attachment').lean();
const docs = await Document.find().select('fileName mimeType').lean();
const files = [
  ...letters.map((l) => ({ name: l.attachment.fileName, type: l.attachment.mimeType })),
  ...docs.map((d) => ({ name: d.fileName, type: d.mimeType })),
];

let copied = 0, already = 0, missing = 0;
for (const f of files) {
  if (await getObject(f.name)) {
    already++;
    continue;
  }
  try {
    const buffer = await fs.readFile(path.join(UPLOAD_DIR, f.name));
    await putObject(f.name, buffer, f.type || mime.lookup(f.name) || 'application/octet-stream');
    console.log(`✔ ${f.name}`);
    copied++;
  } catch {
    console.log(`✘ ${f.name} — not found in server/uploads`);
    missing++;
  }
}

console.log(`\nCopied ${copied}, already in B2 ${already}, missing locally ${missing} (of ${files.length} files).`);
await mongoose.disconnect();
