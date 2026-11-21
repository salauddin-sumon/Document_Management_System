import { Router } from 'express';
import { body } from 'express-validator';
import {
  getDealers,
  getMeta,
  getCodeOptions,
  lookupDealer,
  getDealer,
  createDealer,
  updateDealer,
  deleteDealer,
} from '../controllers/dealerController.js';
import { getNotices, createNotice } from '../controllers/noticeController.js';
import { getDocuments, uploadDocument } from '../controllers/documentController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { DEALER_STATUSES } from '../models/Dealer.js';
import validate from '../middleware/validate.js';
import upload from '../middleware/upload.js';

const router = Router();
router.use(protect); // every role can view; only admin can change

const required = (field, label) => body(field).trim().notEmpty().withMessage(`${label} is required`);

const ownerRules = [
  required('ownerName', 'Owner name'),
  required('mobile', 'Mobile number'),
  required('nidNumber', 'NID number'),
  required('tradeLicense', 'Trade license'),
];

// Add dealer: owner details + ONE dealer code
const createRules = [
  ...ownerRules,
  required('dealerCode', 'Dealer code'),
  required('bu', 'BU'),
  required('salesGroup', 'Sales group'),
  required('zone', 'Zone'),
  required('baseName', 'Base name'),
  body('codeOpenDate').isISO8601().withMessage('Valid code open date is required'),
];

// Edit dealer: owner details, status and the list of existing codes
const updateRules = [
  ...ownerRules,
  body('status').optional().isIn(DEALER_STATUSES).withMessage('Invalid status'),
  body('codes').isArray({ min: 1 }).withMessage('At least one dealer code is required'),
  // "codes.*" checks every item in the codes array
  required('codes.*.dealerCode', 'Dealer code'),
  required('codes.*.bu', 'BU'),
  required('codes.*.salesGroup', 'Sales group'),
  required('codes.*.zone', 'Zone'),
  required('codes.*.baseName', 'Base name'),
  body('codes.*.codeOpenDate').isISO8601().withMessage('Valid code open date is required'),
];

const noticeRules = [
  required('title', 'Title'),
  required('message', 'Message'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
];

router.get('/meta', getMeta);
router.get('/codes', getCodeOptions);
router.get('/lookup', requireAdmin, lookupDealer);
router.route('/').get(getDealers).post(requireAdmin, createRules, validate, createDealer);
router
  .route('/:id')
  .get(getDealer)
  .put(requireAdmin, updateRules, validate, updateDealer)
  .delete(requireAdmin, deleteDealer);

// Nested resources: /api/dealers/:dealerId/notices and /documents
router
  .route('/:dealerId/notices')
  .get(getNotices)
  .post(requireAdmin, noticeRules, validate, createNotice);
router
  .route('/:dealerId/documents')
  .get(getDocuments)
  .post(requireAdmin, upload.single('file'), uploadDocument);

export default router;
