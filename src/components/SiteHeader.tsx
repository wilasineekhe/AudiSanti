"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { Logo } from "./Logo";

export function SiteHeader({
  shopName,
  tagline,
  logo,
  facebookUrl,
}: {
  shopName: string;
  tagline: string;
  logo: string | null;
  facebookUrl: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const links = [
    { href: "/", label: "หน้าร้าน", active: pathname === "/" || pathname.startsWith("/products") },
    { href: "/blog", label: "Blog", active: pathname.startsWith("/blog") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Logo name={shopName} tagline={tagline} logo={logo} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="เมนูหลัก">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                l.active ? "text-accent" : "text-fg-2 hover:text-white"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-primary ml-2 min-h-[40px]">
            <Icon name="facebook" className="h-4 w-4" />
            ติดต่อ Facebook
          </a>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-card text-white md:hidden"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Icon name={open ? "x" : "menu"} />
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-ink md:hidden">
          <nav className="container-page flex flex-col gap-1 py-3" aria-label="เมนูมือถือ">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex min-h-[48px] items-center rounded-xl px-4 text-base font-medium ${
                  l.active ? "bg-accent/10 text-accent" : "text-fg-2 hover:bg-card"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-2 min-h-[48px] text-base">
              <Icon name="facebook" className="h-5 w-5" />
              ติดต่อ Facebook
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
