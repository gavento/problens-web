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
}

export default function Expand({ children, headline, img, color = "#f5f5f5", startOpen = false }: ExpandProps) {
  const [isOpen, setIsOpen] = useState(startOpen);

  return (
    <div className={styles.expand} style={{ backgroundColor: color }}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
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
      {isOpen && <div className={styles.content}>{children}</div>}
    </div>
  );
}
