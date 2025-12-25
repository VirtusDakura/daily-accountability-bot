/**
 * Storage Service - JSON file persistence for user data
 * Handles reading/writing to data/user.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to user data file
const DATA_FILE = path.join(__dirname, '../data/user.json');

/**
 * Default user data structure
 */
const DEFAULT_DATA = {
    allowedPhone: "",
    lastResponseDate: null,
    currentStreak: 0,
    longestStreak: 0,
    dailyLog: [],
    awaitingLearning: false
};

/**
 * Read user data from JSON file
 * @returns {Object} User data object
 */
export function getUserData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Create file with defaults if it doesn't exist
            saveUserData(DEFAULT_DATA);
            return { ...DEFAULT_DATA };
        }
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading user data:', error);
        return { ...DEFAULT_DATA };
    }
}

/**
 * Save user data to JSON file
 * @param {Object} data - User data to save
 */
export function saveUserData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving user data:', error);
    }
}

/**
 * Add a daily log entry
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {boolean} coded - Whether user coded that day
 * @param {string|null} learning - Optional learning note
 */
export function addDailyLog(date, coded, learning = null) {
    const data = getUserData();

    // Check if entry already exists for this date
    const existingIndex = data.dailyLog.findIndex(log => log.date === date);

    const logEntry = {
        date,
        coded,
        learning,
        timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        // Update existing entry
        data.dailyLog[existingIndex] = logEntry;
    } else {
        // Add new entry
        data.dailyLog.push(logEntry);
    }

    // Keep only last 90 days of logs
    if (data.dailyLog.length > 90) {
        data.dailyLog = data.dailyLog.slice(-90);
    }

    saveUserData(data);
    return logEntry;
}

/**
 * Update streak based on today's response
 * @param {boolean} coded - Whether user coded today
 * @param {string} lastDate - Last response date
 * @returns {Object} Updated streak info
 */
export function updateStreak(coded, lastDate) {
    const data = getUserData();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (coded) {
        // Check if last response was yesterday (streak continues)
        if (lastDate) {
            const lastDateObj = new Date(lastDate);
            const diffDays = Math.floor((today - lastDateObj) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day - increment streak
                data.currentStreak += 1;
            } else if (diffDays > 1) {
                // Streak broken - reset to 1
                data.currentStreak = 1;
            }
            // If diffDays === 0, they already logged today (shouldn't happen with guards)
        } else {
            // First ever log
            data.currentStreak = 1;
        }

        // Update longest streak if current beats it
        if (data.currentStreak > data.longestStreak) {
            data.longestStreak = data.currentStreak;
        }
    } else {
        // User didn't code - reset streak
        data.currentStreak = 0;
    }

    data.lastResponseDate = todayStr;
    saveUserData(data);

    return {
        currentStreak: data.currentStreak,
        longestStreak: data.longestStreak
    };
}

/**
 * Check if user has already responded today
 * @returns {boolean}
 */
export function hasRespondedToday() {
    const data = getUserData();
    if (!data.lastResponseDate) return false;

    const today = new Date().toISOString().split('T')[0];
    return data.lastResponseDate === today;
}

/**
 * Set awaiting learning state
 * @param {boolean} awaiting
 */
export function setAwaitingLearning(awaiting) {
    const data = getUserData();
    data.awaitingLearning = awaiting;
    saveUserData(data);
}

/**
 * Check if bot is awaiting learning input
 * @returns {boolean}
 */
export function isAwaitingLearning() {
    const data = getUserData();
    return data.awaitingLearning === true;
}

/**
 * Save learning note to today's log
 * @param {string} learning - Learning note text
 */
export function saveLearningNote(learning) {
    const data = getUserData();
    const today = new Date().toISOString().split('T')[0];

    const todayLog = data.dailyLog.find(log => log.date === today);
    if (todayLog) {
        todayLog.learning = learning;
    }

    data.awaitingLearning = false;
    saveUserData(data);
}

/**
 * Get last N days of logs
 * @param {number} days - Number of days to retrieve  
 * @returns {Array} Array of log entries
 */
export function getRecentLogs(days = 7) {
    const data = getUserData();
    return data.dailyLog.slice(-days);
}
