import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { productCardInclude } from "@/lib/queries";

export default async function Dashboard() {
  const [total, available, sold, posts, drafts, recent] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "AVAILABLE" } }),
    prisma.product.count({ where: { status: "SOLD" } }),
    prisma.post.count({ where: { published: true } }),
    prisma.post.count({ where: { published: false } }),
    prisma.product.findMany({ orderBy: { updatedAt: "desc" }, take: 6, include: productCardInclude }),
  ]);

  const stats = [
    { label: "สินค้าทั้งหมด", value: total, icon: "box", cls: "text-accent bg-accent/10" },
    { label: "ยังมีสินค้า", value: available, icon: "check", cls: "text-ok bg-ok/10" },
    { label: "ขายแล้ว", value: sold, icon: "tag", cls: "text-sold bg-sold/10" },
  ];

  return (
    <>
      <PageHeader
        title="แดชบอร์ด"
        description="ภาพรวมสินค้าและบทความของร้าน"
        action={
          <div className="flex w-full gap-2 sm:w-auto">
            <Link href="/" target="_blank" className="btn-outline flex-1 sm:flex-none">
              <Icon name="store" className="h-4 w-4" /> ดูหน้าร้าน
            </Link>
            <Link href="/admin/products/new" className="btn-primary flex-1 sm:flex-none">
              <Icon name="plus" className="h-4 w-4" /> เพิ่มสินค้า
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-3 sm:p-5">
            <span className={`grid h-9 w-9 place-items-center rounded-lg sm:h-10 sm:w-10 ${s.cls}`}>
              <Icon name={s.icon} className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-2xl font-bold text-white sm:text-3xl">{s.value.toLocaleString("th-TH")}</p>
            <p className="mt-0.5 text-xs text-muted sm:text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      <Link
        href="/admin/blog"
        className="card mt-3 flex items-center justify-between gap-3 p-4 transition hover:border-accent/50 sm:mt-4"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent/10 text-accent">
            <Icon name="book" className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-medium text-white">บทความเผยแพร่ {posts} เรื่อง</span>
            <span className="block text-xs text-muted">ฉบับร่าง {drafts} เรื่อง</span>
          </span>
        </span>
        <Icon name="chevronRight" className="h-5 w-5 text-muted" />
      </Link>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-white">สินค้าแก้ไขล่าสุด</h2>
          <Link href="/admin/products" className="text-sm text-accent hover:underline">ดูทั้งหมด</Link>
        </div>
        <ul className="card mt-3 divide-y divide-line">
          {recent.length === 0 && <li className="p-6 text-center text-sm text-muted">ยังไม่มีสินค้า</li>}
          {recent.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3 p-3 transition hover:bg-raised sm:p-4">
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-raised">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].path} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-white">{p.name}</span>
                  <span className="block text-xs text-muted">
                    {formatPrice(p.price)} · แก้ไข {formatDate(p.updatedAt)}
                  </span>
                </span>
                <span className="hidden sm:block">
                  <StatusBadge status={p.status} />
                </span>
                <Icon name="edit" className="h-4 w-4 shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
