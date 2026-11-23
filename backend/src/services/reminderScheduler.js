import cron from 'node-cron';
import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import Product from '../models/Product.js';
import {
  addDaysToDateKey,
  dateKeyFromValue,
  getDateBoundsInTimezone,
  getDaysUntilInTimezone,
  REMINDER_TIMEZONE,
} from '../utils/expiry.js';

const inAppReminderDays = new Set([1, 3, 7]);
const emailReminderDays = [7, 3, 1, 0];
let transporter;
let schedulerTask;

export function isEmailConfigured() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;
  const port = Number(SMTP_PORT || 587);
  return Boolean(
    SMTP_HOST?.trim() &&
    Number.isInteger(port) && port > 0 && port <= 65535 &&
    SMTP_USER?.trim() &&
    SMTP_PASS &&
    EMAIL_FROM?.trim(),
  );
}

function getMailer() {
  if (!isEmailConfigured()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

function reminderMessage(product, days) {
  const when = days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`;
  return `${product.productName} (${product.category}) is set to expire ${when}.`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatExpiryDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: REMINDER_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function createEmailContent(product, user, days, message) {
  const name = escapeHtml(product.productName);
  const category = escapeHtml(product.category);
  const userName = escapeHtml(user.name);
  const expiryDate = escapeHtml(formatExpiryDate(product.expiryDate));
  const daysLabel = days === 0 ? 'Today' : `${days} ${days === 1 ? 'day' : 'days'}`;
  const subject = days === 0
    ? `Expiry reminder for today: ${product.productName}`
    : `Expiry reminder: ${product.productName}`;
  const text = [
    `Hello ${user.name},`,
    '',
    message,
    `Category: ${product.category}`,
    `Expiry date: ${formatExpiryDate(product.expiryDate)}`,
    `Days remaining: ${days}`,
    '',
    'Please plan to use this product before it expires.',
    '',
    'ExpirEase — Keep good things in circulation.',
  ].join('\n');
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:24px;background:#21182b;color:#f5f0e7;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;border:1px solid #493a52;border-radius:16px;background:#30243a">
      <tr><td style="padding:24px 28px 8px">
        <p style="margin:0;color:#c7f36b;font-size:13px;font-weight:bold;letter-spacing:2px">ExpirEase</p>
        <p style="margin:8px 0 0;color:#a99db0;font-size:11px;letter-spacing:1px">A THOUGHTFUL EXPIRY REMINDER</p>
      </td></tr>
      <tr><td style="padding:20px 28px 28px">
        <h1 style="margin:0 0 12px;color:#f5f0e7;font-size:24px;line-height:1.3">A little heads-up, ${userName}.</h1>
        <p style="margin:0 0 20px;color:#d4cad8;font-size:15px;line-height:1.6">${escapeHtml(message)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #51425a;border-radius:12px;background:#35263f">
          <tr><td style="padding:16px">
            <p style="margin:0 0 7px;color:#f5f0e7;font-size:17px;font-weight:bold">${name}</p>
            <p style="margin:0 0 14px;color:#a99db0;font-size:12px">${category}</p>
            <p style="margin:0;color:#a99db0;font-size:12px;line-height:1.8">
              Expiry date: <strong style="color:#f5f0e7">${expiryDate}</strong><br>
              Days remaining: <strong style="color:#c7f36b">${daysLabel}</strong>
            </p>
          </td></tr>
        </table>
        <p style="margin:20px 0 0;color:#d4cad8;font-size:13px;line-height:1.6">Please plan to use this product before it expires.</p>
        <p style="margin:26px 0 0;border-top:1px solid #493a52;padding-top:16px;color:#a99db0;font-size:11px;line-height:1.6">Keep good things in circulation.<br>ExpirEase</p>
      </td></tr>
    </table>
  </body>
</html>`;
  return { subject, text, html };
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

async function reserveEmailDelivery(product, days, message) {
  const identity = {
    userId: product.userId._id,
    productId: product._id,
    expiryDate: product.expiryDate,
    daysBeforeExpiry: days,
    channel: 'email',
  };
  try {
    return await Notification.create({
      ...identity,
      productName: product.productName,
      category: product.category,
      status: 'pending',
      message,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
  }

  const previous = await Notification.findOne(identity).lean();
  if (!previous || previous.status !== 'failed') return null;
  return Notification.findOneAndUpdate(
    { ...identity, status: 'failed' },
    { $set: { status: 'pending', failureReason: '', message } },
    { new: true },
  );
}

async function sendEmailReminder(product, days, message, mailer) {
  const delivery = await reserveEmailDelivery(product, days, message);
  if (!delivery) return;

  const content = createEmailContent(product, product.userId, days, message);
  try {
    const result = await mailer.sendMail({
      from: process.env.EMAIL_FROM,
      to: product.userId.email,
      ...content,
    });
    const accepted = (result.accepted || []).some((recipient) => {
      const address = typeof recipient === 'string' ? recipient : recipient.address;
      return typeof address === 'string' && address.toLowerCase() === product.userId.email.toLowerCase();
    });
    if (!accepted) throw new Error('SMTP provider did not accept the recipient address.');
  } catch (error) {
    await Notification.updateOne(
      { _id: delivery._id, status: 'pending' },
      { $set: { status: 'failed', failureReason: String(error?.message ?? error).slice(0, 500) } },
    );
    console.error(`Expiry email reminder failed for product ${product._id}: ${error?.message ?? error}`);
    return;
  }

  await Notification.updateOne(
    { _id: delivery._id, status: 'pending' },
    { $set: { status: 'sent', sentAt: new Date(), failureReason: '' } },
  );
  console.info(`Expiry email reminder accepted for product ${product._id}.`);
}

function wasAddedBeforeMilestone(product, days) {
  const expiryKey = dateKeyFromValue(product.expiryDate);
  const milestoneDateKey = expiryKey && addDaysToDateKey(expiryKey, -days);
  if (!milestoneDateKey) return false;
  const milestoneAtNineAm = new Date(`${milestoneDateKey}T09:00:00+05:30`);
  return product.createdAt instanceof Date && product.createdAt <= milestoneAtNineAm;
}

export async function runReminderCheck() {
  const { today, eighthDay } = getDateBoundsInTimezone();
  const products = await Product.find({
    isConsumed: false,
    isDiscarded: false,
    expiryDate: { $gte: today, $lt: eighthDay },
  }).populate('userId', 'name email notificationPreferences reminderPreferences');

  const mailer = getMailer();
  if (!mailer && products.some((product) => product.userId?.notificationPreferences?.email)) {
    console.warn('SMTP is not fully configured; opted-in expiry reminder emails were not sent.');
  }

  for (const product of products) {
    const account = product.userId;
    if (!account) continue;

    try {
      const days = getDaysUntilInTimezone(product.expiryDate);
      if (days === null || days < 0 || days > 7) continue;
      const message = reminderMessage(product, days);

      if (account.notificationPreferences?.inApp !== false && inAppReminderDays.has(days)) {
        try {
          await saveInAppReminder(product, days, message);
        } catch (error) {
          console.error(`In-app expiry reminder failed for product ${product._id}: ${error.message}`);
        }
      }

      if (
        account.notificationPreferences?.email &&
        mailer &&
        emailReminderDays.includes(days) &&
        wasAddedBeforeMilestone(product, days)
      ) {
        await sendEmailReminder(product, days, message, mailer);
      }
    } catch (error) {
      console.error(`Expiry reminder processing failed for product ${product._id}: ${error.message}`);
    }
  }
}

export function startReminderScheduler() {
  if (schedulerTask) return schedulerTask;
  schedulerTask = cron.schedule('0 9 * * *', () => {
    runReminderCheck().catch((error) => {
      console.error(`Scheduled expiry reminder check failed: ${error.message}`);
    });
  }, { timezone: REMINDER_TIMEZONE });
  console.info(`Expiry reminder scheduler started for 09:00 ${REMINDER_TIMEZONE}.`);
  return schedulerTask;
}
