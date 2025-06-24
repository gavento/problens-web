import "katex/dist/katex.min.css";
import { singlePage } from "@/components/Page";
import { getAllMdxPaths } from "@/lib/lib";
import { rootSlug } from "@/lib/config";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    path: string[];
  }>;
}

export async function generateStaticParams() {
  const paths = getAllMdxPaths();
  return paths.map((path) => ({
    path: [path],
  }));
}

export default async function ChapterPage({ params }: PageProps) {
  const path = (await params).path.join("/");

  return singlePage(path);
}
