/**
 * Database Connection - MongoDB via Mongoose
 * Handles connection to MongoDB Atlas
 */

import mongoose from 'mongoose';

/**
 * Connect to MongoDB
 * Uses MONGODB_URI or MONGO_URI from environment variables
 */
export async function connectDB() {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

    if (!uri) {
        console.error('[Database] MONGODB_URI or MONGO_URI not set in environment variables');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('[Database] Connected to MongoDB');
    } catch (error) {
        console.error('[Database] Connection failed:', error.message);
        process.exit(1);
    }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDB() {
    await mongoose.disconnect();
    console.log('[Database] Disconnected from MongoDB');
}
