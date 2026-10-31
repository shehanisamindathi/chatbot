# MERN ChatBot Pro

A complete full-stack **MERN** (MongoDB, Express.js, React 19, Node.js) conversational AI chatbot with real-time SSE streaming.

## Features
- **Frontend**: React 19 + Tailwind CSS styled with a clean widget interface matching modern messenger apps.
- **Backend**: Express.js REST & Server-Sent Events (SSE) streaming API.
- **Database**: MongoDB (Atlas or local instance) via official `mongodb` driver, with an automatic fallback embedded engine.
- **AI Engine**: Gemini 3.8 Flash (`@google/genai`) and OpenRouter streaming support.

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env` (or copy from `.env.example`):
```ini
PORT=3000

# MongoDB Connection String (Atlas or Local)
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/mern_chatbot?retryWrites=true&w=majority"

# Gemini or OpenRouter API Key
GEMINI_API_KEY="your-gemini-api-key"
OPENROUTER_API_KEY="your-openrouter-key"
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```
