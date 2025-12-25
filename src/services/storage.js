/**
 * Storage Service - MongoDB persistence for user data
 * Handles all database operations for user data, streaks, and daily logs
 */

import User from '../models/User.js';

/**
 * Get or create user data from database
 * @param {string} phone - User's phone number
 * @returns {Object} User data object
 */
export async function getUserData(phone) {
    try {
        let user = await User.findOne({ phone });

        if (!user) {
            // Create new user if doesn't exist
            user = new User({
                phone,
                onboardingComplete: false,
                onboardingStep: 'welcome'
            });
            await user.save();
        }

        return user;
    } catch (error) {
        console.error('[Storage] Error getting user data:', error);
        throw error;
    }
}

/**
 * Get all users who need morning reminder at current time
 * @param {string} currentTime - Current time in HH:MM format
 * @param {string} today - Today's date in YYYY-MM-DD format
 * @returns {Array} Array of users needing reminder
 */
export async function getUsersForMorningReminder(currentTime, today) {
    try {
        return await User.find({
            onboardingComplete: true,
            morningReminderTime: currentTime,
            $or: [
                { lastMorningReminder: { $ne: today } },
                { lastMorningReminder: null }
            ]
        });
    } catch (error) {
        console.error('[Storage] Error getting users for morning reminder:', error);
        return [];
    }
}

/**
 * Get all users who need evening reminder at current time
 * @param {string} currentTime - Current time in HH:MM format
 * @param {string} today - Today's date in YYYY-MM-DD format
 * @returns {Array} Array of users needing reminder
 */
export async function getUsersForEveningReminder(currentTime, today) {
    try {
        return await User.find({
            onboardingComplete: true,
            eveningReminderTime: currentTime,
            lastResponseDate: { $ne: today }, // Haven't logged today
            $or: [
                { lastEveningReminder: { $ne: today } },
                { lastEveningReminder: null }
            ]
        });
    } catch (error) {
        console.error('[Storage] Error getting users for evening reminder:', error);
        return [];
    }
}

/**
 * Mark morning reminder as sent
 * @param {string} phone - User's phone number
 * @param {string} today - Today's date
 */
export async function markMorningReminderSent(phone, today) {
    await User.updateOne({ phone }, { lastMorningReminder: today });
}

/**
 * Mark evening reminder as sent
 * @param {string} phone - User's phone number
 * @param {string} today - Today's date
 */
export async function markEveningReminderSent(phone, today) {
    await User.updateOne({ phone }, { lastEveningReminder: today });
}

/**
 * Update user onboarding step
 * @param {string} phone - User's phone number
 * @param {string} step - New onboarding step
 */
export async function setOnboardingStep(phone, step) {
    const user = await getUserData(phone);
    user.onboardingStep = step;
    if (step === 'complete') {
        user.onboardingComplete = true;
    }
    await user.save();
}

/**
 * Update user name
 * @param {string} phone - User's phone number
 * @param {string} name - User's name
 */
export async function setUserName(phone, name) {
    const user = await getUserData(phone);
    user.name = name;
    await user.save();
}

/**
 * Update morning reminder time
 * @param {string} phone - User's phone number
 * @param {string} time - Time in HH:MM format
 */
export async function setMorningReminderTime(phone, time) {
    const user = await getUserData(phone);
    user.morningReminderTime = time;
    await user.save();
}

/**
 * Update evening reminder time
 * @param {string} phone - User's phone number
 * @param {string} time - Time in HH:MM format
 */
export async function setEveningReminderTime(phone, time) {
    const user = await getUserData(phone);
    user.eveningReminderTime = time;
    await user.save();
}

/**
 * Set awaiting response type
 * @param {string} phone - User's phone number
 * @param {string|null} responseType - Type of response awaited
 */
export async function setAwaitingResponse(phone, responseType) {
    const user = await getUserData(phone);
    user.awaitingResponse = responseType;
    await user.save();
}

/**
 * Add a daily log entry
 * @param {string} phone - User's phone number
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {boolean} coded - Whether user coded that day
 * @param {string|null} whatCoded - What they coded
 * @param {string|null} learning - What they learned
 */
export async function addDailyLog(phone, date, coded, whatCoded = null, learning = null) {
    const user = await getUserData(phone);

    // Check if entry already exists for this date
    const existingIndex = user.dailyLog.findIndex(log => log.date === date);

    const logEntry = {
        date,
        coded,
        whatCoded,
        learning,
        timestamp: new Date()
    };

    if (existingIndex >= 0) {
        // Update existing entry
        user.dailyLog[existingIndex] = logEntry;
    } else {
        // Add new entry
        user.dailyLog.push(logEntry);
    }

    // Keep only last 90 days of logs
    if (user.dailyLog.length > 90) {
        user.dailyLog = user.dailyLog.slice(-90);
    }

    await user.save();
    return logEntry;
}

/**
 * Update today's log with what was coded
 * @param {string} phone - User's phone number
 * @param {string} whatCoded - What they coded
 */
export async function updateWhatCoded(phone, whatCoded) {
    const user = await getUserData(phone);
    const today = new Date().toISOString().split('T')[0];

    const todayLog = user.dailyLog.find(log => log.date === today);
    if (todayLog) {
        todayLog.whatCoded = whatCoded;
    }
    await user.save();
}

/**
 * Update today's log with learning
 * @param {string} phone - User's phone number
 * @param {string} learning - What they learned
 */
export async function updateLearning(phone, learning) {
    const user = await getUserData(phone);
    const today = new Date().toISOString().split('T')[0];

    const todayLog = user.dailyLog.find(log => log.date === today);
    if (todayLog) {
        todayLog.learning = learning;
    }
    user.awaitingResponse = null;
    await user.save();
}

/**
 * Update streak based on today's response
 * @param {string} phone - User's phone number
 * @param {boolean} coded - Whether user coded today
 * @returns {Object} Updated streak info
 */
export async function updateStreak(phone, coded) {
    const user = await getUserData(phone);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const lastDate = user.lastResponseDate;

    if (coded) {
        if (lastDate) {
            const lastDateObj = new Date(lastDate);
            const diffDays = Math.floor((today - lastDateObj) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                user.currentStreak += 1;
            } else if (diffDays > 1) {
                user.currentStreak = 1;
            }
        } else {
            user.currentStreak = 1;
        }

        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }
    } else {
        user.currentStreak = 0;
    }

    user.lastResponseDate = todayStr;
    await user.save();

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak
    };
}

/**
 * Check if user has already responded today
 * @param {string} phone - User's phone number
 * @returns {boolean}
 */
export async function hasRespondedToday(phone) {
    const user = await getUserData(phone);
    if (!user.lastResponseDate) return false;

    const today = new Date().toISOString().split('T')[0];
    return user.lastResponseDate === today;
}

/**
 * Get last N days of logs
 * @param {string} phone - User's phone number
 * @param {number} days - Number of days to retrieve  
 * @returns {Array} Array of log entries
 */
export async function getRecentLogs(phone, days = 7) {
    const user = await getUserData(phone);
    return user.dailyLog.slice(-days);
}

/**
 * Reset all user data
 * @param {string} phone - User's phone number
 */
export async function resetUserData(phone) {
    const user = await getUserData(phone);
    user.currentStreak = 0;
    user.longestStreak = 0;
    user.dailyLog = [];
    user.lastResponseDate = null;
    user.awaitingResponse = null;
    await user.save();
}

/**
 * Get total user count
 * @returns {number} Total users
 */
export async function getTotalUsers() {
    return await User.countDocuments({ onboardingComplete: true });
}
