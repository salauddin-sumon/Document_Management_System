import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['admin', 'zm_hos', 'back_office', 'staff'];

// Admins log in with email; ZM/HOS and staff log in with their staff ID.
const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    staffId: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    designation: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, default: 'staff' },
  },
  { timestamps: true }
);

userSchema.pre('validate', function () {
  if (this.role === 'admin' && !this.email) this.invalidate('email', 'Email is required for admin');
  if (this.role !== 'admin' && !this.staffId) this.invalidate('staffId', 'Staff ID is required');
});

// Hash the password whenever it is set or changed
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
