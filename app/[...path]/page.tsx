import "katex/dist/katex.min.css";
import { singlePage } from "@/components/Page";
import { getAllMdxPaths } from "@/lib/lib";
import { rootSlug, PARTS, META_PAGES } from "@/lib/config";
import { redirect, notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    path: string[];
  }>;
}

export async function generateStaticParams() {
  const paths: string[][] = [];
  
  // Add all chapter paths from PARTS
  PARTS.forEach(part => {
    part.chapters.forEach(([_, slug]) => {
      if (slug && slug !== "") {
        paths.push([slug]);
      }
    });
  });
  
  // Add all meta pages
  META_PAGES.forEach(([_, slug]) => {
    if (slug && slug !== "") {
      paths.push([slug]);
    }
  });
  
  // Add any other MDX files that might not be in config
  const allMdxFiles = getAllMdxPaths();
  allMdxFiles.forEach(file => {
    // Only add if not already included
    if (!paths.some(p => p[0] === file)) {
      paths.push([file]);
    }
  });
  
  return paths.map(path => ({ path }));
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
