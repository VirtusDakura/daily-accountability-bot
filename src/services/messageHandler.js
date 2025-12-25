/**
 * Message Handler - Your accountability partner's brain
 * Conversational, personal, encouraging but firm
 * 
 * AI Integration Points:
 * - what_learned: AI reflects on user's learning
 * - why_not: AI acknowledges reason without judgment
 */

import { sendMessage } from './whatsapp.js';
import {
    getUserData,
    setOnboardingStep,
    setUserName,
    setMorningReminderTime,
    setEveningReminderTime,
    setConversationState,
    saveMorningMood,
    saveTodaysPlan,
    saveEveningMood,
    saveCodedResponse,
    saveWhyNot,
    saveWhatDone,
    saveWhatLearned,
    getTodaysLog,
    getRecentLogs,
    hasLoggedToday,
    canLogCompletion,
    resetUserData
} from './storage.js';
import { formatStreakEmoji, parseTime } from '../utils/helpers.js';
// AI Coach - optional, non-blocking
import { getReflectionFeedback, getEncouragement } from '../ai/coach.js';

export async function handleMessage(from, text) {
    const user = await getUserData(from);
    const input = text.trim();
    const inputLower = input.toLowerCase();

    // Onboarding
    if (!user.onboardingComplete) {
        await handleOnboarding(from, user, input);
        return;
    }

    // Conversation flow
    if (user.conversationState) {
        await handleConversation(from, user, input, inputLower);
        return;
    }

    // Commands
    switch (inputLower) {
        case 'hi':
        case 'hello':
        case 'hey':
            await handleGreeting(from, user);
            break;
        case 'yes':
        case 'y':
        case 'done':
            await handleYesCommand(from, user);
            break;
        case 'no':
        case 'n':
            await handleNoCommand(from, user);
            break;
        case 'status':
        case 'stats':
            await handleStatus(from, user);
            break;
        case 'summary':
        case 'week':
            await handleSummary(from, user);
            break;
        case 'help':
            await handleHelp(from, user);
            break;
        case 'reset':
            await handleReset(from, user);
            break;
        case 'confirm reset':
            await resetUserData(from);
            await sendMessage(from, `Fresh start! 🌱\n\nType *hi* when ready.`);
            break;
        default:
            await handleUnknown(from, user);
    }
}

// ========== ONBOARDING ==========

async function handleOnboarding(from, user, input) {
    switch (user.onboardingStep) {
        case 'welcome':
            await sendMessage(from, `Hey! 👋

Welcome to your coding accountability partner.

I'm here to help you stay consistent. Every day:
🌅 Morning - I'll ask your goal
🌙 Evening - We check if you crushed it

It's simple. It works.

*What's your first name?*`);
            await setOnboardingStep(from, 'ask_name');
            break;

        case 'ask_name':
            const name = input.split(' ')[0];
            await setUserName(from, name);
            await sendMessage(from, `Nice to meet you, ${name}! 🙌

*When do you want your morning check-in?*

This is when I'll ask about your plan for the day.

Reply like: 7:00 or 8:30 AM`);
            await setOnboardingStep(from, 'ask_morning');
            break;

        case 'ask_morning':
            const mTime = parseTime(input);
            if (!mTime) {
                await sendMessage(from, `Hmm, try: 7:00 or 8 AM`);
                return;
            }
            await setMorningReminderTime(from, mTime);
            await sendMessage(from, `Morning check-in: *${mTime}* ☀️

*When should I check if you coded?*

This should be after you're done for the day.

Reply like: 20:00 or 9 PM`);
            await setOnboardingStep(from, 'ask_evening');
            break;

        case 'ask_evening':
            const eTime = parseTime(input);
            if (!eTime) {
                await sendMessage(from, `Try: 20:00 or 8 PM`);
                return;
            }
            await setEveningReminderTime(from, eTime);
            await setOnboardingStep(from, 'complete');

            const u = await getUserData(from);
            await sendMessage(from, `Perfect ${u.name}! You're all set. 🎯

*Your Schedule:*
🌅 ${u.morningReminderTime} - What's your plan?
🌙 ${eTime} - Did you do it?

*Note:* You can only log your day complete after ${eTime} - no shortcuts! 😉

Commands:
• *status* - Your stats
• *help* - All commands

Let's build something great! 💪`);
            break;
    }
}

// ========== CONVERSATION FLOW ==========

async function handleConversation(from, user, input, inputLower) {
    switch (user.conversationState) {
        // MORNING FLOW
        case 'morning_mood':
            await saveMorningMood(from, input);
            const moodResponse = getMoodResponse(input, user.name, 'morning');
            await sendMessage(from, `${moodResponse}

*What's the ONE thing you want to accomplish today?*
(Keep it focused - one clear goal)`);
            break;

        case 'morning_plan':
            await saveTodaysPlan(from, input);
            await sendMessage(from, `📋 *Today's goal:*
_"${input}"_

I'll check in tonight to see how it went.

Go make it happen, ${user.name}! 💪`);
            break;

        // EVENING FLOW
        case 'evening_mood':
            await saveEveningMood(from, input);
            const todaysLog = await getTodaysLog(from);
            const plan = todaysLog?.todaysPlan;

            const eveningMoodResponse = getMoodResponse(input, user.name, 'evening');

            if (plan) {
                await sendMessage(from, `${eveningMoodResponse}

This morning you said you'd work on:
📋 _"${plan}"_

*Did you get it done?*
Reply *yes* or *no* - be honest!`);
            } else {
                await sendMessage(from, `${eveningMoodResponse}

*Did you write any code today?*
Reply *yes* or *no*`);
            }
            break;

        case 'evening_check':
            if (inputLower === 'yes' || inputLower === 'y') {
                await handleYes(from, user);
            } else if (inputLower === 'no' || inputLower === 'n') {
                await handleNo(from, user);
            } else {
                await sendMessage(from, `Simple question, ${user.name}:\n\nDid you code today? *yes* or *no*`);
            }
            break;

        case 'what_done':
            await saveWhatDone(from, input);
            await sendMessage(from, `Nice work! 👏

*What did you learn?*
(Even something small - every lesson counts)`);
            break;

        case 'what_learned':
            await saveWhatLearned(from, input);
            const stats = await getUserData(from);
            const emoji = formatStreakEmoji(stats.currentStreak);

            let celebration;
            if (stats.currentStreak >= 7) {
                celebration = `🔥 *${stats.currentStreak} DAYS!* You're on fire!`;
            } else if (stats.currentStreak >= 3) {
                celebration = `${emoji} *${stats.currentStreak} days* and building momentum!`;
            } else {
                celebration = `${emoji} Day *${stats.currentStreak}* complete!`;
            }

            // AI INTEGRATION: Get personalized reflection feedback
            const aiFeedback = await getReflectionFeedback(input, 'yes');

            await sendMessage(from, `${celebration}

📚 _"${input.substring(0, 80)}${input.length > 80 ? '...' : ''}"_

${aiFeedback}

Rest well, ${stats.name}. See you tomorrow! ✌️`);
            break;

        case 'why_not':
            await saveWhyNot(from, input);

            // AI INTEGRATION: Get personalized acknowledgment (non-judgmental)
            const aiAcknowledge = await getReflectionFeedback(input, 'no');

            await sendMessage(from, `${aiAcknowledge}

Tomorrow at ${user.morningReminderTime}, we start fresh.

Rest well, ${user.name}. We go again. 💪`);
            break;

        default:
            await setConversationState(from, null);
            await handleUnknown(from, user);
    }
}

// ========== COMMAND HANDLERS ==========

async function handleGreeting(from, user) {
    const emoji = formatStreakEmoji(user.currentStreak);
    const logged = await hasLoggedToday(from);

    if (logged) {
        await sendMessage(from, `Hey ${user.name}! 👋

You've already logged today. ✅
${emoji} Streak: *${user.currentStreak} days*

See you tomorrow!`);
    } else {
        const canLog = await canLogCompletion(from);
        if (canLog) {
            await sendMessage(from, `Hey ${user.name}! 👋

${emoji} Current streak: *${user.currentStreak} days*

Time to check in - did you code today?
Reply *yes* or *no*`);
            await setConversationState(from, 'evening_check');
        } else {
            await sendMessage(from, `Hey ${user.name}! 👋

${emoji} Streak: *${user.currentStreak} days*

You can log your day after ${user.eveningReminderTime}.
I'll remind you then! 📲`);
        }
    }
}

async function handleYesCommand(from, user) {
    const logged = await hasLoggedToday(from);
    if (logged) {
        await sendMessage(from, `Already logged today! ✅\n\nYour streak is safe.`);
        return;
    }

    const canLog = await canLogCompletion(from);
    if (!canLog) {
        await sendMessage(from, `Not so fast, ${user.name}! 😉

You can log your day after ${user.eveningReminderTime}.

Finish your work first, then we celebrate! 🎯`);
        return;
    }

    await handleYes(from, user);
}

async function handleNoCommand(from, user) {
    const logged = await hasLoggedToday(from);
    if (logged) {
        await sendMessage(from, `Already logged today.\n\nFresh start tomorrow!`);
        return;
    }

    const canLog = await canLogCompletion(from);
    if (!canLog) {
        await sendMessage(from, `Hold on - the day isn't over yet!

You still have time until ${user.eveningReminderTime}.

Don't give up early, ${user.name}. 💪`);
        return;
    }

    await handleNo(from, user);
}

async function handleYes(from, user) {
    const streakInfo = await saveCodedResponse(from, true);
    const todaysLog = await getTodaysLog(from);
    const plan = todaysLog?.todaysPlan;

    let message;
    if (plan) {
        message = `🎉 You did it, ${user.name}!

You said: _"${plan}"_

*What did you actually accomplish?*`;
    } else {
        message = `🎉 Great work, ${user.name}!

*What did you work on today?*`;
    }

    await sendMessage(from, message);
}

async function handleNo(from, user) {
    const streak = user.currentStreak;
    await saveCodedResponse(from, false);

    let message;
    if (streak >= 7) {
        message = `${user.name}, your *${streak}-day streak* just ended.

I'm not going to sugarcoat it - that stings.

But I won't let you dwell on it either.

*What happened today?*
(Be honest - no excuses, just facts)`;
    } else if (streak > 0) {
        message = `Streak reset, ${user.name}.

It happens. What matters is tomorrow.

*What got in the way today?*
(Understanding helps us plan better)`;
    } else {
        message = `No problem, ${user.name}.

*What stopped you from coding today?*
(No judgment, just curious)`;
    }

    await sendMessage(from, message);
}

async function handleStatus(from, user) {
    const emoji = formatStreakEmoji(user.currentStreak);
    const logs = await getRecentLogs(from, 7);
    const coded = logs.filter(l => l.coded).length;

    await sendMessage(from, `📊 *${user.name}'s Stats*

${emoji} Current: *${user.currentStreak} days*
🏆 Best: *${user.longestStreak} days*
📅 This week: ${coded}/7
💻 Total days coded: ${user.totalDaysCoded || 0}

${user.currentStreak >= 7 ? "You're crushing it! 🔥" :
            user.currentStreak > 0 ? "Building that streak! 🧱" :
                "Ready to start? 🚀"}`);
}

async function handleSummary(from, user) {
    const logs = await getRecentLogs(from, 7);

    if (!logs.length) {
        await sendMessage(from, `No logs yet, ${user.name}.\n\nLet's start building!`);
        return;
    }

    let summary = `📋 *${user.name}'s Week*\n\n`;
    for (const log of [...logs].reverse()) {
        const icon = log.coded ? "✅" : (log.coded === false ? "❌" : "⏳");
        const task = log.todaysPlan ? ` → ${log.todaysPlan.substring(0, 25)}...` : "";
        summary += `${icon} ${log.date}${task}\n`;
    }

    const coded = logs.filter(l => l.coded).length;
    summary += `\n*${coded}/${logs.length} days* 💪`;

    await sendMessage(from, summary);
}

async function handleHelp(from, user) {
    await sendMessage(from, `*${user.name}'s Commands:*

📝 *yes* - I coded today
📝 *no* - I didn't code
📊 *status* - My stats
📋 *summary* - This week
🔄 *reset* - Start over

*Schedule:*
🌅 ${user.morningReminderTime} - Plan your day
🌙 ${user.eveningReminderTime} - Log results

_Note: You can only log after ${user.eveningReminderTime}_`);
}

async function handleReset(from, user) {
    if (!user.currentStreak && !user.longestStreak) {
        await sendMessage(from, `Nothing to reset! Fresh slate ready.`);
        return;
    }

    await sendMessage(from, `⚠️ This deletes everything:
• ${user.currentStreak} day streak
• ${user.longestStreak} day record
• All history

Type *confirm reset* to proceed.`);
}

async function handleUnknown(from, user) {
    await sendMessage(from, `Not sure what you mean, ${user.name}.

Try: *yes*, *no*, *status*, or *help*`);
}

// ========== HELPERS ==========

function getMoodResponse(mood, name, timeOfDay) {
    const moodLower = mood.toLowerCase();

    if (timeOfDay === 'morning') {
        if (moodLower.includes('tired') || moodLower.includes('exhausted') || moodLower.includes('sleepy')) {
            return `Tired but here - that's what matters, ${name}! ☕ Let's make it count anyway.`;
        }
        if (moodLower.includes('energized') || moodLower.includes('great') || moodLower.includes('motivated') || moodLower.includes('good')) {
            return `Love that energy, ${name}! 🔥 Let's channel it.`;
        }
        if (moodLower.includes('stressed') || moodLower.includes('anxious') || moodLower.includes('overwhelmed')) {
            return `I feel you, ${name}. Let's focus on just ONE thing today. Small wins.`;
        }
        return `Got it, ${name}. Whatever you're feeling, let's make progress.`;
    } else {
        if (moodLower.includes('tired') || moodLower.includes('exhausted')) {
            return `Long day, ${name}? Let's wrap this up quick then.`;
        }
        if (moodLower.includes('accomplished') || moodLower.includes('great') || moodLower.includes('good') || moodLower.includes('productive')) {
            return `That's what I like to hear! 🙌`;
        }
        if (moodLower.includes('frustrated') || moodLower.includes('stuck') || moodLower.includes('struggling')) {
            return `Tough day? That's okay. Progress isn't always linear.`;
        }
        return `Thanks for checking in, ${name}.`;
    }
}
