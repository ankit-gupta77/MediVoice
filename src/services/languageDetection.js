// Emergency keywords detection
const EMERGENCY_KEYWORDS_EN = [
    'chest pain', 'heart attack', 'can\'t breathe', 'cannot breathe',
    'difficulty breathing', 'shortness of breath', 'stroke', 'unconscious',
    'not breathing', 'severe pain', 'bleeding heavily', 'overdose',
    'suicidal', 'poisoning', 'choking', 'collapsed',
];

const EMERGENCY_KEYWORDS_HI = [
    'सीने में दर्द', 'दिल का दौरा', 'सांस नहीं आ रही', 'बेहोश',
    'बहुत दर्द', 'खून बह रहा', 'चक्कर आ रहा', 'गिर गया',
];

export function detectEmergency(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return (
        EMERGENCY_KEYWORDS_EN.some(kw => lower.includes(kw)) ||
        EMERGENCY_KEYWORDS_HI.some(kw => text.includes(kw))
    );
}

export function detectLanguage(text) {
    if (!text) return 'en';

    // Count Hindi/Devanagari characters
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;

    if (hindiChars === 0) {
        // Check for Hinglish patterns (roman script Hindi words)
        const hinglishWords = ['mujhe', 'mera', 'meri', 'kya', 'hai', 'ho', 'raha', 'hoon',
            'mein', 'aur', 'nahi', 'hua', 'kar', 'pe', 'se', 'ko', 'ka', 'ki',
            'sar', 'dard', 'bukhar', 'pet', 'khana', 'pani', 'neend', 'thakan'];
        const lowerText = text.toLowerCase();
        const hasHinglish = hinglishWords.some(w => lowerText.includes(w));
        return hasHinglish ? 'hinglish' : 'en';
    }

    // More than 30% Hindi chars = Hindi
    if (totalChars > 0 && hindiChars / totalChars > 0.3) return 'hi';

    // Mixed = Hinglish
    return 'hinglish';
}

export function detectStressKeywords(text) {
    if (!text) return false;
    const stressWords = ['scared', 'afraid', 'worried', 'anxious', 'panic', 'terrified',
        'डरा', 'घबराहट', 'चिंता', 'dar lag', 'bahut bura', 'very bad', 'horrible'];
    const lower = text.toLowerCase();
    return stressWords.some(w => lower.includes(w));
}
