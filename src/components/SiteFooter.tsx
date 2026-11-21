import Link from "next/link";
import { Icon } from "./Icon";

export function SiteFooter({ shopName, tagline, facebookUrl }: { shopName: string; tagline: string; facebookUrl: string }) {
  return (
    <footer className="mt-16 border-t border-line bg-deep">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-semibold text-white">{shopName}</p>
          <p className="mt-1 text-sm text-muted">{tagline}</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            สนใจสินค้าชิ้นไหน แคปภาพหรือส่งชื่อสินค้าให้ผู้ขายทาง Facebook เพื่อสอบถามรายละเอียดและความพร้อมของสินค้า
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">เมนู</p>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li><Link href="/" className="hover:text-accent">หน้าร้าน</Link></li>
            <li><Link href="/blog" className="hover:text-accent">Blog</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">ติดต่อผู้ขาย</p>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-3">
            <Icon name="facebook" className="h-4 w-4 text-accent" />
            Facebook
          </a>
        </div>
      </div>
      <div className="border-t border-line/60">
        <div className="container-page flex flex-col gap-2 py-4 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {shopName}</span>
          <Link href="/admin" className="hover:text-muted">สำหรับผู้ขาย</Link>
        </div>
      </div>
    </footer>
  );
}
