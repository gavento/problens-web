import "katex/dist/katex.min.css";
import { singlePage } from "@/components/Page";
import { getAllMdxPaths } from "@/lib/lib";
import { rootSlug } from "@/lib/config";
import { redirect, notFound } from "next/navigation";

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

  // Check if the path looks like an image file and return 404
  const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico"];
  const hasImageExtension = imageExtensions.some((ext) => path.toLowerCase().endsWith(ext));

  if (hasImageExtension) {
    // This is an image file request, return not found to let static assets handle it
    notFound();
  }

  return singlePage(path);
}
