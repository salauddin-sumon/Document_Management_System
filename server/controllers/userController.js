import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { publicUser } from './authController.js';

// GET /api/users  (admin)
export const getUsers = async (req, res) => {
  const users = await User.find().sort({ role: 1, createdAt: -1 });
  res.json(users.map(publicUser));
};

// POST /api/users  (admin)
// Admin accounts need an email; ZM/HOS and staff accounts need a staff ID.
export const createUser = async (req, res) => {
  const { name, email, staffId, designation, password, role } = req.body;
  const data = { name, designation, password, role };
  if (role === 'admin') data.email = email;
  else data.staffId = staffId;

  const user = await User.create(data);
  res.status(201).json(publicUser(user));
};

// PUT /api/users/:id  (admin) — edit login ID, name, designation, role, or reset password
export const updateUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const { name, designation, role, password, staffId, email } = req.body;
  if (user.role === 'admin' && email) user.email = email;
  if (user.role !== 'admin' && staffId) user.staffId = staffId;
  if (name !== undefined) user.name = name;
  if (designation !== undefined) user.designation = designation;
  if (password) user.password = password;
  if (role && role !== user.role) {
    if (user._id.equals(req.user._id)) throw new AppError('You cannot change your own role', 400);
    // Switching between admin and non-admin would change how they log in
    if ((role === 'admin') !== (user.role === 'admin')) {
      throw new AppError('Cannot switch between admin and non-admin. Create a new account instead.', 400);
    }
    user.role = role;
  }

  await user.save();
  res.json(publicUser(user));
};

// DELETE /api/users/:id  (admin)
export const deleteUser = async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new AppError('You cannot delete your own account', 400);
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  res.json({ message: 'User deleted' });
};
