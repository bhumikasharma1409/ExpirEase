import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: { type: String, required: true },
  category: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  daysBeforeExpiry: { type: Number, enum: [0, 1, 3, 7], required: true },
  channel: { type: String, enum: ['inApp', 'email'], required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], required: true },
  message: { type: String, required: true },
  readAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  failureReason: { type: String, default: '' },
}, { timestamps: true });

notificationSchema.index(
  { userId: 1, productId: 1, expiryDate: 1, daysBeforeExpiry: 1, channel: 1 },
  { unique: true },
);
notificationSchema.index({ userId: 1, channel: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
