# System Architecture: Stadium Companion AI

## High-Level Overview

Stadium Companion AI is a Next.js (App Router) web application designed as an offline-capable, edge-ready fan assistant for the FIFA World Cup 2026 at MetLife Stadium. It leverages a dual-provider AI architecture (Gemini + Rule-based Fallback) to guarantee 100% availability even under severe network constraints.

## Core Components

### 1. Frontend (Next.js App Router)
- **Framework**: React 18 / Next.js 16 (App Router)
- **Styling**: Vanilla CSS with CSS Variables for themeing (dark/light mode).
- **State Management**: React Hooks (\`useChatSession\`, \`usePreferences\`, \`useLiveInsight\`).
- **Accessibility**: ARIA attributes, semantic HTML, high-contrast support, screen reader optimized dynamically via the \`LiveStadiumInsight\` and \`ChatWindow\` components.

### 2. AI Provider Layer (\`lib/ai/\`)
The AI layer abstracts the generative and deterministic logic through a common \`AIProvider\` interface.
- **GeminiProvider**: Connects to the Google Gemini API (via \`@google/generative-ai\`) for rich, contextual responses with function calling. Features streaming support and structured tool definitions.
- **FallbackProvider**: A deterministic, rule-based Regex matcher that provides offline fallback capabilities. It executes the exact same tools as Gemini but constructs responses using string templates.
- **system-prompt.ts**: Dynamically builds instructions for the AI based on the user's active session context (language, zone, accessibility mode).

### 3. Tool Execution Engine (\`lib/ai/tools.ts\`)
The app exposes structured functions to the AI (and FallbackProvider) to fetch real stadium data:
- \`findGate\`: Resolves sections to gates.
- \`getAccessibleRoute\`: Calculates step-free paths.
- \`getCrowdStatus\`: Simulates or retrieves real-time crowd densities.
- \`getTransportOptions\`: Highlights sustainable transport options.
- \`getAmenity\`: Locates restrooms, family rooms, etc.
- \`translateQuickPhrase\`: Translates core fan phrases natively.

### 4. Data Layer (\`lib/data/\`)
- **venue.json**: The single source of truth for all stadium topology (gates, sections, amenities, routes).
- **crowd-simulation.ts**: A determinist algorithm (based on timestamp) to generate realistic crowd density metrics for the Live Stadium Insight panel.

### 5. API Routes (\`app/api/\`)
- **\`/api/chat\`**: The primary streaming endpoint. It handles API key resolution, applies rate limits (20 requests/window), processes the AI stream, and yields Server-Sent Events (SSE) to the client.
- **\`/api/health\`**: Standard health check endpoint for monitoring.

### 6. Internationalization (\`lib/i18n.ts\`)
- Supports English, Spanish, French, and Arabic.
- Fully supports RTL (Right-to-Left) for Arabic.
- Dynamic dictionary loading.

## Data Flow (Chat Request)

1. User types a message in \`ChatInputArea\`.
2. \`useChatSession\` prepends user context (language, accessibility mode, session ID) and sends a POST request to \`/api/chat\`.
3. The API checks Rate Limiting (\`lib/rate-limit.ts\`). If exceeded, returns 429.
4. The API checks for \`GEMINI_API_KEY\`.
   - If present, routes to \`GeminiProvider\`.
   - If missing or offline, routes to \`FallbackProvider\`.
5. The Provider evaluates the message:
   - Identifies if a Tool Call is needed (e.g., "Where is section 101?").
   - Executes the tool synchronously against the \`venue.json\` data.
   - Formats the tool result into natural language.
6. The Provider streams the response back to the client via SSE.
7. \`api-chat-client.ts\` parses the SSE stream, updating the UI progressively.

## Security & Performance

- **Rate Limiting**: In-memory IP-based rate limiting prevents abuse.
- **Caching**: Deterministic tool responses (e.g., gate locations) are cached via \`SimpleCache\` (LRU) to save compute.
- **Edge Runtime**: API routes use \`export const runtime = 'edge'\` where possible to minimize latency.
- **Strict Linting**: The repository enforces \`max-lines-per-function\` (50), \`complexity\` (10), and \`max-depth\` (3) for high maintainability.

## Deployment

The application is structured to be deployed on Vercel or any standard Node.js/Edge platform. It requires minimal environment configuration (\`GEMINI_API_KEY\` only).
