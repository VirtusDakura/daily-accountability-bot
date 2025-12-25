# Daily Accountability Bot 🤖

A WhatsApp-based accountability bot that helps track daily programming consistency, maintain streaks, and capture learning reflections.

## Features

- ✅ **Daily Check-in** - Log whether you coded today (yes/no)
- 🔥 **Streak Tracking** - Track your current and longest coding streaks
- 📝 **Learning Reflections** - Record what you learned each day
- ⏰ **Daily Reminders** - Automated 8 PM reminder (configurable)
- 📊 **Stats & Summary** - View your consistency and weekly reports
- 🔒 **Single User** - Private bot for one user only

## Commands

| Command | Description |
|---------|-------------|
| `hi` / `start` | Welcome message |
| `yes` | Log that you coded today |
| `no` | Log that you didn't code today |
| `status` | View current streak & stats |
| `summary` | Last 7 days report |
| `help` | List all commands |
| `reset` | Reset all data (with confirmation) |

## Project Structure

```
src/
├── index.js                 # Main Express server & webhook
├── data/
│   └── user.json           # Persistent storage (JSON)
├── services/
│   ├── whatsapp.js         # WhatsApp API integration
│   ├── messageHandler.js   # Command routing & responses
│   ├── storage.js          # JSON file read/write
│   └── scheduler.js        # Daily cron reminders
└── utils/
    └── helpers.js          # Date & formatting utilities
```

## Environment Variables

Create a `.env` file in the project root:

```env
# WhatsApp Cloud API
WHATSAPP_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id

# Webhook verification
VERIFY_TOKEN=your_verify_token

# Bot configuration
ALLOWED_PHONE=your_whatsapp_number  # e.g., 1234567890
PORT=3000

# Daily reminder time (cron format: minute hour * * *)
REMINDER_TIME=0 20 * * *   # 8:00 PM daily
```

### Reminder Time Examples

| Time | Cron Expression |
|------|-----------------|
| 8:00 PM | `0 20 * * *` |
| 9:30 PM | `30 21 * * *` |
| 7:00 AM | `0 7 * * *` |

## Running Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

### 3. Expose with ngrok
```bash
ngrok http 3000
```

### 4. Configure Meta Webhook
- Go to Meta Developers Dashboard
- Set Callback URL: `https://your-ngrok-url/webhook`
- Set Verify Token: (must match `VERIFY_TOKEN` in .env)

## How It Works

### Daily Flow
1. User receives reminder at 8 PM
2. User replies `yes` or `no`
3. If `yes`, bot asks for learning reflection
4. User types what they learned
5. Bot saves and confirms

### Streak Logic
- **Streak increases**: If user logs `yes` on consecutive days
- **Streak resets to 0**: If user logs `no`
- **Streak resets to 1**: If user logs `yes` after missing a day

### Guardrails
- Only the allowed phone number can interact
- Can only log once per day
- Double-logging prevented with friendly message

## Tech Stack

- **Runtime**: Node.js
- **Server**: Express
- **API**: WhatsApp Cloud API (Meta)
- **Scheduler**: node-cron
- **HTTP Client**: axios
- **Environment**: dotenv

## License

ISC
