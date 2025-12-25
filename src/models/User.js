/**
 * User Model - Your accountability partner's memory
 */

import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
    date: { type: String, required: true },

    // Morning
    morningMood: { type: String, default: null },     // How they felt in morning
    todaysPlan: { type: String, default: null },       // What they plan to do

    // Evening
    eveningMood: { type: String, default: null },      // How they feel in evening
    coded: { type: Boolean, default: null },           // Did they code?
    whatDone: { type: String, default: null },         // What they actually did
    whyNot: { type: String, default: null },           // If no, why not
    learning: { type: String, default: null },         // What they learned

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

    // Onboarding
    onboardingComplete: { type: Boolean, default: false },
    onboardingStep: { type: String, default: 'welcome' },

    // Reminder times
    morningReminderTime: { type: String, default: '08:00' },
    eveningReminderTime: { type: String, default: '20:00' },
    timezone: { type: String, default: 'Africa/Accra' },

    // Tracking reminders
    lastMorningReminder: { type: String, default: null },
    lastEveningReminder: { type: String, default: null },

    // Conversation state - tracks the flow
    conversationState: { type: String, default: null },
    // States: 
    // Morning: 'morning_mood', 'morning_plan'
    // Evening: 'evening_mood', 'evening_check', 'why_not', 'what_done', 'what_learned'
    // null = awaiting nothing

    // Stats
    lastResponseDate: { type: String, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalDaysCoded: { type: Number, default: 0 },
    dailyLog: [dailyLogSchema],

}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
