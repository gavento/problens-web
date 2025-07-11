"use client";

import React, { useMemo } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import styles from "./Tooltip.module.css";

interface TooltipProps {
  children: React.ReactNode;
  tooltip: string | React.ReactNode;
  /** Optional delay before tooltip shows (default: 100ms) */
  openDelay?: number;
  /** Optional delay before tooltip hides (default: 300ms) */
  closeDelay?: number;
}

/**
 * Simple markdown parser for tooltip content
 */
function parseSimpleMarkdown(text: string): React.ReactNode {
  // Convert text to structured format
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) {
      // Empty line creates a break
      elements.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Handle list items: - item
    if (line.trim().startsWith("- ")) {
      const listContent = line.trim().substring(2);
      const processedContent = processInlineMarkdown(listContent, lineIndex);
      elements.push(
        <div key={`list-${lineIndex}`} className={styles["tooltip-list-item"]}>
          • {processedContent}
        </div>,
      );
      return;
    }

    // Handle regular paragraph
    const processedContent = processInlineMarkdown(line, lineIndex);
    elements.push(
      <div key={`line-${lineIndex}`} className={styles["tooltip-line"]}>
        {processedContent}
      </div>,
    );
  });

  return elements;
}

/**
 * Process inline markdown within a line of text
 */
function processInlineMarkdown(text: string, lineIndex: number): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let partIndex = 0;

  while (remaining) {
    // Handle images: ![alt](src)
    const imageMatch = remaining.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    if (imageMatch) {
      const beforeImage = remaining.substring(0, imageMatch.index);
      if (beforeImage) {
        elements.push(...processTextMarkdown(beforeImage, `${lineIndex}-${partIndex++}`));
      }

      const alt = imageMatch[1];
      const src = imageMatch[2];
      const adjustedSrc = src.startsWith("/") ? `/problens-web${src}` : src;

      elements.push(
        <img key={`${lineIndex}-img-${partIndex++}`} src={adjustedSrc} alt={alt} className={styles["tooltip-image"]} />,
      );

      remaining = remaining.substring(imageMatch.index! + imageMatch[0].length);
      continue;
    }

    // No more special elements, process remaining as text
    elements.push(...processTextMarkdown(remaining, `${lineIndex}-${partIndex++}`));
    break;
  }

  return elements;
}

/**
 * Process text-level markdown (bold, italic, code, links)
 */
function processTextMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  let remaining = text;
  let partIndex = 0;

  while (remaining) {
    // Handle bold: **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    if (boldMatch) {
      const beforeBold = remaining.substring(0, boldMatch.index);
      if (beforeBold) {
        elements.push(...processSimpleText(beforeBold, `${keyPrefix}-${partIndex++}`));
      }

      elements.push(
        <strong key={`${keyPrefix}-bold-${partIndex++}`} className={styles["tooltip-strong"]}>
          {boldMatch[1]}
        </strong>,
      );

      remaining = remaining.substring(boldMatch.index! + boldMatch[0].length);
      continue;
    }

    // Handle italic: *text* (but not **)
    const italicMatch = remaining.match(/\*([^*]+)\*/);
    if (italicMatch) {
      const beforeItalic = remaining.substring(0, italicMatch.index);
      if (beforeItalic) {
        elements.push(...processSimpleText(beforeItalic, `${keyPrefix}-${partIndex++}`));
      }

      elements.push(
        <em key={`${keyPrefix}-italic-${partIndex++}`} className={styles["tooltip-em"]}>
          {italicMatch[1]}
        </em>,
      );

      remaining = remaining.substring(italicMatch.index! + italicMatch[0].length);
      continue;
    }

    // Handle code: `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch) {
      const beforeCode = remaining.substring(0, codeMatch.index);
      if (beforeCode) {
        elements.push(...processSimpleText(beforeCode, `${keyPrefix}-${partIndex++}`));
      }

      elements.push(
        <code key={`${keyPrefix}-code-${partIndex++}`} className={styles["tooltip-code"]}>
          {codeMatch[1]}
        </code>,
      );

      remaining = remaining.substring(codeMatch.index! + codeMatch[0].length);
      continue;
    }

    // Handle links: [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const beforeLink = remaining.substring(0, linkMatch.index);
      if (beforeLink) {
        elements.push(...processSimpleText(beforeLink, `${keyPrefix}-${partIndex++}`));
      }

      elements.push(
        <a
          key={`${keyPrefix}-link-${partIndex++}`}
          href={linkMatch[2]}
          className={styles["tooltip-link"]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>,
      );

      remaining = remaining.substring(linkMatch.index! + linkMatch[0].length);
      continue;
    }

    // No more markdown, add remaining as plain text
    elements.push(...processSimpleText(remaining, `${keyPrefix}-${partIndex++}`));
    break;
  }

  return elements;
}

/**
 * Process plain text (no markdown)
 */
function processSimpleText(text: string, keyPrefix: string): React.ReactNode[] {
  if (!text) return [];
  return [text];
}

/**
 * Tooltip component that shows Markdown content on hover.
 *
 * Usage:
 * ```tsx
 * <Tooltip tooltip="This explains the concept with **bold** text and ![image](/path/to/image.png)">hover text</Tooltip>
 * ```
 */
export function Tooltip({ children, tooltip, openDelay = 100, closeDelay = 300 }: TooltipProps) {
  const renderedContent = useMemo(() => {
    if (typeof tooltip === "string") return parseSimpleMarkdown(tooltip);
    return tooltip;
  }, [tooltip]);

  return (
    <HoverCard.Root openDelay={openDelay} closeDelay={closeDelay}>
      <HoverCard.Trigger asChild>
        <span className={styles["tooltip-trigger"]}>{children}</span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className={styles["tooltip-content"]} sideOffset={5}>
          <div className={styles["tooltip-paragraph"]}>{renderedContent}</div>
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
