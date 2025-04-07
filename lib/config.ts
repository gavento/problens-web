import { join } from "path";

export const TITLE = "Probabilistic Lenses";
export const DESCRIPTION = "Probabilistic Lenses";
export const TITLE_SHORT = "Probabilistic Lenses";
export const TITLE_ABBR = "Probabilistic Lenses";
export const CHAPTERS = [
  ["Introduction", "00-introduction"],
  ["Quantifying Information, Belief, and Surprise", "01-quantifying"],
  ["Updating Beliefs & Learning from Constraints", "02-updating"],
  ["Building & Comparing Models", "03-modeling"],
  ["Advanced Connections and Perspectives", "04-advanced"],
  ["Resources", "resources"],
  ["About", "about"],
];
export const rootSlug = "index";
export const contentDirectory = join(process.cwd(), "public");
export const GTM_ID = undefined;
export const referencesPath = join(contentDirectory, "references.bib");
