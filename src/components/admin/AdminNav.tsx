"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../Icon";

const items = [
  { href: "/admin", label: "แดชบอร์ด", short: "หน้าหลัก", icon: "dashboard" },
  { href: "/admin/products", label: "จัดการสินค้า", short: "สินค้า", icon: "box" },
  { href: "/admin/blog", label: "จัดการ Blog", short: "Blog", icon: "book" },
  { href: "/admin/categories", label: "หมวดหมู่", short: "หมวดหมู่", icon: "tag" },
  { href: "/admin/settings", label: "ตั้งค่าร้าน", short: "ตั้งค่า", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminSideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="เมนูหลังบ้าน">
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
              active ? "bg-accent/10 text-accent" : "text-fg-2 hover:bg-raised hover:text-white"
            }`}
          >
            <Icon name={it.icon} className="h-5 w-5" />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** แถบเมนูด้านล่างสำหรับมือถือ */
export function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="เมนูหลังบ้าน"
    >
      {items.map((it) => {
        const active = isActive(pathname, it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] ${active ? "text-accent" : "text-muted"}`}
          >
            <Icon name={it.icon} className="h-5 w-5" />
            {it.short}
          </Link>
        );
      })}
    </nav>
  );
}
