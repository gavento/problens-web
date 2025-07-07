"use client";

import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

export default function MDLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const router = useRouter();
  const { href = "", onClick, ...rest } = props;

  // Detect external / hash / internal without leading slash
  const isExternal = /^([a-z]+:)?\/\//i.test(href);
  const isHashOnly = href.startsWith("#");
  const isInternalRelative = !isExternal && !isHashOnly && !href.startsWith("/");

  const normalizedHref = isInternalRelative ? `/${href}` : href;

  const openExpandable = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const header = el.querySelector('[class*="header"]') as HTMLElement | null;
    if (header) header.click();
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Same-page hash link
    if (isHashOnly) {
      e.preventDefault();
      const id = href.slice(1);
      openExpandable(id);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      history.pushState(null, "", href);
      return;
    }

    // Internal navigation with optional hash
    if (!isExternal) {
      e.preventDefault();
      router.push(normalizedHref);
      const hashIdx = normalizedHref.indexOf("#");
      if (hashIdx !== -1) {
        const id = normalizedHref.slice(hashIdx + 1);
        setTimeout(() => openExpandable(id), 400);
      }
    }
  };

  if (isExternal) {
    return <a href={href} onClick={onClick} {...rest} />;
  }

  // Render as normal anchor but intercept click
  return <a href={normalizedHref} onClick={handleClick} {...rest} />;
}
