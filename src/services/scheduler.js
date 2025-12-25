/**
 * Scheduler - Morning motivation & Evening accountability
 */

import cron from 'node-cron';
import { sendMessage } from './whatsapp.js';
import {
    getUsersForMorningReminder,
    getUsersForEveningReminder,
    markMorningReminderSent,
    markEveningReminderSent,
    setConversationState,
    createTodaysLog
} from './storage.js';
import { getTodayDate } from '../utils/helpers.js';
import { getQuoteOfTheDay } from '../utils/quotes.js';

/**
 * Morning reminder - Start with quote, ask how they're feeling
 */
async function sendMorningReminder(user) {
    const quote = getQuoteOfTheDay();
    const name = user.name || 'friend';

    await createTodaysLog(user.phone);

    // Personalized greeting based on streak
    let greeting;
    if (user.currentStreak >= 14) {
        greeting = `Good morning, ${name}! 🌅\n\n🔥 ${user.currentStreak} days strong! You're unstoppable.`;
    } else if (user.currentStreak >= 7) {
        greeting = `Good morning, ${name}! 🌅\n\n⚡ Week ${Math.floor(user.currentStreak / 7)} of your streak! Crushing it.`;
    } else if (user.currentStreak > 0) {
        greeting = `Good morning, ${name}! 🌅\n\nDay ${user.currentStreak + 1} of your journey. Let's go!`;
    } else {
        greeting = `Good morning, ${name}! 🌅\n\nNew day, new opportunity.`;
    }

    const message = `${greeting}

💡 _"${quote}"_

*How are you feeling today?*
(Just a word or two - energized, tired, motivated, stressed, etc.)`;

    try {
        await sendMessage(user.phone, message);
        await markMorningReminderSent(user.phone, getTodayDate());
        await setConversationState(user.phone, 'morning_mood');
        console.log(`[Morning] Sent to ${name}`);
    } catch (error) {
        console.error(`[Morning] Failed for ${user.phone}:`, error.message);
    }
}

/**
 * Evening reminder - Check in, ask how they're feeling first
 */
async function sendEveningReminder(user) {
    const name = user.name || 'friend';
    const today = getTodayDate();
    const todaysLog = user.dailyLog.find(log => log.date === today);

    // If they already completed today, skip
    if (todaysLog?.coded !== null && todaysLog?.coded !== undefined) {
        console.log(`[Evening] ${name} already logged today, skipping`);
        return;
    }

    let greeting;
    if (user.currentStreak >= 7) {
        greeting = `Hey ${name}! 🌙\n\nYour ${user.currentStreak}-day streak is waiting to grow!`;
    } else if (user.currentStreak > 0) {
        greeting = `Hey ${name}! 🌙\n\nEnd of day check-in time.`;
    } else {
        greeting = `Hey ${name}! 🌙\n\nHow was your day?`;
    }

    const message = `${greeting}

*How are you feeling right now?*
(Tired, accomplished, frustrated, happy, etc.)`;

    try {
        await sendMessage(user.phone, message);
        await markEveningReminderSent(user.phone, getTodayDate());
        await setConversationState(user.phone, 'evening_mood');
        console.log(`[Evening] Sent to ${name}`);
    } catch (error) {
        console.error(`[Evening] Failed for ${user.phone}:`, error.message);
    }
}

/**
 * Check and send reminders every minute
 */
async function checkAndSendReminders() {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const today = getTodayDate();

    try {
        const morningUsers = await getUsersForMorningReminder(currentTime, today);
        for (const user of morningUsers) {
            await sendMorningReminder(user);
        }

        const eveningUsers = await getUsersForEveningReminder(currentTime, today);
        for (const user of eveningUsers) {
            await sendEveningReminder(user);
        }
    } catch (error) {
        console.error('[Scheduler]', error.message);
    }
}

export function initScheduler() {
    cron.schedule('* * * * *', checkAndSendReminders);
    console.log('[Scheduler] Ready - checking every minute');
}
