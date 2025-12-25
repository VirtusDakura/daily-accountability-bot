/**
 * Helper utilities for the Daily Accountability Bot
 * Contains date formatting and parsing helpers
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
 * Parse a time string into HH:MM format (24-hour)
 * Accepts formats like: 7:00, 07:00, 7:00 AM, 7:00 PM, 19:00
 * @param {string} timeStr - Time string to parse
 * @returns {string|null} Time in HH:MM format or null if invalid
 */
export function parseTime(timeStr) {
    if (!timeStr) return null;

    const input = timeStr.trim().toUpperCase();

    // Match various time formats
    const patterns = [
        /^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i,  // 7:00, 07:00, 7:00 AM, 7:00 PM
        /^(\d{1,2})\s*(AM|PM)$/i,            // 7 AM, 7PM
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            let hours = parseInt(match[1], 10);
            let minutes = match[2] && !isNaN(match[2]) ? parseInt(match[2], 10) : 0;
            const meridiem = match[3] || match[2];

            // Handle AM/PM
            if (meridiem) {
                const isPM = meridiem.toUpperCase() === 'PM';
                const isAM = meridiem.toUpperCase() === 'AM';

                if (isPM && hours !== 12) {
                    hours += 12;
                } else if (isAM && hours === 12) {
                    hours = 0;
                }

                // If meridiem was in match[2], minutes should be 0
                if (isNaN(parseInt(match[2], 10))) {
                    minutes = 0;
                }
            }

            // Validate hours and minutes
            if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
                return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            }
        }
    }

    return null;
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
 * @returns {string} Formatted streak emoji
 */
export function formatStreakEmoji(streak) {
    if (streak === 0) return "🔴";
    if (streak < 3) return "🟡";
    if (streak < 7) return "🟢";
    if (streak < 14) return "🔥";
    if (streak < 30) return "⚡";
    return "🏆";
}

/**
 * Format time for display (convert 24h to 12h if needed)
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time string
 */
export function formatTimeDisplay(time) {
    if (!time) return 'Not set';

    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;

    return `${displayHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}
