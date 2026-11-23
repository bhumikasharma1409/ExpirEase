import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required.'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long.'],
    maxlength: [100, 'Name cannot exceed 100 characters.'],
  },
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, 'Email cannot exceed 254 characters.'],
    match: [emailPattern, 'Enter a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [8, 'Password must be at least 8 characters long.'],
    select: false,
  },
  notificationPreferences: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
  },
  reminderPreferences: {
    daysBeforeExpiry: {
      type: [Number],
      default: [7, 3, 1],
      validate: {
        validator: (days) => days.every((day) => Number.isInteger(day) && day >= 0),
        message: 'Reminder days must be non-negative whole numbers.',
      },
    },
  },
}, {
  timestamps: true,
  toJSON: {
    transform(_document, returned) {
      delete returned.password;
      delete returned.__v;
      return returned;
    },
  },
});

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
