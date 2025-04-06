declare module "@orcid/bibtex-parse-js" {
  export function toJSON(bibtex: string): Array<{
    citationKey: string;
    entryType: string;
    entryTags: Record<string, string>;
  }>;
}
