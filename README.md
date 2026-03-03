# ClarityCast – AI Thinking & Communication Companion

An AI-powered web application that helps users untangle complex thoughts and refine professional communication using structured reasoning and natural language generation.

🌐 **Live site:** https://claritycast.vercel.app/login
🤖 Powered by Gemini API  
🎯 Built as an interactive AI product prototype

---

## Features

- 🧠 **Clarity Engine** — Transforms messy thoughts into structured clarity cards (decisions, plans, reframing, next steps)
- ✍️ **Communication Engine** — Refines messages into clear, professional drafts
- 🎨 **Animated Gradient UI** — Custom background animation with layered depth
- 📱 **Responsive Design** — Optimized for desktop and mobile
- 🧩 **Modular Architecture** — Reusable components with clean separation of concerns
- 🔁 **Auto-Deploy via Vercel** — Continuous deployment from GitHub

---

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Gemini API
- Vercel (Deployment)
- Git & GitHub

---

## Getting Started

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/claritycast.ai.git
cd claritycast.ai
npm install
```

---

### Environment Variables

Create a `.env.local` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODEL=gemini-2.0-flash-lite
DEBUG_AI=false
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `GEMINI_API_KEY` | Yes | — | Your Google Gemini API key |
| `GEMINI_MODEL` | No | `gemini-2.5-flash` | Primary model for AI generation |
| `GEMINI_FALLBACK_MODEL` | No | `gemini-2.0-flash-lite` | Fallback model if primary is slow or unavailable |
| `DEBUG_AI` | No | `false` | Logs prompts, responses, and errors to the server console |

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com).

> **Note:** `.env.local` is gitignored and must never be committed. Set these variables in Vercel under **Settings → Environment Variables** for production.

---

### Run the development server

```bash
npm run dev
```

Then open:

```
http://localhost:3000
```

---

## Build

Create a production build:

```bash
npm run build
```

Start production server locally:

```bash
npm start
```

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── clarify/            # POST /api/clarify
│   │   └── communicate/        # POST /api/communicate
│   ├── (auth)/login/           # Login page
│   ├── (app)/
│   │   ├── home/               # Home / landing
│   │   ├── clarity/            # Clarify feature
│   │   └── communication/      # Communicate feature
│   └── layout.tsx              # Global layout & background mount
└── lib/
    ├── geminiClient.ts         # AI calls, model fallback, timeout logic
    ├── api-client.ts           # Browser-side fetch wrapper with retries
    ├── prompts.ts              # System prompts and user prompt builders
    ├── schemas.ts              # Zod schemas for all inputs and outputs
    ├── aiCache.ts              # Client-side response caching
    ├── types.ts                # Shared TypeScript types
    └── utils.ts                # Utility functions
```

---

## Architecture Notes

- Global animated background mounted once in layout (fixed, non-blocking)
- Server-side Gemini calls for secure API usage
- Stateless design (no database required for demo version)
- Structured JSON generation with Zod schema validation and safe parsing

### AI Reliability (two-layer strategy)

**Server layer** (`src/lib/geminiClient.ts`):
- Primary model: `gemini-2.5-flash` — best stable flash model
- Fallback model: `gemini-2.0-flash-lite` — lightweight, stable
- 20s timeout per attempt
- Try primary once → if retryable error (timeout / 503 / 504 / rate limit), wait 1s → try fallback once → if both fail, return error to client

**Browser layer** (`src/lib/api-client.ts`):
- 60s timeout per HTTP request
- Up to 3 retries on HTTP 429, 408, 500–504 or network errors
- Exponential backoff with ±50% jitter, respects `Retry-After` headers
- The "retrying 1 of 3…" message in the UI comes from this layer — it means both Gemini models were unavailable and the browser is resending the full request

---

## Deployment

This project is deployed using **Vercel**.

Production builds are automatically deployed on every push to the `main` branch.

---

## 🚀 Roadmap

ClarityCast is actively evolving. Upcoming improvements include:

- Character-driven AI interaction (Think with Bear / Speak with Parrot)
- Reduced user friction in communication controls
- Enhanced structured output reliability
- Performance optimizations

Feedback and iteration are ongoing.

---

## License

MIT License
