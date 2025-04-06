/**
 * Citations system for MDX documents. Provides numbered citations with tooltips and a references section.
 *
 * Usage:
 * ```tsx
 * <CitationsProvider data={bibData}>
 *   <p>
 *     Single citation <Cite>smith2023</Cite>
 *     Multiple citations <Cite>smith2023,jones2024</Cite>
 *   </p>
 *   <References />
 * </CitationsProvider>
 * ```
 *
 * - Use `<Cite>` with BibTeX key(s): `<Cite>key</Cite>` or `<Cite>key1,key2</Cite>`
 * - Multiple keys are comma-separated without spaces
 * - Citations appear as numbers [1] with hover tooltips showing the reference
 * - Place `<References />` at the bottom to render the references section
 * - All components must be wrapped in `<CitationsProvider data={bibData}>`
 * - bibData should be a Record<string, BibEntry> containing BibTeX-like entries
 */

"use client";

import React, { createContext, useContext, useState } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import styles from "./Citations.module.css";
import type { BibEntry } from "../lib/citations";

type CitationsContextType = {
  citations: Set<string>;
  citationOrder: string[];
  addCitation: (key: string) => void;
  bibData: Record<string, BibEntry>;
};

// Create context for tracking citations
const CitationsContext = createContext<CitationsContextType>({
  citations: new Set(),
  citationOrder: [],
  addCitation: () => {},
  bibData: {},
});

export function CitationsProvider({
  children,
  data = {},
}: {
  children: React.ReactNode;
  data?: Record<string, BibEntry>;
}) {
  const [citations, setCitations] = useState<Set<string>>(new Set());
  const [citationOrder, setCitationOrder] = useState<string[]>([]);
  const [bibData] = useState<Record<string, BibEntry>>(data);

  const addCitation = React.useCallback((key: string) => {
    setCitations((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setCitationOrder((prev) => {
      if (prev.includes(key)) return prev;
      return [...prev, key];
    });
  }, []);

  return (
    <CitationsContext.Provider value={{ citations, citationOrder, addCitation, bibData }}>
      {children}
    </CitationsContext.Provider>
  );
}

// Citation preview for tooltip
function CitationPreview({ entry }: { entry: BibEntry }) {
  const cleanTitle = entry.title?.replace(/[{}]/g, "");

  return (
    <span>
      {formatAuthors(entry.author)}
      {entry.year ? ` (${entry.year}). ` : ". "}
      {cleanTitle && (
        <span>
          {cleanTitle}
          {cleanTitle.endsWith("?") || cleanTitle.endsWith(".") ? " " : ". "}
        </span>
      )}
      {entry.journal && (
        <span>
          <em>{entry.journal}</em>
          {entry.volume && `, ${entry.volume}`}
          {entry.number && `(${entry.number})`}
          {entry.pages && `, ${entry.pages.replace(/--/g, "–")}`}
        </span>
      )}
    </span>
  );
}

// Citation component
export function Cite({ children }: { children: string }) {
  const { addCitation, bibData, citationOrder } = useContext(CitationsContext);
  const keys = children.split(",").map((key) => key.trim().toLowerCase());
  const entries = keys.map((key) => bibData[key]).filter((entry): entry is BibEntry => !!entry);

  React.useEffect(() => {
    keys.forEach((key) => addCitation(key));
  }, [keys, addCitation]);

  return (
    <HoverCard.Root openDelay={100} closeDelay={300}>
      <HoverCard.Trigger asChild>
        <span className={styles.citation}>
          [
          {keys.map((key, index) => {
            const entry = bibData[key];
            const citationNumber = citationOrder.indexOf(key) + 1;

            if (!entry) {
              console.warn(`Citation key not found: ${key}`);
              return (
                <React.Fragment key={key}>
                  <span className={styles["citation-link"]}>?</span>
                  {index < keys.length - 1 ? ", " : ""}
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={key}>
                <a href={`#ref-${key}`} className={styles["citation-link"]}>
                  {citationNumber}
                </a>
                {index < keys.length - 1 ? ", " : ""}
              </React.Fragment>
            );
          })}
          ]
        </span>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content className={styles["citation-tooltip"]} sideOffset={5}>
          {entries.map((entry, index) => (
            <span key={index} className={styles["tooltip-entry"]}>
              <CitationPreview entry={entry} />
            </span>
          ))}
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

// Format author names for citation
function formatAuthors(authors: string | undefined): string {
  if (!authors) return "";

  const authorList = authors.split(" and ");
  if (authorList.length === 1) {
    return authorList[0].split(",")[0];
  } else if (authorList.length === 2) {
    return `${authorList[0].split(",")[0]} and ${authorList[1].split(",")[0]}`;
  } else {
    return `${authorList[0].split(",")[0]} et al.`;
  }
}

// BibEntry component
function BibEntry({ entry, id }: { entry: BibEntry; id: string }) {
  return (
    <div id={`ref-${id}`} className={styles["reference-item"]}>
      {formatAuthors(entry.author)}
      {entry.year ? ` (${entry.year}). ` : ". "}
      {entry.title && (
        <span>
          {entry.title}
          {entry.title.endsWith("?") || entry.title.endsWith(".") ? " " : ". "}
        </span>
      )}
      {entry.booktitle && (
        <span>
          In <em>{entry.booktitle}</em>
          {entry.pages ? `, pp. ${entry.pages.replace(/--/g, "–")}` : ""}
          {". "}
        </span>
      )}
      {entry.journal && (
        <span>
          <em>{entry.journal}</em>
          {entry.volume && `, ${entry.volume}`}
          {entry.number && `(${entry.number})`}
          {entry.pages && `, ${entry.pages.replace(/--/g, "–")}`}
          {". "}
        </span>
      )}
      {entry.publisher && `${entry.publisher}`}
      {entry.address && `, ${entry.address}`}
      {(entry.publisher || entry.address) && ". "}
      {entry.url && (
        <span>
          <a href={entry.url} className={styles["citation-link"]} target="_blank" rel="noopener noreferrer">
            {entry.url}
          </a>
          {". "}
        </span>
      )}
      {entry.note && `${entry.note}. `}
    </div>
  );
}

// Client-side References component
export function References({
  headerLevel = 2,
  headerText = "References",
}: {
  headerLevel?: number;
  headerText?: string;
}) {
  const { bibData, citationOrder } = useContext(CitationsContext);

  if (citationOrder.length === 0) return null;
  return (
    <div id="references" className={styles.references}>
      {headerLevel && headerText ? React.createElement(`h${headerLevel}`, null, headerText) : null}
      <div className={styles["reference-list"]}>
        {citationOrder.map((key) => {
          const entry = bibData[key];
          if (!entry) return null;
          return <BibEntry key={key} id={key} entry={entry} />;
        })}
      </div>
    </div>
  );
}
