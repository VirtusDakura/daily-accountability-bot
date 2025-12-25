/**
 * Scheduler Service - Multi-user reminders using node-cron
 * Sends personalized morning motivation and evening check-ins
 */

import cron from 'node-cron';
import { sendMessage } from './whatsapp.js';
import {
    getUsersForMorningReminder,
    getUsersForEveningReminder,
    markMorningReminderSent,
    markEveningReminderSent
} from './storage.js';
import { formatStreakEmoji, getTodayDate } from '../utils/helpers.js';
import { getQuoteOfTheDay } from '../utils/quotes.js';

/**
 * Send morning motivational message to a user
 * @param {Object} user - User document
 */
async function sendMorningReminder(user) {
    const quote = getQuoteOfTheDay();
    const name = user.name || 'Coder';
    const emoji = formatStreakEmoji(user.currentStreak);

    let streakMessage = '';
    if (user.currentStreak > 0) {
        streakMessage = `\n${emoji} You're on a *${user.currentStreak}-day streak*! Don't break the chain!`;
    }

    const message = `🌅 *Good Morning, ${name}!*
${streakMessage}

💡 *Quote of the Day:*
_"${quote}"_

🚀 Make today count! Even 15 minutes of coding adds up.

Have a productive day! 💪`;

    try {
        await sendMessage(user.phone, message);
        await markMorningReminderSent(user.phone, getTodayDate());
        console.log(`[Scheduler] Morning reminder sent to ${user.phone}`);
    } catch (error) {
        console.error(`[Scheduler] Failed to send morning reminder to ${user.phone}:`, error.message);
    }
}

/**
 * Send evening check-in message to a user
 * @param {Object} user - User document
 */
async function sendEveningReminder(user) {
    const name = user.name || 'there';
    const emoji = formatStreakEmoji(user.currentStreak);

    let streakWarning = '';
    if (user.currentStreak > 0) {
        streakWarning = `\n${emoji} Your *${user.currentStreak}-day streak* is waiting!\n`;
    }

    const message = `🌙 *Evening Check-in, ${name}!*
${streakWarning}
Did you code or learn something new today?

Reply:
• *yes* - I coded today ✅
• *no* - I didn't code today ❌

Every day counts! 📈`;

    try {
        await sendMessage(user.phone, message);
        await markEveningReminderSent(user.phone, getTodayDate());
        console.log(`[Scheduler] Evening reminder sent to ${user.phone}`);
    } catch (error) {
        console.error(`[Scheduler] Failed to send evening reminder to ${user.phone}:`, error.message);
    }
}

/**
 * Check and send reminders for all users
 * Runs every minute to check who needs reminders
 */
async function checkAndSendReminders() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = getTodayDate();

    // Get users needing morning reminder
    const morningUsers = await getUsersForMorningReminder(currentTime, today);
    for (const user of morningUsers) {
        await sendMorningReminder(user);
    }

    // Get users needing evening reminder
    const eveningUsers = await getUsersForEveningReminder(currentTime, today);
    for (const user of eveningUsers) {
        await sendEveningReminder(user);
    }

    if (morningUsers.length > 0 || eveningUsers.length > 0) {
        console.log(`[Scheduler] Sent ${morningUsers.length} morning, ${eveningUsers.length} evening reminders at ${currentTime}`);
    }
}

/**
 * Initialize the scheduler
 * Runs every minute to check for users needing reminders
 */
export function initScheduler() {
    // Run every minute to check for reminders
    cron.schedule('* * * * *', async () => {
        try {
            await checkAndSendReminders();
        } catch (error) {
            console.error('[Scheduler] Error checking reminders:', error.message);
        }
    });

    console.log('[Scheduler] Multi-user reminder scheduler initialized');
    console.log('[Scheduler] Checking for reminders every minute');
}

/**
 * Send a test reminder (for debugging)
 * @param {string} phone - Phone number to test
 * @param {string} type - 'morning' or 'evening'
 */
export async function sendTestReminder(phone, type = 'morning') {
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ phone });

    if (!user) {
        console.log('[Scheduler] User not found for test reminder');
        return;
    }

    if (type === 'morning') {
        await sendMorningReminder(user);
    } else {
        await sendEveningReminder(user);
    }
}
