import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

// Requires a valid JWT cookie; attaches the user to req.user
export const protect = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) throw new AppError('Not authorized, please log in', 401);

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Session expired, please log in again', 401);
  }

  const user = await User.findById(decoded.id);
  if (!user) throw new AppError('User no longer exists', 401);

  req.user = user;
  next();
};

// Allow only the given roles, e.g. authorize('admin', 'zm_hos')
export const authorize =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new AppError('You do not have permission to do this', 403);
    }
    next();
  };

export const requireAdmin = authorize('admin');
