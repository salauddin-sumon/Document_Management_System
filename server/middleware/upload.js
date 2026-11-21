import multer from 'multer';
import path from 'path';
import AppError from '../utils/AppError.js';

const ALLOWED = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.png', '.jpg', '.jpeg'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED.includes(ext)) cb(null, true);
  else cb(new AppError(`File type not allowed. Allowed: ${ALLOWED.join(', ')}`, 400));
};

// Files are kept in memory (max 10 MB) until the controller has validated the form,
// then saved with storeUpload() to Backblaze B2 or the local disk (see utils/storage.js).
export default multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
