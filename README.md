# 🤖 Daily Accountability Bot

A WhatsApp-based accountability partner that helps you build a consistent coding habit through daily check-ins, streak tracking, and AI-powered coaching.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Cloud%20API-25D366.svg)

## ✨ Features

### 📅 Daily Flow
- **🌅 Morning Check-in**: Motivational quote + asks how you're feeling + ONE goal for the day
- **🌙 Evening Check-in**: Asks how your day went + did you accomplish your goal + what you learned
- **⏰ Time-Lock**: Can only log completion after your chosen evening time (no shortcuts!)

### 🔥 Streak Tracking
- Current streak counter
- Longest streak record
- 7-day consistency stats
- Total days coded

### 🤖 AI Coaching (Optional)
- **Reflection Feedback**: AI responds to your learnings with encouragement
- **Why-Not Support**: Non-judgmental acknowledgment when you miss a day
- **Weekly Summary**: AI-powered reflection every Sunday (opt-in)

### 💬 Conversational
- Asks how you're feeling (mood-aware responses)
- Personal, friendly tone
- Uses your name throughout
- Encouraging but firm - no room for excuses

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Messaging**: WhatsApp Cloud API
- **AI**: Groq (LLaMA 3.3 70B)
- **Scheduler**: node-cron
- **Deployment**: Render

## 📋 Commands

| Command | Description |
|---------|-------------|
| `hi` / `hello` | Greeting & status |
| `yes` | Log that you coded today |
| `no` | Log that you didn't code |
| `status` | View your streak stats |
| `summary` | Last 7 days report |
| `help` | Show all commands |
| `reset` | Clear all data |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Meta Developer account with WhatsApp Business API
- Groq API key (free at console.groq.com) - optional

### Installation

```bash
# Clone the repository
git clone https://github.com/VirtusDakura/daily-accountability-bot.git
cd daily-accountability-bot

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Environment Variables

```env
# Required
WHATSAPP_TOKEN=your_whatsapp_access_token
PHONE_NUMBER_ID=your_phone_number_id
MONGODB_URI=mongodb+srv://...
VERIFY_TOKEN=WHATSAPP_TOKEN

# Optional - AI Features
GROQ_API_KEY=gsk_your_key_here
AI_ENABLED=true
AI_WEEKLY_SUMMARY=true

# Optional - Defaults
PORT=3000
```

### Running Locally

```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

### Webhook Setup

1. Use ngrok for local testing: `ngrok http 3000`
2. Configure webhook URL in Meta Developer Dashboard:
   - Callback URL: `https://your-url.ngrok.io/webhook`
   - Verify Token: Your `VERIFY_TOKEN` value

## 📁 Project Structure

```
src/
├── index.js              # Express server & webhook routes
├── ai/
│   └── coach.js          # AI coaching module (Groq)
├── config/
│   └── db.js             # MongoDB connection
├── models/
│   └── User.js           # User schema
├── services/
│   ├── messageHandler.js # Bot logic & conversation flows
│   ├── scheduler.js      # Cron jobs (morning/evening/weekly)
│   ├── storage.js        # Database operations
│   └── whatsapp.js       # WhatsApp API client
└── utils/
    ├── helpers.js        # Date & formatting utilities
    └── quotes.js         # 31 programming quotes
```

## 🔧 Configuration

### Reminder Times
Users set their own morning and evening times during onboarding:
- Morning: When to receive motivational message + goal prompt
- Evening: When to check if goal was accomplished

### AI Features
| Variable | Default | Description |
|----------|---------|-------------|
| `AI_ENABLED` | `false` | Enable AI reflection feedback |
| `AI_WEEKLY_SUMMARY` | `false` | Enable Sunday AI summaries |
| `GROQ_API_KEY` | - | Required if AI enabled |

If AI is disabled, the bot uses static fallback messages.

## 🌐 Deployment (Render)

1. Push to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set environment variables
5. Deploy!

**Important**: Add `0.0.0.0/0` to MongoDB Atlas IP whitelist.

## 📱 User Flow

```
New User → Onboarding
           ├── What's your name?
           ├── Morning reminder time?
           └── Evening reminder time?
           
Morning Reminder (at chosen time)
├── Quote of the day
├── How are you feeling?
└── What's your ONE goal today?

Evening Reminder (at chosen time)  
├── How are you feeling?
├── Did you accomplish your goal?
│   ├── YES → What did you do? → What did you learn? → AI feedback
│   └── NO  → What happened? → AI acknowledgment
└── Streak updated
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**VirtusDakura**

- GitHub: [@VirtusDakura](https://github.com/VirtusDakura)

## 🙏 Acknowledgments

- WhatsApp Cloud API for messaging platform
- Groq for fast, free AI inference
- MongoDB Atlas for database hosting
- Render for deployment

---

*Built with ❤️ to help developers stay consistent*
