import { Router } from 'express';
import { body } from 'express-validator';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { ROLES } from '../models/User.js';
import validate from '../middleware/validate.js';

const router = Router();

router.use(protect, requireAdmin);

router
  .route('/')
  .get(getUsers)
  .post(
    [
      body('role').isIn(ROLES).withMessage('Invalid role'),
      body('email')
        .if(body('role').equals('admin'))
        .isEmail()
        .withMessage('Valid email is required for admin'),
      body('staffId')
        .if(body('role').not().equals('admin'))
        .trim()
        .notEmpty()
        .withMessage('Staff ID is required'),
      body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    ],
    validate,
    createUser
  );
router
  .route('/:id')
  .put(
    [
      body('role').optional().isIn(ROLES).withMessage('Invalid role'),
      body('password')
        .optional({ values: 'falsy' })
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    ],
    validate,
    updateUser
  )
  .delete(deleteUser);

export default router;
