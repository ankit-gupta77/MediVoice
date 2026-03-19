const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GEMINI_API_KEY || ''; // Fallback just in case

const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768'
];
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are MediVoice, a compassionate, calm, and highly intelligent AI health assistant. Your role is to:

1. Listen to patient symptoms carefully
2. Ask ONE intelligent follow-up question at a time to get more details
3. After gathering enough information (3-5 exchanges), provide:
   - A summary of possible conditions (always non-diagnostic)
   - A risk level: LOW, MEDIUM, or HIGH
   - Clear, simple next steps

CRITICAL RULES:
- Always speak in the SAME LANGUAGE as the user (English, Hindi, or Hinglish)
- Keep responses SHORT and conversational (2-4 sentences max for follow-ups)
- Use a warm, reassuring, human tone
- NEVER use complex medical jargon
- ALWAYS add medical disclaimer when giving assessments
- If user mentions emergency symptoms (chest pain, severe breathing difficulty, stroke signs), immediately indicate HIGH risk and urge emergency services
- Detection of stress/fear: add "Don't worry, I'm here to help." type reassurance

RESPONSE FORMAT (when giving final assessment):
Use this exact format for final assessments:
ASSESSMENT_START
SUMMARY: [brief symptom summary]
CONDITIONS: [possible conditions, comma separated, non-diagnostic]
RISK: [LOW/MEDIUM/HIGH]
STEPS: [numbered action steps]
DISCLAIMER: This is not a medical diagnosis. Please consult a qualified healthcare professional.
ASSESSMENT_END

For follow-up questions during conversation, respond naturally without the ASSESSMENT format.

You have memory of the full conversation. Build on previous answers.`;

export async function sendToGroq(conversationHistory, userMessage) {
    if (!GROQ_API_KEY) {
        return getMockResponse(conversationHistory, userMessage);
    }

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: userMessage }
    ];

    const body = JSON.stringify({
        model: GROQ_MODELS[0],
        messages: messages,
        temperature: 0.7,
        max_tokens: 500,
        top_p: 0.95,
    });

    for (const model of GROQ_MODELS) {
        try {
            const requestBody = JSON.parse(body);
            requestBody.model = model;

            const response = await fetch(GROQ_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${GROQ_API_KEY}`
                },
                body: JSON.stringify(requestBody),
            });

            if (response.status === 429 || response.status === 403) {
                console.warn(`Groq ${model}: quota/access issue (${response.status}), trying next...`);
                continue;
            }

            if (!response.ok) {
                const err = await response.text();
                console.warn(`Groq ${model} error: ${err}`);
                continue;
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) {
                console.info(`✅ Groq responded via model: ${model}`);
                return text;
            }
        } catch (err) {
            console.warn(`Groq ${model} fetch error:`, err);
        }
    }

    console.warn('All Groq models failed; using demo mode');
    return getMockResponse(conversationHistory, userMessage);
}

export function parseAssessment(text) {
    if (!text.includes('ASSESSMENT_START')) return null;

    const content = text.match(/ASSESSMENT_START([\s\S]*?)ASSESSMENT_END/)?.[1] || '';
    const get = (key) => content.match(new RegExp(`${key}:\\s*(.+)`))?.[1]?.trim() || '';

    return {
        summary: get('SUMMARY'),
        conditions: get('CONDITIONS').split(',').map(c => c.trim()).filter(Boolean),
        risk: get('RISK'),
        steps: content.match(/STEPS:\s*([\s\S]*?)(?:DISCLAIMER:|$)/)?.[1]
            ?.trim()
            ?.split(/\d+\.\s+/)
            ?.filter(Boolean) || [],
        disclaimer: get('DISCLAIMER'),
    };
}

// Mock responses for demo mode (no API key)
const mockFollowUps = [
    "I understand. How long have you been experiencing these symptoms?",
    "I see. On a scale of 1-10, how would you rate your discomfort?",
    "Thank you for sharing that. Are you experiencing any fever or chills along with this?",
    "Have you taken any medication for this so far? And do you have any known allergies?",
];

const mockAssessment = `Based on what you've shared, here's my assessment:

ASSESSMENT_START
SUMMARY: Patient reports persistent symptoms including the described discomfort, lasting for a moderate duration
CONDITIONS: Common viral infection, Tension-related symptoms, Mild inflammation
RISK: LOW
STEPS: 1. Get adequate rest and stay hydrated
2. Monitor your temperature regularly
3. Take over-the-counter pain relief if needed (follow label instructions)
4. If symptoms worsen in 48 hours, schedule a doctor visit
DISCLAIMER: This is not a medical diagnosis. Please consult a qualified healthcare professional for proper evaluation and treatment.
ASSESSMENT_END`;

function getMockResponse(history, userMessage) {
    const turnCount = history.filter(m => m.role === 'user').length;
    const isGreeting = /^(hi|hello|hey|namaste|greetings)[\s!.]*$/i.test(userMessage.trim());

    if (turnCount === 0) {
        if (isGreeting) {
            return "Hello! I am MediVoice. Tell me, how are you feeling today?";
        }
        return `I'm sorry to hear you're not feeling well. ${detectOpeningSympathy(userMessage)} Could you tell me more — when did these symptoms first start?`;
    }

    if (turnCount < 4) {
        return mockFollowUps[Math.min(turnCount - 1, mockFollowUps.length - 1)];
    }

    return mockAssessment;
}

function detectOpeningSympathy(text) {
    const lower = text.toLowerCase();
    if (lower.includes('head') || lower.includes('sir') || lower.includes('sar')) {
        return "Headaches can be quite uncomfortable.";
    }
    if (lower.includes('fever') || lower.includes('bukhar')) {
        return "A fever can certainly make you feel miserable.";
    }
    if (lower.includes('stomach') || lower.includes('pet')) {
        return "Stomach issues can be quite distressing.";
    }
    return "Don't worry, I'm here to help you.";
}
