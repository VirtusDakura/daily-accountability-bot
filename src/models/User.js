/**
 * User Model - MongoDB Schema for user data
 * Stores streak information, daily logs, reminder preferences, and learning notes
 */

import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
    date: { type: String, required: true },       // YYYY-MM-DD format
    coded: { type: Boolean, required: true },
    whatCoded: { type: String, default: null },   // What they coded
    learning: { type: String, default: null },    // What they learned
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: { type: String, default: null },

    // Onboarding state
    onboardingComplete: { type: Boolean, default: false },
    onboardingStep: { type: String, default: 'welcome' }, // welcome, ask_name, ask_morning_time, ask_evening_time, complete

    // Reminder preferences (stored as "HH:MM" in 24h format)
    morningReminderTime: { type: String, default: '08:00' },
    eveningReminderTime: { type: String, default: '20:00' },
    timezone: { type: String, default: 'Africa/Accra' }, // GMT timezone

    // Tracking if reminders were sent today
    lastMorningReminder: { type: String, default: null }, // YYYY-MM-DD
    lastEveningReminder: { type: String, default: null }, // YYYY-MM-DD

    // Conversation state
    awaitingResponse: { type: String, default: null }, // 'what_coded', 'what_learned', null

    // Stats
    lastResponseDate: { type: String, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    dailyLog: [dailyLogSchema],

}, {
    timestamps: true  // Automatically manage createdAt and updatedAt
});

const User = mongoose.model('User', userSchema);

export default User;
