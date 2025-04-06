import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import { CitationsProvider, References } from "./Citations";
import { loadBibtexFromFile } from "@/lib/citations";
import { getMdxContent } from "@/lib/lib";
import { referencesPath } from "@/lib/config";
import { Footnotes, FootnotesProvider } from "./Footnotes";
import styles from "./Page.module.css";

interface PageProps {
  children: ReactNode;
}

export default async function Page({ children }: PageProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <div className="flex-1">
        <Sidebar
          className="xl:w-60 lg:w-52 hidden lg:block fixed top-16 bottom-0 pt-16 text-base"
          style={{ left: "var(--sidebar-offset)" }}
        />
        <main className={`${styles.main} max-w-[var(--content-width)] mx-auto px-4 pt-12 pb-8`}>{children}</main>
      </div>
      <Footer />
    </div>
  );
}

export async function singlePage(path: string) {
  const content = await getMdxContent(path);
  const references = await loadBibtexFromFile(referencesPath);
  return (
    <CitationsProvider data={references}>
      <FootnotesProvider>
        <article className={`${styles.article} prose prose-neutral max-w-none`}>
          {content}
          <Footnotes headerLevel={0} />
          <References />
        </article>
      </FootnotesProvider>
    </CitationsProvider>
  );
}
