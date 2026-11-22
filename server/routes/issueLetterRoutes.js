import { Router } from 'express';
import { body } from 'express-validator';
import {
  getLetters,
  getLetterFilters,
  getLetter,
  createLetter,
  updateLetter,
  deleteLetter,
  downloadAttachment,
} from '../controllers/issueLetterController.js';
import { protect, authorize, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';

const router = Router();
router.use(protect); // every role can view

const required = (field, label) => body(field).trim().notEmpty().withMessage(`${label} is required`);

// BU isn't validated here: it's taken from the dealer code
const letterRules = [
  body('issueDate').isISO8601().withMessage('Valid issue date is required'),
  required('referenceNumber', 'Reference number'),
  required('dealerCode', 'Dealer code'),
  required('issuerName', 'Issuer name'),
  required('issuerStaffId', 'Issuer staff ID'),
  required('designation', 'Designation'),
  required('note', 'Note'),
];

// multer runs first so req.body is filled from the multipart form before validation
router
  .route('/')
  .get(getLetters)
  .post(authorize('admin', 'zm_hos', 'back_office'), upload.single('attachment'), letterRules, validate, createLetter);
router.get('/filters', getLetterFilters);
router
  .route('/:id')
  .get(getLetter)
  .put(requireAdmin, upload.single('attachment'), letterRules, validate, updateLetter)
  .delete(requireAdmin, deleteLetter);
router.get('/:id/attachment', downloadAttachment);

export default router;
