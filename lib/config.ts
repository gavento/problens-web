import { join } from "path";

export const TITLE = "KL divergence: the good bits";
export const DESCRIPTION = "KL divergence: the good bits";
export const TITLE_SHORT = "KL divergence";
export const TITLE_ABBR = "KL divergence";
export const CHAPTERS = [
  ["Riddles", "00-introduction"],
  ["KL divergence & Bayes' rule", "01-kl_intro"],
  ["Crossentropy & Entropy", "02-crossentropy"],
  ["Minimizing KL", "03-minimizing"],
  ["Max entropy distributions", "04-max_entropy"],
  ["Machine learning", "05-machine_learning"],
  ["Additional topics", "06-algorithms"],
  // ["Multiplicative weights", "06-algorithms"],
  // ["Statistics & Fisher information", "07-fisher_info"],
  ["Resources", "resources"],
  ["About", "about"],
];
export const rootSlug = "index";
export const contentDirectory = join(process.cwd(), "public");
export const GTM_ID = undefined;
export const referencesPath = join(contentDirectory, "references.bib");
