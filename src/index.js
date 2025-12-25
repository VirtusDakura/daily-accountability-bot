/**
 * Daily Accountability Bot - Main Entry Point
 * 
 * A WhatsApp-based bot that helps track daily programming consistency.
 * Built with Express, WhatsApp Cloud API, and node-cron.
 * 
 * Features:
 * - Daily check-in (yes/no)
 * - Streak tracking
 * - Learning reflections
 * - Daily reminders
 */

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { handleMessage } from "./services/messageHandler.js";
import { initScheduler } from "./services/scheduler.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Verify token for Meta webhook verification (using WHATSAPP_TOKEN)
const VERIFY_TOKEN = process.env.WHATSAPP_TOKEN;

// ==================== MIDDLEWARE ====================

app.use(express.json());

// ==================== ROUTES ====================

/**
 * Health check / root endpoint
 */
app.get("/", (req, res) => {
    res.send("🤖 Daily Accountability Bot is running!");
});

/**
 * Webhook verification (GET)
 * Meta sends this to verify your webhook URL
 */
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("[Webhook] Verification successful");
        res.status(200).send(challenge);
    } else {
        console.log("[Webhook] Verification failed");
        res.sendStatus(403);
    }
});

/**
 * Webhook message receiver (POST)
 * Receives incoming WhatsApp messages from Meta
 */
app.post("/webhook", async (req, res) => {
    try {
        // Extract message from webhook payload
        const entry = req.body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;

        // Check if this is a message event (not a status update)
        const messages = value?.messages;

        if (messages && messages.length > 0) {
            const message = messages[0];

            // Only handle text messages
            if (message.type === "text" && message.text?.body) {
                const from = message.from;
                const text = message.text.body;

                console.log(`[Message] From: ${from} | Text: "${text}"`);

                // Process the message through our handler
                await handleMessage(from, text);
            }
        }

        // Always respond with 200 to acknowledge receipt
        res.sendStatus(200);

    } catch (error) {
        console.error("[Webhook] Error processing message:", error);
        // Still return 200 to prevent Meta from retrying
        res.sendStatus(200);
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════╗
║   🤖 Daily Accountability Bot Started    ║
╠══════════════════════════════════════════╣
║   Port: ${PORT}                              ║
║   Webhook: /webhook                      ║
╚══════════════════════════════════════════╝
    `);

    // Initialize the daily reminder scheduler
    initScheduler();
});
