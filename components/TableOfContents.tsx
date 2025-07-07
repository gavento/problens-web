"use client";

import React, { useEffect, useState } from "react";
import styles from "./TableOfContents.module.css";

type Section = {
  id: string;
  text: string;
  level: number;
};

interface TableOfContentsProps {
  className?: string;
  onSubsectionClick?: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function TableOfContents({ className = "", onSubsectionClick }: TableOfContentsProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile on mount and window resize
    const checkMobile = () => setIsMobile(window.innerWidth < 1024); // 1024 matches lg breakpoint
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let intObserver: IntersectionObserver | null = null;

    const collect = () => {
      const headings = Array.from(document.querySelectorAll("h2")).filter(
        (heading) => !["Footnotes", "References"].includes(heading.textContent || ""),
      );

      const extracted = headings.map((heading) => {
        if (!heading.id) {
          heading.id = slugify(heading.textContent || "");
        }
        const full = heading.textContent || "";
        const short = full.includes(":") ? full.split(":")[0].trim() : full;
        return { id: heading.id, text: short, level: 2 } as Section;
      });
      setSections(extracted);

      // reset intersection observer
      if (intObserver) intObserver.disconnect();
      if (!isMobile && headings.length) {
        intObserver = new IntersectionObserver(
          (entries) => {
            let maxRatio = 0;
            let currentId = activeSection;
            entries.forEach((entry) => {
              if (entry.intersectionRatio > maxRatio) {
                maxRatio = entry.intersectionRatio;
                currentId = entry.target.id;
              }
            });
            if (currentId) setActiveSection(currentId);
          },
          {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: "-48px 0px -80% 0px",
          },
        );
        headings.forEach((h) => intObserver!.observe(h));
      }
    };

    collect();

    // if no headings yet, keep retrying up to 10 times
    let attempts = 0;
    const retryTimer = setInterval(() => {
      attempts += 1;
      if (sections.length === 0 && attempts < 10) {
        collect();
      } else {
        clearInterval(retryTimer);
      }
    }, 300);

    const mo = new MutationObserver(() => collect());
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      intObserver?.disconnect();
    };
  }, [isMobile]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      onSubsectionClick?.();
    }
  };

  console.log("TableOfContents render: sections.length =", sections.length, "className =", className);

  if (sections.length === 0) {
    console.log("TableOfContents: No sections, returning null");
    return null;
  }

  return (
    <div className={className}>
      <ul className={styles.list}>
        {sections.map((section) => (
          <li key={section.id} className={styles.item}>
            <a
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(section.id);
              }}
              className={`${styles.link} ${!isMobile && activeSection === section.id ? styles.active : ""}`}
            >
              {section.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
