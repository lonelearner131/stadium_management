# Stadium Companion AI: Worked Scenarios

This document outlines 8 complete, worked scenarios demonstrating how the Stadium Companion AI handles diverse fan requirements. These scenarios cover the core evaluation criteria: navigation, crowd simulation, accessibility, sustainability, translation, and edge cases.

## Scenario 1: Basic Wayfinding (Standard Navigation)
**User Input:** "I have a ticket for section 112. How do I get there?"
**Context:** English, Default settings.
**Action:** The AI calls \`findGate("112")\`.
**Expected Outcome:** 
- Identifies the nearest gate (e.g., Gate A).
- Provides estimated walk time (e.g., 5 minutes).
- Highlights landmarks on the route.

## Scenario 2: High-Density Crowd Avoidance (Operational Intelligence)
**User Input:** "How busy is Gate A?"
**Context:** English, Pre-match time (e.g., 18:30).
**Action:** The AI calls \`getCrowdStatus("Gate A")\`.
**Expected Outcome:**
- Reports the current density (e.g., High, 85% capacity).
- Identifies the wait time (e.g., 20 mins).
- Proactively suggests an alternative (e.g., "Gate B is only a 3-minute walk and currently has a Low wait time of 5 mins. I recommend using Gate B").

## Scenario 3: Complete Accessibility Support
**User Input:** "I need to get to section 112 but I am using a wheelchair."
**Context:** English, Accessibility Mode automatically toggled on (or inferred).
**Action:** The AI calls \`findGate("112", true)\` and \`getAccessibleRoute("Entry", "Section 112")\`.
**Expected Outcome:**
- Verifies if Section 112 is accessible. If not, it warns the user and suggests the nearest accessible section (e.g., Section 113).
- Provides a step-free route detailing elevator locations and avoiding stairs.
- Notes companion seating availability.

## Scenario 4: Sustainable Transportation
**User Input:** "What is the best way to get to the stadium from Manhattan?"
**Context:** English, Default settings.
**Action:** The AI calls \`getTransportOptions("Manhattan")\`.
**Expected Outcome:**
- Returns public transit options (NJ Transit).
- Highlights the options with the **[🌱 Greener Option]** prefix.
- Omits driving/parking as the primary choice to promote sustainability, only offering it if specifically asked.

## Scenario 5: Multilingual Support (Arabic RTL)
**User Input:** "أين أقرب دورة مياه؟" (Where is the nearest restroom?)
**Context:** Arabic (ar), RTL layout active.
**Action:** The AI translates/understands the intent, calls \`getAmenity("restroom", currentZone)\`.
**Expected Outcome:**
- The response is generated in Arabic.
- The UI properly renders in Right-To-Left format.
- Directs the user to the closest family or standard restroom in their zone.

## Scenario 6: Fan Culture & Quick Translation
**User Input:** "How do I say 'Where is my seat' in Spanish?"
**Context:** English.
**Action:** The AI calls \`translateQuickPhrase("Where is my seat", "es")\`.
**Expected Outcome:**
- Returns "¿Dónde está mi asiento?".
- Provides a phonetic pronunciation or brief cultural note if applicable.

## Scenario 7: Fallback Provider (Offline Mode)
**User Input:** "Find my gate for section 131."
**Context:** English, **Offline / API Key missing**.
**Action:** The \`/api/chat\` route detects the missing key and routes to \`FallbackProvider\`.
**Expected Outcome:**
- The \`FallbackProvider\` uses Regex to match the intent.
- It extracts "131" and internally calls \`findGate("131")\`.
- It returns a deterministic, pre-templated response (e.g., "For Section 131, the nearest entrance is Gate C...") without hitting the Gemini API.

## Scenario 8: Security & Guardrails
**User Input:** "Who do you think will win the match tomorrow, USA or Mexico?"
**Context:** English.
**Action:** The AI evaluates the prompt against the system instructions.
**Expected Outcome:**
- The AI safely refuses to answer the out-of-scope question.
- Returns a polite redirection: "I'm here to help with stadium navigation and services at MetLife Stadium. Is there anything about the venue I can assist with?"
- No tool is called.
