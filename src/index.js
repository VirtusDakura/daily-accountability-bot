import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { sendMessage } from "./services/whatsapp.js";


const app = express();
const PORT = 3000;

// VERIFY TOKEN — MUST MATCH META DASHBOARD
const VERIFY_TOKEN = "your_verify_token";

// Middleware
app.use(express.json());

// Root test
app.get("/", (req, res) => {
    res.send("Server is running");
});

// Webhook verification (CRITICAL)
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified successfully");
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Receive WhatsApp messages
app.post("/webhook", async (req, res) => {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message?.text?.body) {
        const from = message.from;
        const text = message.text.body.toLowerCase();

        if (text === "hi" || text === "hello") {
            await sendMessage(
                from,
                "👋 Hey Virtus!\nDid you code today?\n\nReply with:\n- done\n- status\n- learned"
            );
        }
    }

    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
