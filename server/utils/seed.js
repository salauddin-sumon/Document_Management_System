// Creates the first admin account. Run: npm run seed
// Uses ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD from .env
import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';

const name = process.env.ADMIN_NAME || 'Admin';
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env first');
  process.exit(1);
}

await connectDB();

const existing = await User.findOne({ email: email.toLowerCase() });
if (existing) {
  console.log(`User ${email} already exists — nothing to do.`);
} else {
  await User.create({ name, email, password, role: 'admin' });
  console.log(`Admin created: ${email}`);
}

await mongoose.disconnect();
