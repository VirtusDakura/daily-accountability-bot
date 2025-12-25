/**
 * AI Coach Service
 * 
 * Provides AI-powered coaching features:
 * 1. Reflection feedback - responds to user reflections with encouragement
 * 2. Encouragement variation - generates varied encouragement messages
 * 3. Weekly summary - summarizes weekly progress with patterns
 * 
 * All AI calls are:
 * - Optional (controlled by AI_ENABLED env flag)
 * - Non-blocking (wrapped in try/catch)
 * - Gracefully fallback to static messages on failure
 * 
 * Uses Groq for fast, free inference. Can swap providers easily.
 */

import Groq from 'groq-sdk';

// Initialize Groq client (only if key is provided)
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// ========== FALLBACK MESSAGES ==========

const FALLBACK_REFLECTIONS = [
    "Thanks for sharing. Keep showing up — that's what matters most.",
    "I hear you. Consistency over perfection. Let's keep moving forward.",
    "Every day you show up is progress. Rest well and come back tomorrow.",
    "What you're building takes time. You're doing better than you think.",
    "Small steps add up. Keep going at your own pace."
];

const FALLBACK_ENCOURAGEMENTS = [
    "Showing up again tomorrow is the real win.",
    "Consistency beats intensity — you're doing fine.",
    "Progress isn't always visible, but it's happening.",
    "One day at a time. That's all it takes.",
    "You're building momentum. Keep it going."
];

const FALLBACK_WEEKLY = "You showed up this week. That's what counts. Keep building one day at a time.";

// ========== HELPER FUNCTIONS ==========

/**
 * Check if AI is enabled and configured
 */
function isAIEnabled() {
    return process.env.AI_ENABLED === 'true' && groq !== null;
}

/**
 * Get random fallback message
 */
function getRandomFallback(messages) {
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Clean AI response for WhatsApp
 * - Remove excessive punctuation
 * - Limit length
 * - Remove markdown
 */
function cleanResponse(text, maxLength = 300) {
    if (!text) return null;

    return text
        .replace(/\*\*/g, '')      // Remove bold markdown
        .replace(/\*/g, '')        // Remove italic markdown
        .replace(/`/g, '')         // Remove code ticks
        .replace(/#{1,6}\s/g, '')  // Remove headers
        .trim()
        .substring(0, maxLength);
}

// ========== AI PROMPTS (EXACT AS SPECIFIED) ==========

const REFLECTION_PROMPT = `You are a calm, supportive programming coach.

Respond in 2–3 short sentences only.
Be encouraging and practical.
Focus on consistency, not perfection.
Do NOT shame, scold, or lecture.
Do NOT use therapy language.
Do NOT ask questions.

User reflection:
"{USER_TEXT}"`;

const ENCOURAGEMENT_PROMPT = `Generate one short encouragement sentence.

Tone:
- Calm
- Supportive
- Coach-like
- Human

Rules:
- No emojis
- No exclamation marks
- No pressure
- One sentence only`;

const WEEKLY_SUMMARY_PROMPT = `You are a gentle accountability coach.

Write a short weekly reflection (3–4 sentences max).
Focus on patterns and momentum.
Avoid failure language.
Encourage small adjustments.

Weekly data:
- Days completed: {COMPLETED}/7
- Missed days: {MISSED}
- Common blockers: {BLOCKERS}`;

// ========== MAIN AI FUNCTIONS ==========

/**
 * Generate AI feedback for user reflection
 * 
 * @param {string} userText - User's reflection text
 * @param {string} context - 'yes' (completed) or 'no' (didn't complete)
 * @returns {string} AI response or fallback
 * 
 * Integration point: Call after user shares what they did or why they didn't
 */
export async function getReflectionFeedback(userText, context = 'general') {
    // Return fallback if AI disabled
    if (!isAIEnabled()) {
        console.log('[AI] Disabled - using fallback');
        return getRandomFallback(FALLBACK_REFLECTIONS);
    }

    // Skip AI for very short input
    if (!userText || userText.length < 5) {
        return getRandomFallback(FALLBACK_REFLECTIONS);
    }

    try {
        const prompt = REFLECTION_PROMPT.replace('{USER_TEXT}', userText);

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: prompt }
            ],
            max_tokens: 150,
            temperature: 0.7
        });

        const aiText = response.choices?.[0]?.message?.content;
        const cleaned = cleanResponse(aiText);

        if (cleaned && cleaned.length > 10) {
            console.log('[AI] Reflection feedback generated');
            return cleaned;
        }

        return getRandomFallback(FALLBACK_REFLECTIONS);

    } catch (error) {
        console.error('[AI] Reflection error:', error.message);
        return getRandomFallback(FALLBACK_REFLECTIONS);
    }
}

/**
 * Generate varied encouragement message
 * 
 * @returns {string} One-line encouragement
 * 
 * Integration point: Call to vary the bot's encouragement messages
 */
export async function getEncouragement() {
    if (!isAIEnabled()) {
        return getRandomFallback(FALLBACK_ENCOURAGEMENTS);
    }

    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: ENCOURAGEMENT_PROMPT }
            ],
            max_tokens: 50,
            temperature: 0.8
        });

        const aiText = response.choices?.[0]?.message?.content;
        const cleaned = cleanResponse(aiText, 100);

        if (cleaned && cleaned.length > 10) {
            console.log('[AI] Encouragement generated');
            return cleaned;
        }

        return getRandomFallback(FALLBACK_ENCOURAGEMENTS);

    } catch (error) {
        console.error('[AI] Encouragement error:', error.message);
        return getRandomFallback(FALLBACK_ENCOURAGEMENTS);
    }
}

/**
 * Generate weekly summary with AI coaching
 * 
 * @param {Object} weekData - { completed: number, missed: number, blockers: string[] }
 * @returns {string} Weekly summary message
 * 
 * Integration point: Called by weekly cron job
 */
export async function getWeeklySummary(weekData) {
    const { completed = 0, missed = 0, blockers = [] } = weekData;

    if (!isAIEnabled() || process.env.AI_WEEKLY_SUMMARY !== 'true') {
        return FALLBACK_WEEKLY;
    }

    try {
        const blockerText = blockers.length > 0
            ? blockers.slice(0, 3).join(', ')
            : 'None mentioned';

        const prompt = WEEKLY_SUMMARY_PROMPT
            .replace('{COMPLETED}', completed)
            .replace('{MISSED}', missed)
            .replace('{BLOCKERS}', blockerText);

        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: prompt }
            ],
            max_tokens: 200,
            temperature: 0.7
        });

        const aiText = response.choices?.[0]?.message?.content;
        const cleaned = cleanResponse(aiText, 400);

        if (cleaned && cleaned.length > 20) {
            console.log('[AI] Weekly summary generated');
            return cleaned;
        }

        return FALLBACK_WEEKLY;

    } catch (error) {
        console.error('[AI] Weekly summary error:', error.message);
        return FALLBACK_WEEKLY;
    }
}

/**
 * Check AI service health
 * Useful for debugging
 */
export function getAIStatus() {
    return {
        enabled: isAIEnabled(),
        hasKey: !!process.env.GROQ_API_KEY,
        weeklyEnabled: process.env.AI_WEEKLY_SUMMARY === 'true'
    };
}
