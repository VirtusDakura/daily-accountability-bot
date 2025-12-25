/**
 * Message Handler Service - Core bot logic
 * Processes incoming WhatsApp messages and generates responses
 */

import { sendMessage } from './whatsapp.js';
import {
    getUserData,
    addDailyLog,
    updateStreak,
    hasRespondedToday,
    setAwaitingLearning,
    isAwaitingLearning,
    saveLearningNote,
    getRecentLogs,
    resetUserData
} from './storage.js';
import { getTodayDate, formatStreakEmoji } from '../utils/helpers.js';

/**
 * Get the allowed phone number from env
 * @returns {string} Allowed phone number
 */
function getAllowedPhone() {
    return process.env.ALLOWED_PHONE || "";
}

/**
 * Check if a phone number is allowed to use the bot
 * @param {string} phone - Phone number to check
 * @returns {boolean}
 */
export function isAllowedUser(phone) {
    const allowed = getAllowedPhone();
    // If no allowed phone configured, allow all (for initial setup)
    if (!allowed) return true;
    return phone === allowed;
}

/**
 * Main message handler - processes incoming messages
 * @param {string} from - Sender's phone number
 * @param {string} text - Message text
 */
export async function handleMessage(from, text) {
    // Normalize input
    const input = text.trim().toLowerCase();

    // Check if user is allowed
    if (!isAllowedUser(from)) {
        await sendMessage(from, "Sorry, this bot is private. 🔒");
        return;
    }

    // Check if we're awaiting a learning response
    if (await isAwaitingLearning(from)) {
        await handleLearningInput(from, text.trim());
        return;
    }

    // Route to appropriate handler based on command
    switch (input) {
        case 'hi':
        case 'hello':
        case 'start':
        case 'hey':
            await handleStart(from);
            break;

        case 'yes':
        case 'y':
        case 'done':
        case '✅':
            await handleYes(from);
            break;

        case 'no':
        case 'n':
        case 'nope':
        case '❌':
            await handleNo(from);
            break;

        case 'status':
        case 'stats':
        case 'streak':
            await handleStatus(from);
            break;

        case 'summary':
        case 'report':
            await handleSummary(from);
            break;

        case 'help':
        case '?':
            await handleHelp(from);
            break;

        case 'reset':
            await handleReset(from);
            break;

        case 'confirm reset':
            await handleConfirmReset(from);
            break;

        default:
            await handleFallback(from);
            break;
    }
}

/**
 * Handle start/greeting command
 */
async function handleStart(from) {
    const user = await getUserData(from);
    const streak = user.currentStreak;
    const emoji = formatStreakEmoji(streak);

    const message = `👋 Hey Virtus! Welcome back.

${emoji} Current streak: ${streak} day${streak !== 1 ? 's' : ''}

Did you code today?

Reply:
• *yes* - I coded today ✅
• *no* - I didn't code today ❌
• *status* - See your stats 📊
• *help* - All commands`;

    await sendMessage(from, message);
}

/**
 * Handle YES response - user coded today
 */
async function handleYes(from) {
    // Check if already logged today
    if (await hasRespondedToday(from)) {
        await sendMessage(from, "✅ You've already logged today. See you tomorrow! 👋\n\nType *status* to see your streak.");
        return;
    }

    const user = await getUserData(from);
    const lastDate = user.lastResponseDate;

    // Log the day and update streak
    await addDailyLog(from, getTodayDate(), true);
    const streakInfo = await updateStreak(from, true, lastDate);

    // Set flag to await learning input
    await setAwaitingLearning(from, true);

    const emoji = formatStreakEmoji(streakInfo.currentStreak);

    const message = `🎉 Awesome work today!

${emoji} Streak: ${streakInfo.currentStreak} day${streakInfo.currentStreak !== 1 ? 's' : ''}
🏆 Best: ${streakInfo.longestStreak} days

📝 What did you learn or build today?
(Reply with 1-2 lines)`;

    await sendMessage(from, message);
}

/**
 * Handle NO response - user didn't code today
 */
async function handleNo(from) {
    // Check if already logged today
    if (await hasRespondedToday(from)) {
        await sendMessage(from, "✅ You've already logged today. See you tomorrow! 👋\n\nType *status* to see your streak.");
        return;
    }

    const user = await getUserData(from);
    const previousStreak = user.currentStreak;

    // Log the day and reset streak
    await addDailyLog(from, getTodayDate(), false);
    await updateStreak(from, false, user.lastResponseDate);

    let message;
    if (previousStreak > 0) {
        message = `😔 That's okay, rest is important too.

Your ${previousStreak}-day streak has been reset.

💪 Tomorrow is a new opportunity!
Get back on track and rebuild that streak.

Type *status* anytime to check your stats.`;
    } else {
        message = `👍 Thanks for being honest.

Tomorrow is a fresh start!
Even 15 minutes counts.

Type *status* anytime to check your stats.`;
    }

    await sendMessage(from, message);
}

/**
 * Handle status command - show current stats
 */
async function handleStatus(from) {
    const user = await getUserData(from);
    const emoji = formatStreakEmoji(user.currentStreak);

    // Calculate consistency (last 7 days)
    const recentLogs = await getRecentLogs(from, 7);
    const codedDays = recentLogs.filter(log => log.coded).length;
    const consistency = recentLogs.length > 0
        ? Math.round((codedDays / recentLogs.length) * 100)
        : 0;

    const message = `📊 *Your Stats*

${emoji} Current Streak: *${user.currentStreak}* day${user.currentStreak !== 1 ? 's' : ''}
🏆 Longest Streak: *${user.longestStreak}* days
📅 Last Check-in: ${user.lastResponseDate || 'Never'}
📈 7-Day Consistency: ${consistency}%

${user.currentStreak >= 7 ? "🔥 You're on fire! Keep it up!" :
            user.currentStreak > 0 ? "💪 Good progress! Stay consistent!" :
                "🚀 Start a new streak today!"}`;

    await sendMessage(from, message);
}

/**
 * Handle summary command - last 7 days report
 */
async function handleSummary(from) {
    const logs = await getRecentLogs(from, 7);

    if (logs.length === 0) {
        await sendMessage(from, "📋 No logs yet. Start by replying *yes* or *no* to today's check-in!");
        return;
    }

    let summary = "📋 *Last 7 Days Summary*\n\n";

    // Reverse to show most recent first
    const reversedLogs = [...logs].reverse();

    for (const log of reversedLogs) {
        const icon = log.coded ? "✅" : "❌";
        const learning = log.learning ? `\n   📝 ${log.learning}` : "";
        summary += `${icon} ${log.date}${learning}\n`;
    }

    const codedDays = logs.filter(l => l.coded).length;
    summary += `\n📊 Coded ${codedDays}/${logs.length} days`;

    await sendMessage(from, summary);
}

/**
 * Handle learning input after YES response
 */
async function handleLearningInput(from, text) {
    await saveLearningNote(from, text);

    const message = `📝 Noted! Great learning today.

"${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"

See you tomorrow! 💪`;

    await sendMessage(from, message);
}

/**
 * Handle help command
 */
async function handleHelp(from) {
    const message = `📚 *Available Commands*

*Daily Check-in:*
• *yes* - Log that you coded today
• *no* - Log that you didn't code

*Stats:*
• *status* - View your current streak
• *summary* - Last 7 days report

*Other:*
• *start* - Welcome message
• *reset* - Reset your streak
• *help* - This message

💡 Tip: You'll get a daily reminder at 8 PM!`;

    await sendMessage(from, message);
}

/**
 * Handle reset command - asks for confirmation
 */
async function handleReset(from) {
    const user = await getUserData(from);

    if (user.currentStreak === 0 && user.longestStreak === 0) {
        await sendMessage(from, "🔄 Nothing to reset - you're starting fresh already!");
        return;
    }

    const message = `⚠️ *Reset Confirmation*

This will reset:
• Current streak: ${user.currentStreak} days
• Longest streak: ${user.longestStreak} days
• All daily logs

Type *confirm reset* to proceed.
Any other message to cancel.`;

    await sendMessage(from, message);
}

/**
 * Handle reset confirmation
 */
async function handleConfirmReset(from) {
    await resetUserData(from);

    await sendMessage(from, "🔄 All data has been reset. Starting fresh!\n\nType *start* to begin.");
}

/**
 * Handle unknown commands - friendly fallback
 */
async function handleFallback(from) {
    const message = `🤔 I didn't understand that.

Quick commands:
• *yes* / *no* - Daily check-in
• *status* - Your streak
• *help* - All commands`;

    await sendMessage(from, message);
}
