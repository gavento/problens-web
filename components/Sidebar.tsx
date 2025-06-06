"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { CHAPTERS, TITLE } from "@/lib/config";
import { TableOfContents } from "./TableOfContents";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  className?: string;
  onLinkClick?: () => void;
  style?: React.CSSProperties;
}

export default function Sidebar({ className = "", onLinkClick, style }: SidebarProps) {
  const pathname = usePathname();
  const [prevActive, setPrevActive] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (prevActive !== pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevActive(pathname);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [pathname, prevActive]);

  return (
    <nav className={`${styles.sidebar} ${className}`} style={style}>
      <div className="mb-6">
        <Link href="/" onClick={onLinkClick} className="text-2xl font-semibold text-neutral-900 hover:text-neutral-600 transition-colors">
          {TITLE}
        </Link>
      </div>
      <ul className={styles.list}>
        {CHAPTERS.map(([title, path], index) => {
          // Render gaps as spacers
          if (title === "" && path === "") {
            return <li key={`gap-${index}`} className={styles.gap}></li>;
          }

          const href = `/${path}`;
          const isActive = pathname === href || (path === "" && pathname === "/");
          const wasActive = prevActive === href || (path === "" && prevActive === "/");

          return (
            <li key={path} className={styles.item}>
              <Link href={href} onClick={onLinkClick} className={`${styles.link} ${isActive ? styles.active : ""}`}>
                {title}
              </Link>
              <div
                className={`${styles.subsections} ${
                  (isActive || (wasActive && isTransitioning)) && styles.subsectionsVisible
                }`}
              >
                <div
                  className={`${styles.subsectionWrapper} ${
                    isActive ? styles.subsectionWrapperVisible : styles.subsectionWrapperHidden
                  }`}
                >
                  {(isActive || (wasActive && isTransitioning)) && (
                    <TableOfContents className={styles.tableOfContents} onSubsectionClick={onLinkClick} />
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
