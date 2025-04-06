import bibtexParse from "@orcid/bibtex-parse-js";
import { readFileSync } from "fs";

export type ParsedBibEntry = {
  citationKey: string;
  entryType: string;
  entryTags: Record<string, string>;
};

export type BibEntry = {
  author?: string;
  title?: string;
  year?: string | number;
  journal?: string;
  volume?: string;
  number?: string;
  pages?: string;
  publisher?: string;
  url?: string;
  note?: string;
  booktitle?: string;
  address?: string;
  organization?: string;
  month?: string | number;
  day?: string | number;
  urldate?: string;
  howpublished?: string;
};

// Utility function to clean and format BibTeX text
function cleanBibTeXText(text: string | undefined): string | undefined {
  if (!text) return undefined;

  return (
    text
      // Convert escaped braces to HTML entities
      .replace(/\\\{/g, "&lbrace;")
      .replace(/\\\}/g, "&rbrace;")
      // Remove surrounding braces
      .replace(/^\{|\}$/g, "")
      // Remove LaTeX-style formatting commands
      .replace(/\\emph\{([^}]*)\}/g, "$1")
      .replace(/\\textit\{([^}]*)\}/g, "$1")
      .replace(/\\textbf\{([^}]*)\}/g, "$1")
      // Handle special characters
      .replace(/\\&/g, "&")
      .replace(/\\\$/g, "$")
      .replace(/\\#/g, "#")
      .replace(/\\%/g, "%")
      .replace(/\\_/g, "_")
      // Handle accented characters
      .replace(/\\['`"^]?\{([aeiouAEIOUn])\}/g, "$1")
      .replace(/\\'([aeiou])/g, "$1")
      .replace(/\\"([aeiou])/g, "$1")
      .replace(/\\`([aeiou])/g, "$1")
      .replace(/\\^([aeiou])/g, "$1")
      .replace(/\\~([n])/g, "$1")
      // Handle special LaTeX characters
      .replace(/---/g, "—")
      .replace(/--/g, "–")
      .replace(/``/g, '"')
      .replace(/''/g, '"')
      // Clean up any remaining LaTeX commands
      .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
      .replace(/\\\w+/g, "")
      // Clean up multiple spaces
      .replace(/\s+/g, " ")
      .trim()
  );
}

// Format month numbers to names
function formatMonth(month: string | number | undefined): string | undefined {
  if (!month) return undefined;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (typeof month === "number") {
    return monthNames[month - 1];
  }

  // Handle numeric strings
  const monthNum = parseInt(month);
  if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
    return monthNames[monthNum - 1];
  }

  // Handle month abbreviations
  const monthAbbrev = month.toLowerCase().substring(0, 3);
  const monthIndex = monthNames.findIndex((m) => m.toLowerCase().startsWith(monthAbbrev));
  if (monthIndex !== -1) {
    return monthNames[monthIndex];
  }

  return cleanBibTeXText(month);
}

export function parseBibtex(bibtexContent: string): Record<string, BibEntry> {
  const parsed = bibtexParse.toJSON(bibtexContent);
  const result: Record<string, BibEntry> = {};

  parsed.forEach((entry: ParsedBibEntry) => {
    const tags = entry.entryTags;
    result[entry.citationKey.toLowerCase()] = {
      author: tags.AUTHOR || tags.author,
      title: tags.TITLE || tags.title,
      year: tags.YEAR || tags.year,
      journal: tags.JOURNAL || tags.journal,
      publisher: tags.PUBLISHER || tags.publisher,
      url: tags.URL || tags.url,
      organization: tags.ORGANIZATION || tags.organization,
      booktitle: tags.BOOKTITLE || tags.booktitle,
      volume: tags.VOLUME || tags.volume,
      number: tags.NUMBER || tags.number,
      pages: tags.PAGES || tags.pages,
      note: tags.NOTE || tags.note,
      month: tags.MONTH || tags.month,
      day: tags.DAY || tags.day,
      urldate: tags.URLDATE || tags.urldate,
      howpublished: tags.HOWPUBLISHED || tags.howpublished,
      address: tags.ADDRESS || tags.address,
    };
  });

  return result;
}

export function formatBibEntry(entry: BibEntry): BibEntry {
  return {
    author: cleanBibTeXText(entry.author),
    title: cleanBibTeXText(entry.title),
    year: entry.year,
    journal: cleanBibTeXText(entry.journal),
    publisher: cleanBibTeXText(entry.publisher),
    url: entry.url,
    organization: cleanBibTeXText(entry.organization),
    booktitle: cleanBibTeXText(entry.booktitle),
    volume: cleanBibTeXText(entry.volume),
    number: cleanBibTeXText(entry.number),
    pages: cleanBibTeXText(entry.pages),
    note: cleanBibTeXText(entry.note),
    month: formatMonth(entry.month),
    day: entry.day,
    urldate: cleanBibTeXText(entry.urldate),
    howpublished: cleanBibTeXText(entry.howpublished),
    address: cleanBibTeXText(entry.address),
  };
}

export function formatBibEntries(entries: Record<string, BibEntry>): Record<string, BibEntry> {
  return Object.fromEntries(Object.entries(entries).map(([key, entry]) => [key, formatBibEntry(entry)]));
}

// This function should only be called in server components
export async function loadBibtexFromFile(bibPath: string): Promise<Record<string, BibEntry>> {
  const bibtexContent = readFileSync(bibPath, "utf-8");
  const parsed = parseBibtex(bibtexContent);
  return formatBibEntries(parsed);
}
