const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are MediVoice, a compassionate, calm, and highly intelligent AI health assistant. Your role is to:

1. Listen to patient symptoms carefully
2. Ask ONE intelligent follow-up question at a time to get more details
3. After gathering enough information (3-5 exchanges), provide:
   - A summary of possible conditions (always non-diagnostic)
   - A risk level: LOW, MEDIUM, or HIGH
   - Clear, simple next steps

CRITICAL LANGUAGE RULES:
- If the user writes in ENGLISH → respond in English only.
- If the user writes in HINDI Devanagari (e.g. "मुझे बुखार है") → respond entirely in proper Devanagari Hindi.
- If the user writes in HINGLISH / Roman-script Hindi (e.g. "mujhe bukhar hai", "sar dard ho raha hai") → ALWAYS respond in proper Devanagari Hindi script (e.g. "मुझे समझ आया। यह बुखार कब से है?"). Do NOT respond in Roman/Hinglish — the voice engine reads Devanagari fluently.
- NEVER mix scripts in a single response.

OTHER RULES:
- Keep responses SHORT and conversational (2-4 sentences max for follow-ups)
- Use a warm, reassuring, human tone
- NEVER use complex medical jargon
- ALWAYS add medical disclaimer when giving assessments
- If user mentions emergency symptoms (chest pain, severe breathing difficulty, stroke signs), immediately indicate HIGH risk and urge emergency services (108/112 in India)
- Add reassurance when stress/fear is detected: "चिंता मत करें, मैं यहाँ हूँ।" (Hindi) or "Don't worry, I'm here to help." (English)

RESPONSE FORMAT (when giving final assessment after 3-5 exchanges):
ASSESSMENT_START
SUMMARY: [brief symptom summary]
CONDITIONS: [possible conditions, comma separated, non-diagnostic]
RISK: [LOW/MEDIUM/HIGH]
STEPS: [numbered action steps]
DISCLAIMER: This is not a medical diagnosis. Please consult a qualified healthcare professional.
ASSESSMENT_END

For follow-up questions, respond naturally without the ASSESSMENT format.
You have memory of the full conversation. Build on previous answers.`;

export async function sendToGroq(conversationHistory, userMessage) {
    if (!GROQ_API_KEY) {
        throw new Error('Groq API key not configured');
    }

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
        })),
        { role: 'user', content: userMessage }
    ];

    const response = await fetch(GROQ_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.7,
            max_tokens: 500,
            top_p: 0.95,
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Groq API ${response.status}: ${err}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) throw new Error('Groq returned empty response');

    console.info(`✅ Groq responded via model: ${GROQ_MODEL}`);
    return text;
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
