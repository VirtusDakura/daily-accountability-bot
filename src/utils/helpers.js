/**
 * Helper utilities for the Daily Accountability Bot
 * Contains date formatting and validation helpers
 */

/**
 * Get today's date in YYYY-MM-DD format (local timezone)
 * @returns {string} Today's date string
 */
export function getTodayDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 * @returns {string} Yesterday's date string
 */
export function getYesterdayDate() {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Check if a date string is today
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export function isToday(dateString) {
    return dateString === getTodayDate();
}

/**
 * Check if a date string is yesterday
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @returns {boolean}
 */
export function isYesterday(dateString) {
    return dateString === getYesterdayDate();
}

/**
 * Format a streak message with emoji based on length
 * @param {number} streak - Current streak count
 * @returns {string} Formatted streak message
 */
export function formatStreakEmoji(streak) {
    if (streak === 0) return "🔴";
    if (streak < 3) return "🟡";
    if (streak < 7) return "🟢";
    if (streak < 14) return "🔥";
    if (streak < 30) return "⚡";
    return "🏆";
}
