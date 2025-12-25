/**
 * Storage Service - Memory for your accountability partner
 */

import User from '../models/User.js';
import { getTodayDate } from '../utils/helpers.js';

export async function getUserData(phone) {
    try {
        let user = await User.findOne({ phone });
        if (!user) {
            user = new User({ phone, onboardingComplete: false, onboardingStep: 'welcome' });
            await user.save();
        }
        return user;
    } catch (error) {
        console.error('[Storage]', error);
        throw error;
    }
}

export async function getUsersForMorningReminder(currentTime, today) {
    return await User.find({
        onboardingComplete: true,
        morningReminderTime: currentTime,
        $or: [{ lastMorningReminder: { $ne: today } }, { lastMorningReminder: null }]
    }).catch(() => []);
}

export async function getUsersForEveningReminder(currentTime, today) {
    return await User.find({
        onboardingComplete: true,
        eveningReminderTime: currentTime,
        $or: [{ lastEveningReminder: { $ne: today } }, { lastEveningReminder: null }]
    }).catch(() => []);
}

export async function markMorningReminderSent(phone, today) {
    await User.updateOne({ phone }, { lastMorningReminder: today });
}

export async function markEveningReminderSent(phone, today) {
    await User.updateOne({ phone }, { lastEveningReminder: today });
}

export async function setOnboardingStep(phone, step) {
    const user = await getUserData(phone);
    user.onboardingStep = step;
    if (step === 'complete') user.onboardingComplete = true;
    await user.save();
}

export async function setUserName(phone, name) {
    const user = await getUserData(phone);
    user.name = name;
    await user.save();
}

export async function setMorningReminderTime(phone, time) {
    const user = await getUserData(phone);
    user.morningReminderTime = time;
    await user.save();
}

export async function setEveningReminderTime(phone, time) {
    const user = await getUserData(phone);
    user.eveningReminderTime = time;
    await user.save();
}

export async function setConversationState(phone, state) {
    const user = await getUserData(phone);
    user.conversationState = state;
    await user.save();
}

export async function createTodaysLog(phone) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    if (!user.dailyLog.find(log => log.date === today)) {
        user.dailyLog.push({ date: today });
        await user.save();
    }
}

export async function saveMorningMood(phone, mood) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    let log = user.dailyLog.find(l => l.date === today);
    if (!log) {
        user.dailyLog.push({ date: today });
        log = user.dailyLog[user.dailyLog.length - 1];
    }
    log.morningMood = mood;
    user.conversationState = 'morning_plan';
    await user.save();
}

export async function saveTodaysPlan(phone, plan) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    const log = user.dailyLog.find(l => l.date === today);
    if (log) log.todaysPlan = plan;
    user.conversationState = null;
    await user.save();
}

export async function saveEveningMood(phone, mood) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    let log = user.dailyLog.find(l => l.date === today);
    if (!log) {
        user.dailyLog.push({ date: today });
        log = user.dailyLog[user.dailyLog.length - 1];
    }
    log.eveningMood = mood;
    user.conversationState = 'evening_check';
    await user.save();
}

export async function saveCodedResponse(phone, coded) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    let log = user.dailyLog.find(l => l.date === today);
    if (!log) {
        user.dailyLog.push({ date: today, coded });
        log = user.dailyLog[user.dailyLog.length - 1];
    } else {
        log.coded = coded;
    }

    // Update streak
    if (coded) {
        const lastDate = user.lastResponseDate;
        if (lastDate) {
            const diffDays = Math.floor((new Date(today) - new Date(lastDate)) / (1000 * 60 * 60 * 24));
            user.currentStreak = diffDays === 1 ? user.currentStreak + 1 : 1;
        } else {
            user.currentStreak = 1;
        }
        user.totalDaysCoded = (user.totalDaysCoded || 0) + 1;
        if (user.currentStreak > user.longestStreak) user.longestStreak = user.currentStreak;
        user.conversationState = 'what_done';
    } else {
        user.currentStreak = 0;
        user.conversationState = 'why_not';
    }

    user.lastResponseDate = today;
    await user.save();

    return { currentStreak: user.currentStreak, longestStreak: user.longestStreak };
}

export async function saveWhyNot(phone, reason) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    const log = user.dailyLog.find(l => l.date === today);
    if (log) log.whyNot = reason;
    user.conversationState = null;
    await user.save();
}

export async function saveWhatDone(phone, whatDone) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    const log = user.dailyLog.find(l => l.date === today);
    if (log) log.whatDone = whatDone;
    user.conversationState = 'what_learned';
    await user.save();
}

export async function saveWhatLearned(phone, learning) {
    const user = await getUserData(phone);
    const today = getTodayDate();
    const log = user.dailyLog.find(l => l.date === today);
    if (log) log.learning = learning;
    user.conversationState = null;
    await user.save();
}

export async function getTodaysLog(phone) {
    const user = await getUserData(phone);
    return user.dailyLog.find(log => log.date === getTodayDate());
}

export async function getRecentLogs(phone, days = 7) {
    const user = await getUserData(phone);
    return user.dailyLog.slice(-days);
}

export async function hasLoggedToday(phone) {
    const user = await getUserData(phone);
    const log = user.dailyLog.find(l => l.date === getTodayDate());
    return log?.coded !== null && log?.coded !== undefined;
}

export async function canLogCompletion(phone) {
    // User can only log after their evening time
    const user = await getUserData(phone);
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Parse evening time
    const [eveningHour, eveningMin] = user.eveningReminderTime.split(':').map(Number);
    const [currentHour, currentMin] = currentTime.split(':').map(Number);

    // Current time >= evening time
    if (currentHour > eveningHour) return true;
    if (currentHour === eveningHour && currentMin >= eveningMin) return true;
    return false;
}

export async function resetUserData(phone) {
    const user = await getUserData(phone);
    user.currentStreak = 0;
    user.longestStreak = 0;
    user.totalDaysCoded = 0;
    user.dailyLog = [];
    user.lastResponseDate = null;
    user.conversationState = null;
    await user.save();
}
