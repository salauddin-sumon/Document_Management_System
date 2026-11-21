import { Router } from 'express';
import { body } from 'express-validator';
import { login, logout, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Staff ID or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.put(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

export default router;
