# Assumptions — Stadium Companion AI

This document records all assumptions made during development. These are explicit design decisions made in the absence of real stakeholder requirements.

## Scope Assumptions

1. **Single Stadium**: The app is scoped to MetLife Stadium (East Rutherford, NJ) for FIFA World Cup 2026. The architecture supports adding other venues by swapping `venue.json`.

2. **Mock Data**: All stadium data (gates, sections, routes, amenities, transit) is simulated. In production, this would be sourced from FIFA's venue management system or the stadium operator's API.

3. **No Real-time Data Feeds**: Crowd density is simulated using a deterministic time-seeded algorithm. Real deployment would integrate with stadium IoT sensors, camera-based crowd counting, or ticketing system throughput data.

4. **No Score/Match Data**: The assistant does not provide match scores, team lineups, or game statistics. This is a deliberate scope constraint — those features would require integration with FIFA's match data API.

## Session & Privacy Assumptions

5. **No PII Storage**: The app stores no personally identifiable information. Session state (language, accessibility mode, zone) lives only in the client's React state and is sent per-request. Nothing is persisted to disk, database, or cookies.

6. **Session ID**: A random, non-identifying session ID is generated client-side for each browser session. It is used only to maintain conversation continuity within a single page visit. It contains no user data and cannot be reverse-engineered to identify a user.

7. **No Authentication**: The app has no user accounts, login, or authentication. It is a public-facing anonymous assistant.

8. **No Cookies**: No cookies are set. Session preferences are stored in React state and reset on page reload.

## AI & Language Assumptions

9. **Fallback-First Design**: The app is designed to be fully functional without a Gemini API key. The deterministic fallback provider handles all core use cases through pattern matching and tool invocation.

10. **Four Languages**: The app supports English, Spanish, French, and Arabic. These were chosen because:
    - English: Primary language of the US host nation
    - Spanish: Second most spoken language in the US; Mexico is a co-host
    - French: Canada is a co-host
    - Arabic: Large international audience; tests RTL support

11. **Translation Scope**: The `translateQuickPhrase` tool only translates a predefined set of common fan phrases. It is not a general-purpose translator.

12. **AI Safety**: The system prompt instructs the AI to refuse any query outside stadium-assistance scope. The fallback provider enforces this through strict pattern matching.

## Accessibility Assumptions

13. **WCAG 2.1 AA Target**: The app targets WCAG 2.1 Level AA compliance. This includes color contrast, keyboard navigation, screen reader support, and reduced motion preferences.

14. **Accessibility Mode**: When enabled, all tool calls bias toward step-free/accessible routing, and the AI proactively mentions ramps, elevators, and companion seating.

15. **Single Accessibility Ask**: The assistant asks about accessibility needs once per session, then remembers the preference without asking again.

## Technical Assumptions

16. **Vercel Deployment**: The app is designed for Vercel's platform. The in-memory rate limiter works for single-instance deployments; see SECURITY.md for production alternatives.

17. **No Database**: All data is static JSON loaded at module scope. This is appropriate for venue data that changes infrequently (per-event, not per-request).

18. **Streaming via SSE**: AI responses stream via Server-Sent Events for perceived performance. The client consumes these as a ReadableStream.

19. **Edge Compatibility**: While the app can run on Edge runtime, it defaults to Node.js runtime for broader compatibility with the Gemini SDK.
