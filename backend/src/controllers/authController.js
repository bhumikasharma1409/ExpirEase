import User from '../models/User.js';
import { createAuthToken } from '../utils/jwt.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    notificationPreferences: user.notificationPreferences,
    reminderPreferences: user.reminderPreferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateCredentials({ name, email, password }, includeName = false) {
  const errors = [];
  if (includeName && (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100)) {
    errors.push('Name must be between 2 and 100 characters.');
  }
  if (typeof email !== 'string' || email.trim().length > 254 || !emailPattern.test(email.trim())) {
    errors.push('Enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    errors.push('Password must be between 8 and 72 characters.');
  }
  return errors;
}

export async function register(req, res, next) {
  const { name, email, password } = req.body ?? {};
  const errors = validateCredentials({ name, email, password }, true);
  if (errors.length) {
    return res.status(400).json({ success: false, message: 'Please correct the submitted fields.', errors });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.exists({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: { token: createAuthToken(user._id), user: safeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !emailPattern.test(email.trim()) ||
      typeof password !== 'string' || password.length < 1 || Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid email address and password.',
    });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    const passwordMatches = user ? await user.comparePassword(password) : false;
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      data: { token: createAuthToken(user._id), user: safeUser(user) },
    });
  } catch (error) {
    return next(error);
  }
}

export async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    data: { user: safeUser(req.user) },
  });
}

export async function updateMe(req, res, next) {
  const body = req.body ?? {};
  const allowedFields = ['name', 'notificationPreferences', 'reminderPreferences'];
  const unknownFields = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (unknownFields.length) {
    return res.status(400).json({
      success: false,
      message: `Unsupported profile field(s): ${unknownFields.join(', ')}.`,
    });
  }

  if (!Object.keys(body).length) {
    return res.status(400).json({ success: false, message: 'Provide at least one profile or preference field.' });
  }
  if (body.name !== undefined &&
      (typeof body.name !== 'string' || body.name.trim().length < 2 || body.name.trim().length > 100)) {
    return res.status(400).json({ success: false, message: 'Name must be between 2 and 100 characters.' });
  }
  if (body.notificationPreferences !== undefined) {
    const preferences = body.notificationPreferences;
    if (!preferences || typeof preferences !== 'object' || Array.isArray(preferences) ||
        Object.keys(preferences).some((key) => !['inApp', 'email'].includes(key)) ||
        Object.values(preferences).some((value) => typeof value !== 'boolean')) {
      return res.status(400).json({
        success: false,
        message: 'Notification preferences may contain only boolean inApp and email values.',
      });
    }
  }
  if (body.reminderPreferences !== undefined) {
    const days = body.reminderPreferences?.daysBeforeExpiry;
    if (!body.reminderPreferences || typeof body.reminderPreferences !== 'object' ||
        Array.isArray(body.reminderPreferences) ||
        Object.keys(body.reminderPreferences).some((key) => key !== 'daysBeforeExpiry') ||
        !Array.isArray(days) || days.some((day) => ![1, 3, 7].includes(day)) ||
        new Set(days).size !== days.length) {
      return res.status(400).json({
        success: false,
        message: 'Reminder days must be a unique combination of 1, 3, and 7.',
      });
    }
  }

  try {
    if (body.name !== undefined) req.user.name = body.name.trim();
    if (body.notificationPreferences) {
      req.user.notificationPreferences = {
        ...(req.user.notificationPreferences?.toObject?.() ?? req.user.notificationPreferences ?? {}),
        ...body.notificationPreferences,
      };
    }
    if (body.reminderPreferences) {
      req.user.reminderPreferences = body.reminderPreferences;
    }
    await req.user.save();
    return res.status(200).json({
      success: true,
      message: 'Profile and preferences updated.',
      data: { user: safeUser(req.user) },
    });
  } catch (error) {
    return next(error);
  }
}
