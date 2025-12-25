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
                lastResponseDate: null,
                currentStreak: 0,
                longestStreak: 0,
                dailyLog: [],
                awaitingLearning: false
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
 * Save user data to database
 * @param {Object} userData - User document to save
 */
export async function saveUserData(userData) {
    try {
        await userData.save();
    } catch (error) {
        console.error('[Storage] Error saving user data:', error);
        throw error;
    }
}

/**
 * Add a daily log entry
 * @param {string} phone - User's phone number
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {boolean} coded - Whether user coded that day
 * @param {string|null} learning - Optional learning note
 */
export async function addDailyLog(phone, date, coded, learning = null) {
    const user = await getUserData(phone);

    // Check if entry already exists for this date
    const existingIndex = user.dailyLog.findIndex(log => log.date === date);

    const logEntry = {
        date,
        coded,
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
 * Update streak based on today's response
 * @param {string} phone - User's phone number
 * @param {boolean} coded - Whether user coded today
 * @param {string} lastDate - Last response date
 * @returns {Object} Updated streak info
 */
export async function updateStreak(phone, coded, lastDate) {
    const user = await getUserData(phone);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (coded) {
        // Check if last response was yesterday (streak continues)
        if (lastDate) {
            const lastDateObj = new Date(lastDate);
            const diffDays = Math.floor((today - lastDateObj) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day - increment streak
                user.currentStreak += 1;
            } else if (diffDays > 1) {
                // Streak broken - reset to 1
                user.currentStreak = 1;
            }
            // If diffDays === 0, they already logged today
        } else {
            // First ever log
            user.currentStreak = 1;
        }

        // Update longest streak if current beats it
        if (user.currentStreak > user.longestStreak) {
            user.longestStreak = user.currentStreak;
        }
    } else {
        // User didn't code - reset streak
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
 * Set awaiting learning state
 * @param {string} phone - User's phone number
 * @param {boolean} awaiting
 */
export async function setAwaitingLearning(phone, awaiting) {
    const user = await getUserData(phone);
    user.awaitingLearning = awaiting;
    await user.save();
}

/**
 * Check if bot is awaiting learning input
 * @param {string} phone - User's phone number
 * @returns {boolean}
 */
export async function isAwaitingLearning(phone) {
    const user = await getUserData(phone);
    return user.awaitingLearning === true;
}

/**
 * Save learning note to today's log
 * @param {string} phone - User's phone number
 * @param {string} learning - Learning note text
 */
export async function saveLearningNote(phone, learning) {
    const user = await getUserData(phone);
    const today = new Date().toISOString().split('T')[0];

    const todayLog = user.dailyLog.find(log => log.date === today);
    if (todayLog) {
        todayLog.learning = learning;
    }

    user.awaitingLearning = false;
    await user.save();
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
    user.awaitingLearning = false;
    await user.save();
}
