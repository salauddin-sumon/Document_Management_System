import { Router } from 'express';
import { downloadDocument, deleteDocument } from '../controllers/documentController.js';
import { protect, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.get('/:id/download', downloadDocument);
router.delete('/:id', requireAdmin, deleteDocument);

export default router;
