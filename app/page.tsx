import "katex/dist/katex.min.css";
import { singlePage } from "@/components/Page";
import { rootSlug } from "@/lib/config";

// This ensures the page is statically generated at build time
export const generateStaticParams = () => [];

export default async function HomePage() {
  return singlePage(rootSlug);
}
