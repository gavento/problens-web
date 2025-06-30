"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./Expand.module.css";

interface ExpandProps {
  children: React.ReactNode;
  headline: string;
  img?: string;
  color?: string;
  startOpen?: boolean;
  advanced?: boolean;
  id?: string;
}

export default function Expand({ children, headline, img, color = "#f5f5f5", startOpen = false, advanced = false, id }: ExpandProps) {
  const [isOpen, setIsOpen] = useState(startOpen);

  // Use subtle red background for advanced sections header
  const headerColor = advanced ? "#fff5f5" : color;

  return (
    <div className={styles.expand} id={id}>
      <div className={styles.header} style={{ backgroundColor: headerColor }} onClick={() => setIsOpen(!isOpen)}>
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
      {isOpen && <div className={styles.content} style={{ backgroundColor: color }}>{children}</div>}
    </div>
  );
}
