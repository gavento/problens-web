import { join } from "path";

export const TITLE = "Applied Information Theory: A Computational Toolkit";
export const DESCRIPTION = "A computational toolkit for applied information theory";
export const TITLE_SHORT = "Applied Information Theory";
export const TITLE_ABBR = "Applied Information Theory";
export const CHAPTERS = [
  ["Introduction", "index"],
  ["Quantifying", "01-quantifying"],
  ["Updating", "02-updating"],
  ["Modeling", "03-modeling"],
  ["Advanced", "04-advanced"],
  ["Resources", "resources"],
  ["About", "about"],
];
export const rootSlug = "index";
export const contentDirectory = join(process.cwd(), "public");
export const GTM_ID = undefined;
export const referencesPath = join(contentDirectory, "references.bib");
