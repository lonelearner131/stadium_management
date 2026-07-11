# Security — Stadium Companion AI

## Threat Model

This document describes the security posture of the Stadium Companion AI, including identified threats and their mitigations.

### 1. Prompt Injection

**Threat**: Malicious users craft inputs to override the AI's system prompt, causing it to reveal internal instructions, generate harmful content, or bypass safety controls.

**Mitigations**:
- **Input sanitization** (`lib/sanitize.ts`): Common injection patterns are stripped before input reaches the AI model. Patterns like "ignore previous instructions" are filtered.
- **System prompt isolation**: The system prompt is server-side only and never exposed to the client.
- **Fallback provider safety**: The rule-based fallback provider uses strict pattern matching, making prompt injection ineffective — it only responds to recognized intent patterns.
- **Output sanitization**: All AI output is sanitized before rendering, removing `<script>`, `<iframe>`, event handlers, and `javascript:` URIs.

### 2. Cross-Site Scripting (XSS)

**Threat**: AI-generated or user-supplied content containing malicious scripts could execute in other users' browsers.

**Mitigations**:
- **No `dangerouslySetInnerHTML`**: The `MessageBubble` component uses a safe React-based renderer that only supports bold text and bullet lists via React elements — never raw HTML injection.
- **HTML entity escaping**: All user input is escaped (`&`, `<`, `>`, `"`, `'`) via `escapeHtml()` before processing.
- **Output sanitization**: AI output is stripped of all potentially dangerous HTML tags and attributes.
- **CSP headers**: Content Security Policy restricts script sources to `'self'`, blocking inline scripts from executing.

### 3. API Key Leakage

**Threat**: The Gemini API key could be accidentally committed to the repository or exposed to the client.

**Mitigations**:
- **Environment variables only**: The API key is read from `process.env.GEMINI_API_KEY` exclusively in server-side code (`lib/ai/gemini-provider.ts`).
- **.gitignore**: All `.env*` files (except `.env.example`) are gitignored.
- **.env.example**: Contains placeholder values only, never real keys.
- **Server-side only**: The Gemini provider is only imported in the API route (`app/api/chat/route.ts`), which runs server-side. The key never reaches the client bundle.

### 4. Abuse / Rate Limiting

**Threat**: Automated scripts or abusive users could overwhelm the API, causing excessive Gemini API costs or service degradation.

**Mitigations**:
- **In-memory rate limiting** (`lib/rate-limit.ts`): Sliding window rate limiter (20 requests/minute per IP) with automatic cleanup.
- **Input size limits**: Messages are capped at 2,000 characters; conversation history at 50 messages. Enforced by Zod validation.
- **HTTP 429 responses**: Rate-limited requests receive proper `429 Too Many Requests` with `Retry-After` header.

**Production upgrade path**: Replace the in-memory rate limiter with a distributed solution:
- **Upstash Redis** (recommended for Vercel): `@upstash/ratelimit` provides distributed rate limiting with no infrastructure management.
- **Vercel KV**: Built-in key-value store that can implement sliding window rate limiting.
- **Cloudflare Rate Limiting**: If deployed behind Cloudflare, use their built-in rate limiting rules.

### 5. Data Minimization

**Threat**: Collecting or storing unnecessary user data creates privacy risk and regulatory exposure.

**Mitigations**:
- **No PII stored**: The app stores no personally identifiable information — no names, emails, locations, or biometric data.
- **No database**: All data is static; no user data is persisted.
- **No cookies**: Session state lives in React component state only.
- **Non-identifying session IDs**: Session IDs are random strings that cannot be traced back to any user.
- **No analytics**: No third-party tracking or analytics scripts are loaded.

### 6. Input Validation

**Threat**: Malformed or oversized payloads could cause server errors, memory exhaustion, or unexpected behavior.

**Mitigations**:
- **Zod schema validation** (`lib/validation/schemas.ts`): Every API input is validated against strict Zod schemas before processing.
- **Type-safe parsing**: `safeParse()` returns structured error details without throwing exceptions.
- **Proper HTTP status codes**: Invalid inputs return `400 Bad Request` with detailed error messages; oversized payloads are rejected.

### 7. Security Headers

All responses include the following security headers (configured in `next.config.ts`):

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' ...` | Restricts resource loading to trusted sources |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information leakage |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Enforces HTTPS |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | Restricts browser API access |

### 8. CORS

**Threat**: Cross-origin requests could allow unauthorized access to the API.

**Mitigations**:
- **Same-origin by default**: Next.js API routes only accept same-origin requests by default. No CORS headers are explicitly set, which means cross-origin requests are blocked.

### 9. Dependency Security

- Dependencies are kept minimal and each is justified in README.md.
- `npm audit` is run as part of the deployment checklist.
- No binary dependencies or native modules are used.
- All dependencies are well-maintained, widely-used packages from the npm registry.
