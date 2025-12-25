/**
 * Message Handler Service - Core bot logic
 * Processes incoming WhatsApp messages and generates responses
 * Handles onboarding, daily check-ins, and conversation flows
 */

import { sendMessage } from './whatsapp.js';
import {
    getUserData,
    setOnboardingStep,
    setUserName,
    setMorningReminderTime,
    setEveningReminderTime,
    setAwaitingResponse,
    addDailyLog,
    updateWhatCoded,
    updateLearning,
    updateStreak,
    hasRespondedToday,
    getRecentLogs,
    resetUserData
} from './storage.js';
import { getTodayDate, formatStreakEmoji, parseTime } from '../utils/helpers.js';

/**
 * Main message handler - processes incoming messages
 * @param {string} from - Sender's phone number
 * @param {string} text - Message text
 */
export async function handleMessage(from, text) {
    const user = await getUserData(from);
    const input = text.trim();
    const inputLower = input.toLowerCase();

    // Check if user is in onboarding
    if (!user.onboardingComplete) {
        await handleOnboarding(from, user, input);
        return;
    }

    // Check if we're awaiting a specific response
    if (user.awaitingResponse) {
        await handleAwaitingResponse(from, user, input);
        return;
    }

    // Route to appropriate handler based on command
    switch (inputLower) {
        case 'hi':
        case 'hello':
        case 'start':
        case 'hey':
            await handleStart(from, user);
            break;

        case 'yes':
        case 'y':
        case 'done':
        case '✅':
            await handleYes(from, user);
            break;

        case 'no':
        case 'n':
        case 'nope':
        case '❌':
            await handleNo(from, user);
            break;

        case 'status':
        case 'stats':
        case 'streak':
            await handleStatus(from, user);
            break;

        case 'summary':
        case 'report':
            await handleSummary(from);
            break;

        case 'settings':
            await handleSettings(from, user);
            break;

        case 'help':
        case '?':
            await handleHelp(from);
            break;

        case 'reset':
            await handleReset(from, user);
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
 * Handle onboarding flow for new users
 */
async function handleOnboarding(from, user, input) {
    switch (user.onboardingStep) {
        case 'welcome':
            // First interaction - welcome and ask for name
            const welcomeMsg = `👋 *Welcome to Code Accountability Bot!*

I'm here to help you build a consistent coding habit.

Every day, I'll send you:
🌅 *Morning* - A motivational reminder to code
🌙 *Evening* - A check-in to log your progress

Let's get you set up!

*What should I call you?*`;
            await sendMessage(from, welcomeMsg);
            await setOnboardingStep(from, 'ask_name');
            break;

        case 'ask_name':
            // Save name and ask for morning reminder time
            await setUserName(from, input);
            const morningMsg = `Nice to meet you, *${input}*! 🎉

Now let's set up your reminders.

*What time should I send your morning motivation?*

Reply with a time like:
• 7:00
• 08:30
• 9:00

(24-hour format works too: 07:00, 20:00)`;
            await sendMessage(from, morningMsg);
            await setOnboardingStep(from, 'ask_morning_time');
            break;

        case 'ask_morning_time':
            // Parse and save morning time
            const morningTime = parseTime(input);
            if (!morningTime) {
                await sendMessage(from, "⚠️ I couldn't understand that time. Please try again.\n\nExamples: 7:00, 08:30, 9:00 AM");
                return;
            }
            await setMorningReminderTime(from, morningTime);

            const eveningMsg = `✅ Morning reminder set for *${morningTime}*

*What time should I check in with you in the evening?*

This is when I'll ask if you coded today.

Examples: 20:00, 8:00 PM, 21:30`;
            await sendMessage(from, eveningMsg);
            await setOnboardingStep(from, 'ask_evening_time');
            break;

        case 'ask_evening_time':
            // Parse and save evening time, complete onboarding
            const eveningTime = parseTime(input);
            if (!eveningTime) {
                await sendMessage(from, "⚠️ I couldn't understand that time. Please try again.\n\nExamples: 20:00, 8:00 PM, 21:30");
                return;
            }
            await setEveningReminderTime(from, eveningTime);
            await setOnboardingStep(from, 'complete');

            const completeMsg = `🎉 *You're all set!*

📅 *Your Schedule:*
🌅 Morning motivation: *${user.morningReminderTime}*
🌙 Evening check-in: *${eveningTime}*

*Commands you can use:*
• *yes* - Log that you coded today
• *no* - Log that you didn't code
• *status* - View your streak
• *summary* - Last 7 days
• *settings* - Change reminder times
• *help* - All commands

Let's build that streak! 💪

Type *yes* or *no* to log today's coding status.`;
            await sendMessage(from, completeMsg);
            break;
    }
}

/**
 * Handle awaiting response (what coded, what learned)
 */
async function handleAwaitingResponse(from, user, input) {
    switch (user.awaitingResponse) {
        case 'what_coded':
            await updateWhatCoded(from, input);
            await setAwaitingResponse(from, 'what_learned');

            await sendMessage(from, `💻 Got it!

*What did you learn today?*
(A brief note about something new you discovered)`);
            break;

        case 'what_learned':
            await updateLearning(from, input);

            const finalMsg = `📝 *Logged!*

💻 Coded: ${user.dailyLog[user.dailyLog.length - 1]?.whatCoded || 'Yes'}
📚 Learned: "${input.substring(0, 80)}${input.length > 80 ? '...' : ''}"

${formatStreakEmoji(user.currentStreak)} Streak: *${user.currentStreak} day${user.currentStreak !== 1 ? 's' : ''}*

Keep up the great work! See you tomorrow! 🚀`;
            await sendMessage(from, finalMsg);
            break;
    }
}

/**
 * Handle start/greeting command
 */
async function handleStart(from, user) {
    const name = user.name || 'there';
    const emoji = formatStreakEmoji(user.currentStreak);

    const message = `👋 Hey ${name}! Welcome back.

${emoji} Current streak: *${user.currentStreak} day${user.currentStreak !== 1 ? 's' : ''}*

Did you code today?

• *yes* - I coded today ✅
• *no* - I didn't code today ❌
• *status* - See your stats 📊`;

    await sendMessage(from, message);
}

/**
 * Handle YES response - user coded today
 */
async function handleYes(from, user) {
    // Check if already logged today
    if (await hasRespondedToday(from)) {
        await sendMessage(from, "✅ You've already logged today. See you tomorrow! 👋\n\nType *status* to see your streak.");
        return;
    }

    // Log the day and update streak
    await addDailyLog(from, getTodayDate(), true);
    const streakInfo = await updateStreak(from, true);

    // Ask what they coded
    await setAwaitingResponse(from, 'what_coded');

    const emoji = formatStreakEmoji(streakInfo.currentStreak);

    const message = `🎉 Awesome work today!

${emoji} Streak: *${streakInfo.currentStreak} day${streakInfo.currentStreak !== 1 ? 's' : ''}*
🏆 Best: *${streakInfo.longestStreak} days*

*What did you work on today?*
(e.g., "Built a REST API", "Fixed authentication bug")`;

    await sendMessage(from, message);
}

/**
 * Handle NO response - user didn't code today
 */
async function handleNo(from, user) {
    if (await hasRespondedToday(from)) {
        await sendMessage(from, "✅ You've already logged today. See you tomorrow! 👋\n\nType *status* to see your streak.");
        return;
    }

    const previousStreak = user.currentStreak;

    await addDailyLog(from, getTodayDate(), false);
    await updateStreak(from, false);

    let message;
    if (previousStreak > 0) {
        message = `😔 That's okay, rest is important too.

Your *${previousStreak}-day* streak has been reset.

💪 Tomorrow is a fresh start!
Even 15 minutes counts.

Type *status* anytime to check your stats.`;
    } else {
        message = `👍 Thanks for being honest.

Tomorrow is a new day!
Even small steps count.

Type *status* anytime to check your stats.`;
    }

    await sendMessage(from, message);
}

/**
 * Handle status command
 */
async function handleStatus(from, user) {
    const emoji = formatStreakEmoji(user.currentStreak);
    const name = user.name || 'Coder';

    const recentLogs = await getRecentLogs(from, 7);
    const codedDays = recentLogs.filter(log => log.coded).length;
    const consistency = recentLogs.length > 0
        ? Math.round((codedDays / recentLogs.length) * 100)
        : 0;

    const message = `📊 *${name}'s Stats*

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
 * Handle summary command
 */
async function handleSummary(from) {
    const logs = await getRecentLogs(from, 7);

    if (logs.length === 0) {
        await sendMessage(from, "📋 No logs yet. Reply *yes* or *no* to start logging!");
        return;
    }

    let summary = "📋 *Last 7 Days*\n\n";

    const reversedLogs = [...logs].reverse();

    for (const log of reversedLogs) {
        const icon = log.coded ? "✅" : "❌";
        const what = log.whatCoded ? `\n   💻 ${log.whatCoded}` : "";
        const learned = log.learning ? `\n   📚 ${log.learning}` : "";
        summary += `${icon} ${log.date}${what}${learned}\n`;
    }

    const codedDays = logs.filter(l => l.coded).length;
    summary += `\n📊 Coded ${codedDays}/${logs.length} days`;

    await sendMessage(from, summary);
}

/**
 * Handle settings command
 */
async function handleSettings(from, user) {
    const message = `⚙️ *Your Settings*

👤 Name: *${user.name || 'Not set'}*
🌅 Morning reminder: *${user.morningReminderTime}*
🌙 Evening check-in: *${user.eveningReminderTime}*

To change settings, start over with onboarding:
Type *reset settings* (your streak will be preserved)

Or type *reset* to clear all data.`;

    await sendMessage(from, message);
}

/**
 * Handle help command
 */
async function handleHelp(from) {
    const message = `📚 *Commands*

*Daily Check-in:*
• *yes* - Log that you coded
• *no* - Log that you didn't

*Stats:*
• *status* - Your current streak
• *summary* - Last 7 days report

*Other:*
• *start* - Welcome message
• *settings* - View/change settings
• *reset* - Clear all data
• *help* - This message

💡 You'll get daily reminders at your chosen times!`;

    await sendMessage(from, message);
}

/**
 * Handle reset command
 */
async function handleReset(from, user) {
    if (user.currentStreak === 0 && user.longestStreak === 0) {
        await sendMessage(from, "🔄 Nothing to reset - you're starting fresh!");
        return;
    }

    const message = `⚠️ *Reset Confirmation*

This will delete:
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
    await sendMessage(from, "🔄 All data reset. Starting fresh!\n\nType *start* to begin.");
}

/**
 * Handle unknown commands
 */
async function handleFallback(from) {
    const message = `🤔 I didn't understand that.

Quick commands:
• *yes* / *no* - Daily check-in
• *status* - Your streak
• *help* - All commands`;

    await sendMessage(from, message);
}
