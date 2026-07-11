# Performance and Caching Strategy

## Bundle Analyzer Output
Before the targeted improvement pass, the bundle analyzer was not configured. After configuring `@next/bundle-analyzer`, the application builds with minimal external dependencies.
- **Client Bundle**: Contains only React 19, Next.js client router, and our custom lightweight components. Zero heavy icon libraries (e.g. `lucide-react`) or external UI frameworks are included. The client relies on native browser DOM primitives, CSS (no Tailwind runtime), and emojis instead of SVG icon bundles.
- **Edge Bundle**: Contains the `@google/generative-ai` SDK and our standard lightweight fallback logic.
- **Server/Node**: Minimized.

## Caching Strategy
To improve efficiency and avoid redundant calculation during peak traffic events (like a World Cup match):
1. **Module Scope Loading**: The `venue.json` data is loaded exactly once at module scope initialization instead of per-request parsing.
2. **In-Memory TTL/LRU Cache**: We implemented a `SimpleCache` with a 1-hour TTL. All deterministic function calls (e.g., `findGate`, `getAccessibleRoute`, `getTransportOptions`, `getAmenity`) cache their computed results. If ten fans ask for the walking time from Gate B to Section 101, the system only computes the route once and serves the cached JSON to the AI for the other nine requests.
3. **ISR Caching**: The `/api/health` endpoint utilizes Next.js Incremental Static Regeneration (ISR) with `export const revalidate = 60`, avoiding per-request dynamic server overhead while still providing reasonably fresh data.

## Runtime Efficiency
- **Edge Runtime**: Both `/api/chat` and `/api/health` have been explicitly migrated to the `edge` runtime (`export const runtime = 'edge'`).
- The Edge runtime provides lower latency (zero cold starts) globally and requires fewer resources than Node.js environments. Both `zod` and `@google/generative-ai` are edge-compatible, allowing the entire AI streaming pipeline to run on Vercel Edge functions.

## Streaming Approach
- The `/api/chat` endpoint streams `data:` chunks using Server-Sent Events (SSE) directly from the Edge.
- Tool invocation happens sequentially on the edge, pausing the user-facing stream, running the deterministic (or cached) tool logic, and then seamlessly resuming the stream with the AI's final synthesized response.
