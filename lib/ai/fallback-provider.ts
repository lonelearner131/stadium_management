/**
 * Deterministic rule-based AI provider — used automatically when:
 * - No GEMINI_API_KEY is set
 * - The Gemini API errors or hits rate limits
 *
 * This makes the app fully functional offline/keyless by pattern-matching
 * user messages and invoking the same tools the Gemini provider would.
 *
 * @module ai/fallback-provider
 */

import type { AIProvider, GenerateOptions, StreamChunk, ToolCall } from '@/lib/ai/provider';
import { executeTool } from '@/lib/ai/tools';
import { getTranslations } from '@/lib/i18n';

/** Pattern-matched intent with associated tool call */
interface Intent {
  pattern: RegExp;
  toolCall: (match: RegExpMatchArray, message: string) => ToolCall | null;
  fallbackResponse: (match: RegExpMatchArray, message: string) => string;
}

/**
 * Extracts a section number from a message string.
 *
 * @param message - The user message
 * @returns The section number string or undefined
 */
function extractSection(message: string): string | undefined {
  const match = message.match(/section\s*(\d{3})/i) ?? message.match(/\b(1[0-3]\d)\b/);
  return match?.[1];
}

/**
 * Extracts a zone name from a message string.
 *
 * @param message - The user message
 * @returns The zone name or 'north' as default
 */
function extractZone(message: string): string {
  const zoneMatch = message.match(/\b(north|east|south|west)\b/i);
  return zoneMatch?.[1]?.toLowerCase() ?? 'north';
}

/**
 * Extracts a gate letter from a message string.
 *
 * @param message - The user message
 * @returns The gate letter or undefined
 */
function extractGate(message: string): string | undefined {
  const match = message.match(/gate\s*([A-Da-d])/i);
  return match?.[1]?.toUpperCase();
}

/**
 * Intent patterns for matching user messages to tool calls.
 * Order matters — first match wins.
 */
const intents: Intent[] = [

  // Accessible route
  {
    pattern: /\b(accessible|wheelchair|ramp|elevator|step.?free|disability|mobility|lift)\b/i,
    toolCall: (_match, msg) => {
      const section = extractSection(msg);
      const gate = extractGate(msg);
      if (section && gate) {
        return { name: 'getAccessibleRoute', args: { from: `Gate ${gate}`, to: `Section ${section}` } };
      }
      if (section) {
        return { name: 'getAccessibleRoute', args: { from: 'Main Entrance', to: `Section ${section}` } };
      }
      return null;
    },
    fallbackResponse: () =>
      'I can find you an accessible, step-free route! Please tell me where you\'re starting from and where you\'d like to go. For example, "accessible route from Gate A to Section 113".',
  },

  // Crowd status
  {
    pattern: /\b(crowd|busy|wait|queue|line|packed|full|density|how busy|crowded)\b/i,
    toolCall: (_match, msg) => {
      const gate = extractGate(msg);
      const zone = extractZone(msg);
      return { name: 'getCrowdStatus', args: { gateOrZone: gate ?? zone } };
    },
    fallbackResponse: () => 'Let me check the crowd levels for you.',
  },

  // Transportation
  {
    pattern: /\b(transport|bus|train|shuttle|taxi|uber|lyft|ride|parking|car|drive|subway|metro|transit|get here|getting here|leave|leaving|bicycle|bike)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getTransportOptions', args: { originArea: zone } };
    },
    fallbackResponse: () => 'Let me find transportation options for you.',
  },

  // Restroom
  {
    pattern: /\b(restroom|bathroom|toilet|wc|washroom|loo)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'restroom', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest restrooms for you.',
  },

  // Prayer room
  {
    pattern: /\b(prayer|pray|mosque|meditation|quiet room|worship)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'prayer_room', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest prayer and meditation room.',
  },

  // First aid
  {
    pattern: /\b(first aid|medical|nurse|doctor|hurt|injured|health|emergency)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'first_aid', nearZone: zone } };
    },
    fallbackResponse: () =>
      'For immediate emergencies, please contact the nearest staff member or call stadium security. Let me also find the nearest first aid station for you.',
  },

  // Family room
  {
    pattern: /\b(family|baby|child|kid|nursing|diaper|changing table|stroller)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      return { name: 'getAmenity', args: { type: 'family_room', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest family room for you.',
  },

  // Water refill / sustainability
  {
    pattern: /\b(water|refill|bottle|drinking|fountain|sustainability|recycle|recycling|compost|green|eco|environment)\b/i,
    toolCall: (_match, msg) => {
      const zone = extractZone(msg);
      if (/\b(recycle|recycling|compost|sustainability station|eco|green)\b/i.test(msg)) {
        return { name: 'getAmenity', args: { type: 'sustainability_station', nearZone: zone } };
      }
      return { name: 'getAmenity', args: { type: 'water_refill', nearZone: zone } };
    },
    fallbackResponse: () => 'Let me find the nearest sustainability station for you.',
  },

  // Translation
  {
    pattern: /\b(translate|how do you say|how to say|in spanish|in french|in arabic|en español|en français|بالعربية)\b/i,
    toolCall: (_match, msg) => {
      let targetLang = 'es';
      if (/\b(french|français)\b/i.test(msg)) targetLang = 'fr';
      if (/\b(arabic|عربي)\b/i.test(msg)) targetLang = 'ar';
      if (/\b(english)\b/i.test(msg)) targetLang = 'en';
      if (/\b(spanish|español)\b/i.test(msg)) targetLang = 'es';

      // Try to extract the phrase to translate
      const phraseMatch = msg.match(/(?:translate|how (?:do you|to) say)\s*["""]?(.+?)["""]?\s*(?:in|to)\s/i);
      const phrase = phraseMatch?.[1] ?? 'Hello';

      return { name: 'translateQuickPhrase', args: { phrase, targetLang } };
    },
    fallbackResponse: () =>
      'I can translate common fan phrases! Try asking something like "How do you say Goal! in Spanish?"',
  },

  // Section / seat finding
  {
    pattern: /\b(section|seat|where.*sit|find.*seat|my seat)\b/i,
    toolCall: (_match, msg) => {
      const section = extractSection(msg);
      if (section) {
        return { name: 'findGate', args: { section } };
      }
      return null;
    },
    fallbackResponse: () =>
      'I can help you find your seat! What section number is on your ticket? For example, "Section 118".',
  },

  // Gate finding (moved to bottom as 'gate' is a common word)
  {
    pattern: /\b(gate|entrance|enter|find.*gate|which gate|my gate)\b/i,
    toolCall: (_match, msg) => {
      const section = extractSection(msg);
      if (section) {
        return { name: 'findGate', args: { section } };
      }
      return null;
    },
    fallbackResponse: () =>
      'I can help you find your gate! Could you tell me your section number? For example, "Section 101" or just the number like "125".',
  },
];

/**
 * Formats a tool result into a human-readable response string.
 *
 * @param toolResult - The tool result to format
 * @returns A formatted response string
 */
function formatToolResult(toolResult: Record<string, unknown>): string {
  if (toolResult.error) {
    return String(toolResult.message ?? 'Sorry, I couldn\'t find that information.');
  }

  const name = toolResult.toolName as string | undefined;

  // Format based on tool type
  if (name === 'findGate' || toolResult.gate) {
    const parts = [`Your nearest gate is **${toolResult.gate}** (${toolResult.zone} zone).`];
    parts.push(`Walk time: approximately **${toolResult.walkTimeMinutes} minutes**.`);
    parts.push(`Nearest parking: ${toolResult.nearestParking}.`);
    if (toolResult.accessible !== undefined) {
      parts.push(
        toolResult.hasRamp ? '♿ Ramp access available.' : '',
        toolResult.hasElevator ? 'Elevator available.' : ''
      );
      if (toolResult.accessibleRoute) {
        parts.push(`\nAccessible route: ${toolResult.accessibleRoute}`);
      }
      if (toolResult.warning) {
        parts.push(`\n⚠️ ${toolResult.warning}`);
        if (toolResult.nearestAccessibleSection) {
          parts.push(`Nearest accessible section: ${toolResult.nearestAccessibleSection}`);
        }
      }
    }
    return parts.filter(Boolean).join(' ');
  }

  if (name === 'getAccessibleRoute' || toolResult.stepFree !== undefined) {
    const parts = [
      `**Accessible Route** from ${toolResult.from} to ${toolResult.to}:`,
      String(toolResult.description),
      `Estimated time: **${toolResult.estimatedMinutes} minutes**.`,
      `Step-free: ${toolResult.stepFree ? '✅ Yes' : '❌ No'}`,
    ];
    if (Array.isArray(toolResult.landmarks) && toolResult.landmarks.length > 0) {
      parts.push(`Landmarks: ${(toolResult.landmarks as string[]).join(' → ')}`);
    }
    if (toolResult.note) {
      parts.push(`\n📝 ${toolResult.note}`);
    }
    return parts.join('\n');
  }

  if (name === 'getCrowdStatus' || toolResult.density !== undefined) {
    const densityEmoji = toolResult.density === 'low' ? '🟢' : toolResult.density === 'medium' ? '🟡' : '🔴';
    const parts = [
      `**${toolResult.location}** — Crowd density: ${densityEmoji} **${String(toolResult.density).toUpperCase()}**`,
      `Estimated wait: ~${toolResult.estimatedWaitMinutes} minutes.`,
      String(toolResult.advice ?? ''),
    ];
    if (toolResult.alternateRecommendation) {
      parts.push(`💡 Recommended alternative: **${toolResult.alternateRecommendation}**`);
    }
    return parts.join('\n');
  }

  if (name === 'getTransportOptions' || toolResult.options) {
    const options = toolResult.options as Array<Record<string, unknown>>;
    const parts = [`**Transportation options** (sorted by sustainability):\n`];
    for (const opt of options) {
      parts.push(
        `• **${opt.name}** (${opt.type})`,
        `  ${opt.sustainabilityNote}`,
        `  Schedule: ${opt.schedule}`,
        `  Nearest: ${opt.nearestGate} (~${opt.walkToGateMinutes} min walk)`,
        `  ${opt.accessible ? '♿ Accessible' : '⚠️ May not be fully accessible'}`,
        ''
      );
    }
    return parts.join('\n');
  }

  if (name === 'getAmenity' || toolResult.results) {
    const results = toolResult.results as Array<Record<string, unknown>>;
    const type = String(toolResult.type ?? 'amenity').replace(/_/g, ' ');
    const parts = [`**Nearest ${type}${results.length > 1 ? 's' : ''}:**\n`];
    for (const r of results.slice(0, 3)) {
      const notes: string[] = [];
      if (r.accessible) notes.push('♿ Accessible');
      if (r.familyFriendly) notes.push('👨‍👩‍👧 Family-friendly');
      if (r.sustainability) notes.push('🌱 Sustainability feature');
      if (Array.isArray(r.features)) notes.push(`Features: ${(r.features as string[]).join(', ')}`);

      parts.push(`• **${r.name}** — ${r.zone} zone, ${r.level} level`);
      if (notes.length > 0) parts.push(`  ${notes.join(' | ')}`);
      parts.push('');
    }
    return parts.join('\n');
  }

  if (name === 'translateQuickPhrase' || toolResult.translatedPhrase) {
    if (toolResult.note) {
      return `${toolResult.note}`;
    }
    return `**"${toolResult.originalPhrase}"** in ${toolResult.targetLanguage}: **"${toolResult.translatedPhrase}"**\n(Meaning: ${toolResult.meaning})`;
  }

  // Generic fallback for unknown tool results
  return JSON.stringify(toolResult, null, 2);
}

/**
 * FallbackProvider — deterministic, rule-based AI provider.
 * Pattern-matches user messages to invoke tools and generate responses
 * without requiring any external API.
 */
export class FallbackProvider implements AIProvider {
  readonly name = 'fallback';

  /**
   * Always available — this is the offline provider.
   *
   * @returns true
   */
  isAvailable(): boolean {
    return true;
  }

  /**
   * Generates a streaming response using pattern matching and tools.
   *
   * @param options - Generation options
   * @returns Async iterable of stream chunks
   */
  async *generateStream(options: GenerateOptions): AsyncIterable<StreamChunk> {
    const { message, sessionContext } = options;
    const t = getTranslations(sessionContext.language);

    // Check if we should ask about accessibility (first message, hasn't been asked)
    const shouldAskAccessibility =
      !sessionContext.hasAskedAboutAccessibility &&
      !sessionContext.accessibilityMode &&
      options.history.length <= 2;

    // Try to match an intent
    let matched = false;
    for (const intent of intents) {
      const match = message.match(intent.pattern);
      if (match) {
        matched = true;
        const toolCall = intent.toolCall(match, message);

        if (toolCall) {
          // Emit tool call
          yield { type: 'tool_call', toolCall };

          // Execute tool
          const toolResult = executeTool(toolCall, sessionContext.accessibilityMode);
          yield { type: 'tool_result', toolResult };

          // Format and stream the response
          const resultData = toolResult.result as Record<string, unknown>;
          // Attach toolName for formatting
          resultData.toolName = toolResult.toolName;
          const response = formatToolResult(resultData);

          // Stream character by character for perceived performance
          const words = response.split(' ');
          for (let i = 0; i < words.length; i++) {
            yield { type: 'text', content: (i === 0 ? '' : ' ') + words[i] };
          }
        } else {
          // No tool call possible (missing params), ask for more info
          const fallback = intent.fallbackResponse(match, message);
          const words = fallback.split(' ');
          for (let i = 0; i < words.length; i++) {
            yield { type: 'text', content: (i === 0 ? '' : ' ') + words[i] };
          }
        }

        break;
      }
    }

    // No intent matched — general help response
    if (!matched) {
      // Check if it's a greeting
      const isGreeting = /\b(hi|hello|hey|howdy|good morning|good afternoon|good evening|hola|bonjour|مرحبا)\b/i.test(message);

      let response: string;
      if (isGreeting) {
        response = t.ui.welcomeMessage;
      } else if (/\b(help|what can you do|menu|options)\b/i.test(message)) {
        response =
          'I can help you with:\n\n• 🚪 **Finding your gate** — tell me your section number\n• ♿ **Accessible routes** — step-free paths with ramps and elevators\n• 👥 **Crowd status** — check how busy gates and zones are\n• 🚌 **Transportation** — trains, buses, shuttles, and sustainable options\n• 🚻 **Amenities** — restrooms, first aid, prayer rooms, family rooms\n• 🌱 **Sustainability** — water refill stations, recycling hubs\n• 🌍 **Translation** — common fan phrases in English, Spanish, French, Arabic\n\nJust ask naturally and I\'ll help!';
      } else {
        response =
          'I\'m here to help with stadium navigation and services at MetLife Stadium for FIFA World Cup 2026. You can ask me about finding your gate, accessible routes, crowd levels, transportation, restrooms, and more. How can I assist you?';
      }

      const words = response.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield { type: 'text', content: (i === 0 ? '' : ' ') + words[i] };
      }
    }

    // Add accessibility prompt if appropriate
    if (shouldAskAccessibility) {
      const accessMsg =
        '\n\nBy the way, do you need accessible routing? I can find step-free paths with ramps and elevators. Just let me know or toggle the ♿ accessibility mode.';
      const words = accessMsg.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield { type: 'text', content: (i === 0 ? '' : ' ') + words[i] };
      }
    }

    yield { type: 'done' };
  }
}
