import type { Metadata } from "next";
import Link from "next/link";
import { AdminBottomNav, AdminSideNav } from "@/components/admin/AdminNav";
import { Icon } from "@/components/Icon";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { logout } from "../actions";

export const metadata: Metadata = { title: "หลังบ้าน", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const s = await getSettings();
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-deep p-4 lg:flex">
        <Link href="/admin" className="mb-6 flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
            <Icon name="wave" className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-display font-semibold text-white">{s.shopName}</span>
            <span className="block text-xs text-muted">หลังบ้านผู้ขาย</span>
          </span>
        </Link>
        <AdminSideNav />
        <div className="mt-auto space-y-1 border-t border-line pt-4">
          <Link href="/" target="_blank" className="flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm text-fg-2 hover:bg-raised">
            <Icon name="store" className="h-5 w-5" /> ดูหน้าร้าน
          </Link>
          <form action={logout}>
            <button className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-sm text-fg-2 hover:bg-raised">
              <Icon name="logout" className="h-5 w-5" /> ออกจากระบบ
            </button>
          </form>
          <p className="truncate px-3 pt-2 text-xs text-faint">เข้าสู่ระบบเป็น {session.username}</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/90 px-4 backdrop-blur lg:hidden">
          <Link href="/admin" className="flex items-center gap-2 font-display font-semibold text-white">
            <Icon name="wave" className="h-5 w-5 text-accent" />
            {s.shopName}
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" target="_blank" className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:text-white" aria-label="ดูหน้าร้าน">
              <Icon name="store" className="h-5 w-5" />
            </Link>
            <form action={logout}>
              <button className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:text-white" aria-label="ออกจากระบบ">
                <Icon name="logout" className="h-5 w-5" />
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">{children}</main>
      </div>
      <AdminBottomNav />
    </div>
  );
}
