"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import styles from "./Expand.module.css";

interface ExpandProps {
  children: React.ReactNode;
  headline: React.ReactNode;
  img?: string;
  color?: string; // background color for content
  headerColor?: string; // override header color only
  startOpen?: boolean;
  advanced?: boolean;
  id?: string;
}

export default function Expand({
  children,
  headline,
  img,
  color = "#f5f5f5",
  headerColor,
  startOpen = false,
  advanced = false,
  id,
}: ExpandProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (startOpen) return true;
    if (typeof window !== "undefined" && id && window.location.hash === `#${id}`) {
      return true;
    }
    return false;
  });

  // Open automatically when the hash in the URL matches our id (after first render as well)
  useEffect(() => {
    if (!id) return;

    const maybeOpen = () => {
      if (window.location.hash === `#${id}`) {
        setIsOpen(true);
      }
    };

    // Check again after mount (in case the hash appeared later)
    maybeOpen();

    // Listen for hash changes and browser navigation events
    window.addEventListener("hashchange", maybeOpen);
    window.addEventListener("popstate", maybeOpen); // covers router.back/forward or Next route changes
    window.addEventListener("load", maybeOpen);

    return () => {
      window.removeEventListener("hashchange", maybeOpen);
      window.removeEventListener("popstate", maybeOpen);
      window.removeEventListener("load", maybeOpen);
    };
  }, [id]);

  const expandRef = useRef<HTMLDivElement>(null);

  // Use subtle red background for advanced sections header
  const headerClr = headerColor ?? (advanced ? "#fff5f5" : color);

  const handleHide = () => {
    setIsOpen(false);

    // Scroll to the top of the expand box (at 25% from top of viewport)
    if (expandRef.current) {
      const rect = expandRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = scrollTop + rect.top - window.innerHeight * 0.25;

      window.scrollTo({
        top: targetY,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={styles.expand} id={id} ref={expandRef}>
      <div className={styles.header} style={{ backgroundColor: headerClr }} onClick={() => setIsOpen(!isOpen)}>
        {advanced && (
          <div className={styles.advancedIcon} title="This is an advanced section">
            ⚠️
          </div>
        )}
        {img && (
          <div className={styles.image}>
            <Image src={img} alt="" width={24} height={24} />
          </div>
        )}
        <div className={styles.headline}>{headline}</div>
        <div className={`${styles.arrow} ${isOpen ? styles.open : ""}`}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {isOpen && (
        <div className={styles.content} style={{ backgroundColor: color }}>
          {children}
          <div className={styles.hide} onClick={handleHide}>
            Hide ▲
          </div>
        </div>
      )}
    </div>
  );
}
