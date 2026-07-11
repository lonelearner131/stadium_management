/**
 * MessageBubble component — renders a single chat message
 * with proper styling and accessibility attributes.
 *
 * @module components/MessageBubble
 */

'use client';

import React, { memo } from 'react';

interface MessageBubbleProps {
  /** The message role */
  role: 'user' | 'assistant';
  /** The message content */
  content: string;
  /** Accessibility label for screen readers */
  ariaLabel: string;
}

/**
 * Renders simple markdown-like formatting in text.
 * Supports bold (**text**) and bullet lists (• or -).
 * Uses a safe allowlist approach — no dangerouslySetInnerHTML.
 *
 * @param text - The text to render
 * @returns Array of React nodes
 */
function renderFormattedText(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (i > 0) {
      nodes.push(<br key={`br-${i}`} />);
    }

    // Check if it's a list item
    const listMatch = line.match(/^[•\-\*]\s+(.*)/);
    if (listMatch) {
      nodes.push(
        <span key={`li-${i}`} role="listitem" style={{ display: 'block', paddingLeft: '1em' }}>
          {'• '}
          {renderInlineFormatting(listMatch[1], `li-${i}`)}
        </span>
      );
      continue;
    }

    // Regular line with inline formatting
    nodes.push(
      <React.Fragment key={`line-${i}`}>
        {renderInlineFormatting(line, `line-${i}`)}
      </React.Fragment>
    );
  }

  return nodes;
}

/**
 * Renders inline formatting (bold markers) safely.
 *
 * @param text - The text line to process
 * @param keyPrefix - Key prefix for React elements
 * @returns Array of React nodes
 */
function renderInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the bold part
    parts.push(
      <strong key={`${keyPrefix}-b-${match.index}`}>{match[1]}</strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * A single chat message bubble with formatting and accessibility.
 */
function MessageBubbleInner({ role, content, ariaLabel }: MessageBubbleProps) {
  const formattedContent = React.useMemo(() => {
    return role === 'assistant' ? renderFormattedText(content) : content;
  }, [role, content]);

  return (
    <div
      className={`message-bubble ${role}`}
      role="article"
      aria-label={ariaLabel}
    >
      {formattedContent}
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleInner);
MessageBubble.displayName = 'MessageBubble';
