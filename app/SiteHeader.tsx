"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/what-we-do", label: "What We Do" },
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/ai-assessment", label: "AI Assessment" },
] as const;

export default function SiteHeader({ variant = "page" }: { variant?: "page" | "room" }) {
  const pathname = usePathname();

  const bar = (
    <div className={variant === "room" ? "room-bar" : "m-bar-inner"}>
      <Link className="brand" href="/" aria-label="Aidvance, home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Aidvance" />
      </Link>
      <nav className="site-links" aria-label="Primary">
        {LINKS.map((link) => {
          const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <Link className="site-cta" href="/#casey">
        Talk to Casey
      </Link>
    </div>
  );

  if (variant === "room") return bar;
  return <header className="m-bar">{bar}</header>;
}
