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
GEMINI_MODEL=gemini-3-flash-preview
```

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
│   ├── api/                    # Gemini server routes
│   ├── layout.tsx              # Global layout & background mount
│   └── (pages)                 # Home, Clarity, Communication
├── components/
│   ├── ui/                     # shadcn components
│   └── shared components
├── lib/
│   └── geminiSafeGenerate.ts   # AI reliability wrapper
├── styles/
```

---

## Architecture Notes

- Global animated background mounted once in layout (fixed, non-blocking)
- Server-side Gemini calls for secure API usage
- Retry + timeout handling for production stability
- Structured JSON generation with safe parsing
- Graceful fallback for demo resilience
- Stateless design (no database required for demo version)

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
