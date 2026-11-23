import mongoose from 'mongoose';
import Notification from '../models/Notification.js';

export async function getNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
      channel: 'inApp',
      status: 'sent',
    })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();
    return res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(({ failureReason: _failureReason, ...notification }) => notification),
        emailConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER &&
          process.env.SMTP_PASSWORD && process.env.SMTP_FROM),
      },
    });
  } catch (error) {
    return next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Notification ID is invalid.' });
  }
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, channel: 'inApp', status: 'sent' },
      { $set: { readAt: new Date() } },
      { new: true },
    ).lean();
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
    return res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
      data: { notification },
    });
  } catch (error) {
    return next(error);
  }
}
