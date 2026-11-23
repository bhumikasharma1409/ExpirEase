import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import { getDateBounds, getDaysUntil } from '../utils/expiry.js';

const reminderDays = new Set([1, 3, 7]);
let transporter;

function getMailer() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: SMTP_SECURE === 'true',
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
  }
  return transporter;
}

function reminderMessage(product, days) {
  const when = days === 1 ? 'tomorrow' : `in ${days} days`;
  return `${product.productName} (${product.category}) is set to expire ${when}.`;
}

async function saveInAppReminder(product, days, message) {
  await Notification.updateOne(
    {
      userId: product.userId._id,
      productId: product._id,
      expiryDate: product.expiryDate,
      daysBeforeExpiry: days,
      channel: 'inApp',
    },
    {
      $setOnInsert: {
        userId: product.userId._id,
        productId: product._id,
        productName: product.productName,
        category: product.category,
        expiryDate: product.expiryDate,
        daysBeforeExpiry: days,
        channel: 'inApp',
        status: 'sent',
        message,
        sentAt: new Date(),
      },
    },
    { upsert: true },
  );
}

async function saveEmailDelivery(product, days, message, mailer) {
  const identity = {
    userId: product.userId._id,
    productId: product._id,
    expiryDate: product.expiryDate,
    daysBeforeExpiry: days,
    channel: 'email',
  };
  let delivery;
  try {
    delivery = await Notification.create({
      ...identity,
      productName: product.productName,
      category: product.category,
      status: 'pending',
      message,
    });
  } catch (error) {
    if (error.code === 11000) return;
    throw error;
  }

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: product.userId.email,
      subject: `Expiry reminder: ${product.productName}`,
      text: `Hello ${product.userId.name},\n\n${message}\n\nExpirEase expiry reminder`,
    });
    await Notification.updateOne(
      { _id: delivery._id },
      { $set: { status: 'sent', sentAt: new Date() } },
    );
    console.info(`Expiry email reminder sent for product ${product._id}.`);
  } catch (error) {
    await Notification.updateOne(
      { _id: delivery._id },
      { $set: { status: 'failed', failureReason: error.message.slice(0, 500) } },
    );
    console.error(`Expiry email reminder failed for product ${product._id}: ${error.message}`);
  }
}

export async function runReminderCheck() {
  const { tomorrow: start, eighthDay: end } = getDateBounds();
  const products = await Product.find({
    isConsumed: false,
    isDiscarded: false,
    expiryDate: { $gte: start, $lt: end },
  }).populate('userId', 'name email notificationPreferences reminderPreferences');

  const mailer = getMailer();
  if (!mailer && products.some((product) => product.userId?.notificationPreferences?.email)) {
    console.warn('SMTP is not fully configured; opted-in expiry reminder emails were not sent.');
  }

  for (const product of products) {
    const account = product.userId;
    if (!account) continue;
    const days = getDaysUntil(product.expiryDate);
    const preferences = account.reminderPreferences?.daysBeforeExpiry || [7, 3, 1];
    if (!reminderDays.has(days) || !preferences.includes(days)) continue;
    const message = reminderMessage(product, days);

    if (account.notificationPreferences?.inApp !== false) {
      await saveInAppReminder(product, days, message);
    }
    if (account.notificationPreferences?.email && mailer) {
      await saveEmailDelivery(product, days, message, mailer);
    }
  }
}

export function startReminderScheduler() {
  const timezone = process.env.REMINDER_TIMEZONE || 'UTC';
  cron.schedule('0 9 * * *', () => {
    runReminderCheck().catch((error) => {
      console.error(`Scheduled expiry reminder check failed: ${error.message}`);
    });
  }, { timezone });
  console.info(`Expiry reminder scheduler started for 09:00 ${timezone}.`);
}
