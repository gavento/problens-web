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
    // Delay to ensure content is rendered
    const timer = setTimeout(() => {
      // Get all h2 elements from the document, excluding Footnotes and References
      const headings = Array.from(document.querySelectorAll("h2")).filter(
        (heading) => !["Footnotes", "References"].includes(heading.textContent || "")
      );

      console.log('TableOfContents: Found headings:', headings.length, headings.map(h => h.textContent));

      const extractedSections = headings.map((heading) => {
        // Generate ID if not present
        if (!heading.id) {
          heading.id = slugify(heading.textContent || "");
        }
        
        // Extract shorter label if available (text before first colon)
        const fullText = heading.textContent || "";
        const shortText = fullText.includes(':') ? fullText.split(':')[0].trim() : fullText;
        
        return {
          id: heading.id,
          text: shortText,
          level: 2,
        };
      });
      
      console.log('TableOfContents: Extracted sections:', extractedSections);
      setSections(extractedSections);

      // Only set up intersection observer if not mobile
      if (!isMobile && headings.length > 0) {
        let prevRatio = 0;
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.intersectionRatio > prevRatio) {
                setActiveSection(entry.target.id);
              }
              prevRatio = entry.intersectionRatio;
            });
          },
          {
            threshold: [0, 0.25, 0.5, 0.75, 1],
            rootMargin: "-48px 0px -80% 0px",
          }
        );

        // Observe all section headings
        headings.forEach((heading) => observer.observe(heading));

        // Set initial active section
        setActiveSection(headings[0].id);

        return () => observer.disconnect();
      }
    }, 500); // Give content time to render

    return () => clearTimeout(timer);
  }, [isMobile]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
      onSubsectionClick?.();
    }
  };

  console.log('TableOfContents render: sections.length =', sections.length, 'className =', className);

  if (sections.length === 0) {
    console.log('TableOfContents: No sections, returning null');
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
