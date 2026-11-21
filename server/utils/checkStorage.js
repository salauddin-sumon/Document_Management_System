// Checks that file storage works: uploads, reads back and deletes a small test file.
// Run: npm run storage:check
import 'dotenv/config';
import { putObject, getObject, deleteObject, describeStorage } from './storage.js';

const key = `_storage-check-${Date.now()}.txt`;
const content = `Document_Management_System storage check ${new Date().toISOString()}`;

console.log(`Storage: ${describeStorage()}`);
try {
  await putObject(key, Buffer.from(content), 'text/plain');
  console.log('✔ upload');

  const file = await getObject(key);
  if (!file) throw new Error('uploaded file could not be found again');
  const chunks = [];
  for await (const chunk of file.stream) chunks.push(chunk);
  if (Buffer.concat(chunks).toString() !== content) throw new Error('downloaded content does not match');
  console.log('✔ download');

  await deleteObject(key);
  if (await getObject(key)) throw new Error('file still exists after delete');
  console.log('✔ delete');

  console.log('\nStorage is working.');
} catch (err) {
  console.error(`\n✘ Storage check failed: ${err.name}: ${err.message}`);
  console.error(
    'Check B2_ENDPOINT, B2_BUCKET, B2_KEY_ID and B2_APP_KEY in server/.env ' +
      '(the key needs Read and Write access to this bucket).'
  );
  process.exit(1);
}
