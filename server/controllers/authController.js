import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

const sendToken = (res, user) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
  });
};

export const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  staffId: u.staffId,
  designation: u.designation,
  role: u.role,
  createdAt: u.createdAt,
});

// POST /api/auth/login  { identifier, password }
// Admins log in with their email; everyone else with their staff ID.
export const login = async (req, res) => {
  const identifier = req.body.identifier.trim();
  const query = identifier.includes('@')
    ? { email: identifier.toLowerCase(), role: 'admin' }
    : { staffId: identifier.toUpperCase(), role: { $ne: 'admin' } };

  const user = await User.findOne(query).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) {
    throw new AppError('Invalid login or password', 401);
  }
  sendToken(res, user);
  res.json(publicUser(user));
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
};

// GET /api/auth/me
export const getMe = (req, res) => {
  res.json(publicUser(req.user));
};

// PUT /api/auth/password
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new AppError('Current password is incorrect', 400);
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
};
