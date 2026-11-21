import { Router } from 'express';
import { body } from 'express-validator';
import { updateNotice, deleteNotice } from '../controllers/noticeController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();
router.use(protect, requireAdmin);

router
  .route('/:id')
  .put(
    [
      body('title').trim().notEmpty().withMessage('Title is required'),
      body('message').trim().notEmpty().withMessage('Message is required'),
      body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    ],
    validate,
    updateNotice
  )
  .delete(deleteNotice);

export default router;
