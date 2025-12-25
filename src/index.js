import express from "express";

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

// Receive messages later
app.post("/webhook", (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
