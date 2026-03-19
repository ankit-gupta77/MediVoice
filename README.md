# 🩺 MediVoice — AI-Powered Medical Voice Assistant

> 🏆 **Built for the [Murf AI Buildathon](https://murf.ai)** — A multilingual, voice-first AI health assistant that listens to your symptoms, asks intelligent follow-up questions, and generates a personalized medical assessment — all in real-time.

---

## 🚀 Features

- 🎙️ **Voice Input** via Deepgram (Nova-3 model) — real-time speech-to-text
- ⌨️ **Text Input** — type your symptoms as an alternative to speaking
- 🤖 **AI Diagnosis** via Groq (LLaMA 3.3 70B) — contextual, conversational medical Q&A
- 🔊 **Voice Output** via Murf AI (GEN2) — natural, low-latency text-to-speech
- 🌐 **Multilingual** — supports English, Hindi (Devanagari), and Hinglish (Roman script)
- 🚨 **Emergency Detection** — detects critical symptoms and recommends emergency services
- 📊 **Medical Report** — generates a structured assessment with possible conditions, risk level, and next steps
- 💬 **Chat History** — full conversation log that persists during the session

---

## 🧠 AI Models & APIs Used

| Layer | Service | Model / Voice |
|-------|---------|---------------|
| **Speech-to-Text (STT)** | [Deepgram](https://deepgram.com) | `nova-3` (bilingual en/hi) |
| **Language Model (LLM)** | [Groq](https://console.groq.com) | `llama-3.3-70b-versatile` |
| **Text-to-Speech (TTS)** | [Murf AI](https://murf.ai) | `en-US-natalie` (English) / `hi-IN-shweta` (Hindi + Hinglish) — GEN2 |
| **Language Detection** | Custom heuristic | Devanagari Unicode + Hinglish keyword matching |

---

## 🏗️ Tech Stack

| Area | Technology |
|------|-----------|
| Frontend Framework | React (Vite) |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| State Management | React Context API |
| Audio Capture | Web MediaRecorder API |
| WebSocket (STT) | Deepgram WebSocket v1 |

---

## 📁 Project Structure

```
src/
├── context/
│   └── SessionContext.jsx     # Global state, orchestrates STT → LLM → TTS pipeline
├── screens/
│   ├── HomeScreen.jsx          # Landing page with voice orb + text input
│   ├── ChatScreen.jsx          # Chat interface with history + bottom input bar
│   └── ResultScreen.jsx        # Final assessment / medical report
├── services/
│   ├── deepgramService.js      # Deepgram WebSocket STT integration
│   ├── aiService.js            # Groq LLM API integration
│   ├── murfService.js          # Murf AI TTS integration
│   └── languageDetection.js    # Language & emergency keyword detection
├── components/
│   ├── AnimatedOrb.jsx         # Animated mic button
│   ├── ChatBubble.jsx          # Message bubble component
│   ├── WaveformVisualizer.jsx  # Live audio waveform
│   └── EmergencyOverlay.jsx    # Emergency alert popup
└── App.jsx                     # Root app with screen routing
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- API keys for Deepgram, Groq, and Murf AI

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "MediVoice - Hackathon"
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key
VITE_GROQ_API_KEY=your_groq_api_key_starts_with_gsk_
VITE_MURF_API_KEY=your_murf_api_key_starts_with_ap2_
```

> ⚠️ Groq API keys begin with `gsk_`. Murf API keys begin with `ap2_`.

### 3. Run Locally

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🗣️ How It Works

1. **User speaks or types** their symptoms on the Home or Chat screen
2. **Deepgram (Nova-3)** transcribes speech in real-time over a WebSocket
3. **Language is auto-detected** — English, Hindi (Devanagari script), or Hinglish (Roman script Hindi)
4. **Groq (LLaMA 3.3 70B)** receives the full conversation history and generates a contextual follow-up question or final medical assessment
5. **Murf AI (GEN2)** converts the AI response to speech using the appropriate voice:
   - English → `en-US-natalie` (Indian locale)
   - Hindi/Hinglish → `hi-IN-shweta` (native Hindi speaker)
6. After 3–5 exchanges, the AI generates a **structured assessment report** with:
   - Possible conditions
   - Risk level (LOW / MEDIUM / HIGH)
   - Recommended next steps
   - Medical disclaimer

---

## 🌍 Language Support

| Language | Input Mode | TTS Voice |
|----------|-----------|-----------|
| English | Voice + Text | `en-US-natalie` (en-IN locale) |
| Hindi (Devanagari) | Voice + Text | `hi-IN-shweta` |
| Hinglish (Roman Hindi) | Voice + Text | `hi-IN-shweta` |

---

## 🚨 Emergency Detection

The app automatically detects high-risk phrases in both English and Hindi:

- English: *"chest pain"*, *"can't breathe"*, *"stroke"*, *"unconscious"*, etc.
- Hindi: *"सीने में दर्द"*, *"सांस नहीं आ रही"*, *"बेहोश"*, etc.

When detected, a full-screen emergency overlay appears prompting the user to call emergency services (108 / 112 in India).

---

## 📝 API Configuration Notes

| Parameter | Deepgram | Groq | Murf |
|-----------|----------|------|------|
| Model | `nova-3` | `llama-3.3-70b-versatile` | `GEN2` (`modelVersion`) |
| Language | `hi` (bilingual) | Via system prompt | Via `voiceId` |
| Format | WebSocket stream | OpenAI-compatible REST | MP3, 24000Hz, MONO |
| Latency | ~300ms | ~1-2s | ~1-2s (base64 playback) |

---

## ⚠️ Disclaimer

> MediVoice is an AI-assisted tool for informational purposes only. It is **not** a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional for medical concerns.

---

## 🏆 Built For

**Murf AI Buildathon** — MediVoice was built as a submission for the Murf AI Buildathon, showcasing Murf AI's GEN2 text-to-speech technology in a real-world multilingual healthcare application.

- 🎤 **Primary TTS**: Murf AI GEN2 (`en-US-natalie`, `hi-IN-shweta`)
- 🌐 **Multilingual**: English, Hindi, and Hinglish support powered by Murf's `multiNativeLocale` feature
