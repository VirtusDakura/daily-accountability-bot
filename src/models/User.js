/**
 * User Model - MongoDB Schema for user data
 * Stores streak information, daily logs, and learning notes
 */

import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
    date: { type: String, required: true },       // YYYY-MM-DD format
    coded: { type: Boolean, required: true },
    learning: { type: String, default: null },
    timestamp: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    lastResponseDate: { type: String, default: null },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    dailyLog: [dailyLogSchema],
    awaitingLearning: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
userSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

const User = mongoose.model('User', userSchema);

export default User;
