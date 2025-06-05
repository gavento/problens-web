import { join } from "path";

export const TITLE = "KL divergence: the best bits";
export const DESCRIPTION = "KL divergence: the best bits";
export const TITLE_SHORT = "KL divergence";
export const TITLE_ABBR = "KL divergence";
export const CHAPTERS = [
  ["Riddles", "00-introduction"],
  ["", ""], // Gap
  ["KL divergence & Bayes", "01-kl_intro"],
  ["Crossentropy & Entropy", "02-crossentropy"],
  ["Minimizing KL", "03-minimizing"],
  ["Max entropy distributions", "04-max_entropy"],
  ["Machine learning", "05-machine_learning"],
  ["", ""], // Gap
  ["Resources", "resources"],
  ["About", "about"],
  ["", ""], // Gap
  ["Multiplicative weights", "06-algorithms"],
  ["Fisher information", "07-fisher_info"],
  ["Kolmogorov complexity", "08-kolmogorov"],
];
export const rootSlug = "index";
export const contentDirectory = join(process.cwd(), "public");
export const GTM_ID = undefined;
export const referencesPath = join(contentDirectory, "references.bib");
