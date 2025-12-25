/**
 * Scheduler Service - Daily reminder using node-cron
 * Sends a WhatsApp reminder at configured time
 */

import cron from 'node-cron';
import { sendMessage } from './whatsapp.js';
import { getUserData, hasRespondedToday } from './storage.js';
import { formatStreakEmoji } from '../utils/helpers.js';

/**
 * Get the allowed phone number for reminders
 * @returns {string|null}
 */
function getReminderPhone() {
    return process.env.ALLOWED_PHONE || null;
}

/**
 * Send daily reminder message
 */
async function sendDailyReminder() {
    const phone = getReminderPhone();

    if (!phone) {
        console.log('[Scheduler] No phone number configured for reminders');
        return;
    }

    // Don't send reminder if already responded today
    if (await hasRespondedToday(phone)) {
        console.log('[Scheduler] User already responded today, skipping reminder');
        return;
    }

    const user = await getUserData(phone);
    const streak = user.currentStreak;
    const emoji = formatStreakEmoji(streak);

    let message;
    if (streak > 0) {
        message = `⏰ *Daily Check-in*

${emoji} You're on a ${streak}-day streak!

Did you program today?

Reply:
• *yes* - I coded today ✅
• *no* - I didn't code today ❌

Don't break the chain! 🔗`;
    } else {
        message = `⏰ *Daily Check-in*

Did you program today?

Reply:
• *yes* - I coded today ✅
• *no* - I didn't code today ❌

Start building your streak! 🚀`;
    }

    try {
        await sendMessage(phone, message);
        console.log(`[Scheduler] Daily reminder sent to ${phone}`);
    } catch (error) {
        console.error('[Scheduler] Failed to send reminder:', error.message);
    }
}

/**
 * Initialize the daily reminder cron job
 * Default: 8 PM every day (configurable via REMINDER_TIME env)
 * 
 * Cron format: minute hour * * *
 * Examples:
 *   - "0 20 * * *" = 8:00 PM every day
 *   - "0 21 * * *" = 9:00 PM every day
 *   - "30 19 * * *" = 7:30 PM every day
 */
export function initScheduler() {
    // Get reminder time from env or default to 8 PM
    const reminderTime = process.env.REMINDER_TIME || '0 20 * * *';

    // Validate cron expression
    if (!cron.validate(reminderTime)) {
        console.error(`[Scheduler] Invalid cron expression: ${reminderTime}`);
        console.log('[Scheduler] Using default: 8 PM daily');
        cron.schedule('0 20 * * *', sendDailyReminder);
    } else {
        cron.schedule(reminderTime, sendDailyReminder);
    }

    console.log(`[Scheduler] Daily reminder scheduled: ${reminderTime}`);
    console.log('[Scheduler] Cron format: minute hour day month weekday');
}

/**
 * Send a test reminder (for debugging)
 */
export async function sendTestReminder() {
    console.log('[Scheduler] Sending test reminder...');
    await sendDailyReminder();
}
