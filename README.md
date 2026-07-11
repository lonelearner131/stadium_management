# Stadium Companion AI ⚽

> A GenAI-powered fan assistant for the FIFA World Cup 2026, built for the **Fan Experience, Navigation & Accessibility** vertical.

[![CI](https://github.com/lonelearner131/stadium_management/actions/workflows/ci.yml/badge.svg)](https://github.com/lonelearner131/stadium_management/actions/workflows/ci.yml)

## Chosen Vertical & Rationale

**Fan Experience, Navigation & Accessibility** — A stadium holds 82,500+ people, many international visitors who may not speak the local language, have mobility needs, or be unfamiliar with the venue. A conversational AI assistant that provides real-time, context-aware help with wayfinding, accessibility, crowd status, transportation, and sustainability dramatically improves the fan experience while reducing the operational burden on staff.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  ┌──────────┐ ┌─────────────┐ ┌──────────────────┐  │
│  │ ChatWindow│ │LanguageSwtch│ │AccessibilityTgl │  │
│  │ (React)  │ │  (en/es/fr/ar)│ │   (♿ toggle)  │  │
│  └────┬─────┘ └─────────────┘ └──────────────────┘  │
│       │ SSE Stream                                   │
├───────┼─────────────────────────────────────────────┤
│       ▼                                              │
│  POST /api/chat ──► Validate (Zod) ──► Sanitize     │
│       │              ──► Rate Limit                  │
│       ▼                                              │
│  ┌─────────────────────┐                             │
│  │   AIProvider (IF)    │ ◄── Adapter Pattern        │
│  ├─────────┬───────────┤                             │
│  │ Gemini  │ Fallback  │                             │
│  │Provider │ Provider  │ ◄── Auto-fallback           │
│  └────┬────┴─────┬─────┘                             │
│       │          │                                   │
│       ▼          ▼                                   │
│  ┌─────────────────────┐                             │
│  │   Tool Executor      │                            │
│  │ findGate │ getCrowd  │                            │
│  │ getRoute │ getTransit│                            │
│  │ getAmenty│ translate │                            │
│  └────┬─────────────────┘                            │
│       ▼                                              │
│  ┌──────────────────────┐                            │
│  │ Static Data Layer     │                           │
│  │ venue.json (loaded    │                           │
│  │ once at module scope) │                           │
│  │ crowd-simulation.ts   │                           │
│  │ i18n dictionaries     │                           │
│  └──────────────────────┘                            │
└─────────────────────────────────────────────────────┘
```

## How AI Reasoning & Tool-Calling Works

The assistant uses **grounded, tool-based reasoning** — it never guesses stadium facts:

1. **User sends a message** → validated via Zod, sanitized, rate-checked
2. **System prompt** is built dynamically based on session context (language, accessibility mode, zone, ticket section)
3. **AI provider** (Gemini or Fallback) analyzes the message and decides which tool(s) to call
4. **Tools execute** against static venue data and return structured results
5. **AI formats** the tool results into a natural-language response
6. **Response streams** to the client via SSE for instant perceived performance

### The 6 Tools

| Tool | Purpose | Context-Aware Behavior |
|------|---------|----------------------|
| `findGate(section)` | Nearest gate, walk time | Adds ramp/elevator info in accessibility mode |
| `getAccessibleRoute(from, to)` | Step-free path | Always ramps/lifts only |
| `getCrowdStatus(gateOrZone)` | Live density level | Suggests alternates when high |
| `getTransportOptions(area)` | Transit options | Sorts by carbon footprint (sustainability) |
| `getAmenity(type, zone)` | Restrooms, first aid, etc. | Filters for accessible-only when mode is on |
| `translateQuickPhrase(phrase, lang)` | Common fan phrases | Supports en/es/fr/ar |

## Keyless Fallback Mode

**The app works fully without any API key.** The `FallbackProvider` uses deterministic pattern matching to:
- Recognize user intents (gate finding, crowd status, restroom, etc.)
- Invoke the same tools as the Gemini provider
- Format results into helpful responses
- Stream the response to the client

This means a reviewer can clone the repo, run `npm run dev`, and immediately interact with a fully functional assistant.

## Setup Instructions

### Prerequisites
- Node.js 20+
- npm 10+

### Install & Run

```bash
# Clone the repository
git clone https://github.com/lonelearner131/stadium_management.git
cd stadium_management

# Install dependencies
npm install

# Run in development mode (works without any env vars)
npm run dev

# Open http://localhost:3000
```

### With Gemini API (Optional)

```bash
# Copy the env template
cp .env.example .env.local

# Edit .env.local and add your Gemini API key
# Get one at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_key_here

# Run
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | No | Google Gemini API key. App works fully without it via fallback provider. |

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npx vitest --coverage

# Run specific test file
npx vitest __tests__/tools.test.ts
```

## Linting

```bash
npm run lint
```

## Building

```bash
npm run build
```

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the repository in [Vercel Dashboard](https://vercel.com/new)
3. Set environment variable: `GEMINI_API_KEY` (optional)
4. Click Deploy — zero custom server config needed

The app works immediately even without setting `GEMINI_API_KEY`.

## 🚀 Features

### Problem Statement Coverage Matrix
| Capability Area | Implementation File/Feature | Evidence |
| --- | --- | --- |
| **Navigation** | `lib/ai/tools.ts` (`findGate`) | Extracts section numbers and returns precise gate, level, and walking time using static venue data. |
| **Crowd Management** | `lib/data/crowd-simulation.ts` | Uses deterministic PRNG to simulate density and wait times, prompting alternatives if crowded. |
| **Accessibility** | `components/AccessibilityToggle.tsx` | Global UI toggle explicitly injects wheelchair routing requirements into the LLM system prompt. |
| **Transportation** | `lib/ai/tools.ts` (`getTransportOptions`) | Sorts transit options by carbon footprint, prioritizing zero/low emission options. |
| **Sustainability** | `lib/ai/system-prompt.ts` | Explicitly instructs the AI to highlight greener options using a visible `[🌱 Greener Option]` badge. |
| **Multilingual** | `components/LanguageSwitcher.tsx` | Next.js i18n switcher dynamically updates the system prompt language requirement. |
| **Operational Intelligence** | `components/LiveStadiumInsight.tsx` | Real-time UI panel aggregates crowd data across all gates to recommend the fastest entry point. |
| **Real-Time Decision Support** | `lib/ai/system-prompt.ts` | AI is instructed to proactively offer alternate routing or waiting strategies when crowds are high. |

- **Real-Time Context**: Grounded in static stadium data (`venue.json`).
- **Edge AI Ready**: Built with the `@google/generative-ai` SDK (Gemini 3.5 Pro).

## Dependencies

| Package | Purpose | Justification |
|---------|---------|---------------|
| `next` | Framework | Required — App Router, API routes, streaming, server components |
| `react` / `react-dom` | UI library | Required by Next.js |
| `zod` | Input validation | Schema-based validation for all API inputs |
| `@google/generative-ai` | Gemini SDK | Optional LLM provider for enhanced AI responses |
| `vitest` (dev) | Test runner | Fast, TypeScript-native testing |
| `@vitejs/plugin-react` (dev) | Vitest React support | Required for potential React component tests |
| `eslint` / `eslint-config-next` (dev) | Linting | Code quality enforcement |
| `typescript` (dev) | Type checking | TypeScript compiler |

## Assumptions

See [ASSUMPTIONS.md](./ASSUMPTIONS.md) for a complete list of design decisions and scope constraints.

## Security

See [SECURITY.md](./SECURITY.md) for the threat model and security mitigations.

## Self-Assessment

See [SELF_ASSESSMENT.md](./SELF_ASSESSMENT.md) for a detailed mapping of features to evaluation criteria.

## License

MIT
