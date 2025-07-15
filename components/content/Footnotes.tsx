/**
 * Footnotes system for MDX documents.
 *
 * Usage:
 * ```tsx
 * <FootnotesProvider>
 *   <p>
 *     First reference<Footnote mark="*">Equal contribution</Footnote>,
 *     second reference<Footnote mark="*" />.
 *     Auto-numbered footnote<Footnote>This will be numbered automatically</Footnote>.
 *   </p>
 *   <Footnotes />
 * </FootnotesProvider>
 * ```
 *
 * - Use `<Footnote>` with text content for first reference: `<Footnote mark="a">Your footnote text</Footnote>`
 * - For subsequent references, use self-closing tag: `<Footnote mark="a" />`
 * - Omit mark for auto-numbered footnotes
 * - Place `<Footnotes />` at the bottom to render the footnotes section
 * - All components must be wrapped in `<FootnotesProvider>`
 */

"use client";

import React, { createContext, useContext, useState, useRef } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import styles from "./Footnotes.module.css";

type FootnoteEntry = {
  content: React.ReactNode;
  mark: string;
  locations: number[];
};

type FootnotesContextType = {
  footnotes: Map<string, FootnoteEntry>;
  footnoteOrder: string[];
  registerFootnote: (content: React.ReactNode, mark: string | undefined) => [string, number];
  autoMarkCounter: React.MutableRefObject<number>;
  locationCounter: React.MutableRefObject<number>;
};

// Create context for tracking footnotes
const FootnotesContext = createContext<FootnotesContextType | null>(null);

export function FootnotesProvider({ children }: { children: React.ReactNode }) {
  const [footnotes] = useState<Map<string, FootnoteEntry>>(() => new Map());
  const [footnoteOrder] = useState<string[]>(() => []);
  const autoMarkCounter = useRef(0);
  const locationCounter = useRef(0);

  // Create the registration function
  const registerFootnote = (content: React.ReactNode, mark: string | undefined): [string, number] => {
    const location = ++locationCounter.current;

    if (mark) {
      const id = `footnote-${mark}`;
      if (!footnotes.has(id) && content) {
        footnotes.set(id, {
          content,
          mark,
          locations: [location],
        });
        footnoteOrder.push(id);
      } else if (footnotes.has(id)) {
        const entry = footnotes.get(id)!;
        entry.locations.push(location);
      }
      return [id, location];
    } else if (content) {
      const num = ++autoMarkCounter.current;
      const id = `footnote-${num}`;
      if (!footnotes.has(id)) {
        footnotes.set(id, {
          content,
          mark: num.toString(),
          locations: [location],
        });
        footnoteOrder.push(id);
      }
      return [id, location];
    }
    return ["footnote-1", location]; // Fallback, should never happen
  };

  return (
    <FootnotesContext.Provider value={{ footnotes, footnoteOrder, registerFootnote, autoMarkCounter, locationCounter }}>
      {children}
    </FootnotesContext.Provider>
  );
}

function useFootnotes() {
  const context = useContext(FootnotesContext);
  if (!context) {
    throw new Error("useFootnotes must be used within a FootnotesProvider");
  }
  return context;
}

// Update Footnote component type definition
export function Footnote({ children, mark }: { children?: React.ReactNode; mark?: string }) {
  const { footnotes, registerFootnote } = useFootnotes();
  const markRef = useRef<string | undefined>(mark);
  const footnoteIdRef = useRef<string | undefined>(undefined);
  const locationRef = useRef<number | undefined>(undefined);

  if (!footnoteIdRef.current) {
    const [id, location] = registerFootnote(children, markRef.current);
    footnoteIdRef.current = id;
    locationRef.current = location;
  }

  const footnote = footnotes.get(footnoteIdRef.current);

  if (!footnote) return null;

  return (
    <HoverCard.Root openDelay={100} closeDelay={300}>
      <HoverCard.Trigger asChild>
        <sup id={`ref-${footnoteIdRef.current}-${locationRef.current}`} className={styles.footnote}>
          <span className={styles["footnote-link"]}>
            {footnote.mark}
          </span>
        </sup>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className={styles["footnote-tooltip"]} sideOffset={5}>
          {children || footnote.content}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
// Footnotes section component - now only keeps tooltips, no bottom list
export function Footnotes({ headerLevel = 2 }: { headerLevel?: number }) {
  // Return null to not render the footnotes section at the bottom
  return null;
}
