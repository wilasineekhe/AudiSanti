import Link from "next/link";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Icon } from "@/components/Icon";
import { Pagination } from "@/components/Pagination";
import { ProductCard } from "@/components/ProductCard";
import { prisma } from "@/lib/prisma";
import { getProductCategories, searchProducts } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

type SP = Promise<{ q?: string; cat?: string; status?: string; sort?: string; page?: string }>;

export default async function StorePage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const filters = {
    q: sp.q?.slice(0, 100) || "",
    cat: sp.cat || "",
    status: sp.status === "available" || sp.status === "sold" ? sp.status : "",
    sort: sp.sort === "price_asc" || sp.sort === "price_desc" ? sp.sort : "",
    page: Number(sp.page) || 1,
  };

  const [settings, categories, result, availableCount] = await Promise.all([
    getSettings(),
    getProductCategories(),
    searchProducts(filters),
    prisma.product.count({ where: { status: "AVAILABLE" } }),
  ]);

  const hasFilter = Boolean(filters.q || filters.cat || filters.status || filters.sort);
  const activeCat = categories.find((c) => c.slug === filters.cat);

  const makeHref = (over: Record<string, string | number | undefined>) => {
    const p = new URLSearchParams();
    const merged = { ...filters, page: undefined, ...over } as Record<string, string | number | undefined>;
    for (const [k, v] of Object.entries(merged)) if (v && !(k === "page" && v === 1)) p.set(k, String(v));
    const s = p.toString();
    return s ? `/?${s}#products` : "/#products";
  };

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="grid-bg absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_at_top_right,black_20%,transparent_70%)]" />
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div
          className={`container-page relative py-10 sm:py-14 lg:py-16 ${
            settings.heroImage ? "grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-12" : ""
          }`}
        >
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" />
              พร้อมขาย {availableCount.toLocaleString("th-TH")} รายการ
            </p>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {settings.shopName}
            </h1>
            <p className="mt-2 text-base text-fg-2 sm:text-lg">{settings.tagline}</p>
            {settings.description && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{settings.description}</p>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-[48px] px-6 text-base">
                <Icon name="facebook" className="h-5 w-5" />
                ติดต่อผู้ขายทาง Facebook
              </a>
              <a href="#products" className="btn-outline min-h-[48px] px-6 text-base">
                เลือกชมสินค้า
                <Icon name="arrowRight" className="h-4 w-4" />
              </a>
            </div>
          </div>
          {settings.heroImage && (
            <div className="relative isolate">
              <div className="absolute -inset-3 -z-10 rounded-[28px] bg-accent/10 blur-2xl" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={settings.heroImage}
                alt={`ร้าน ${settings.shopName}`}
                width={1200}
                height={900}
                fetchPriority="high"
                className="aspect-[4/3] w-full rounded-2xl border border-line object-cover shadow-lg"
              />
            </div>
          )}
        </div>
      </section>

      {/* หมวดหมู่แนะนำ */}
      <section className="container-page pt-8 sm:pt-10" aria-labelledby="cat-heading">
        <h2 id="cat-heading" className="font-display text-lg font-semibold text-white sm:text-xl">
          หมวดหมู่สินค้า
        </h2>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-8">
          <CategoryTile href={makeHref({ cat: undefined })} icon="wave" label="ทั้งหมด" active={!filters.cat} />
          {categories.map((c) => (
            <CategoryTile
              key={c.id}
              href={makeHref({ cat: c.slug })}
              icon={c.icon}
              label={c.name}
              count={c._count.products}
              active={filters.cat === c.slug}
            />
          ))}
        </div>
      </section>

      {/* ค้นหาและตัวกรอง */}
      <section id="products" className="container-page scroll-mt-20 pt-8">
        <AutoSubmitForm action="/#products" className="card p-3 sm:p-4">
          <div className="flex gap-2">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">ค้นหาสินค้า</span>
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                name="q"
                defaultValue={filters.q}
                placeholder="ค้นหาชื่อสินค้า เช่น ลำโพง, JBL, แอมป์"
                className="input pl-10"
                type="search"
                enterKeyHint="search"
              />
            </label>
            <button type="submit" className="btn-primary shrink-0 px-4 sm:px-6">
              <Icon name="search" className="h-4 w-4 sm:hidden" />
              <span className="hidden sm:inline">ค้นหา</span>
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:mt-3 sm:grid-cols-3">
            <label className="col-span-2 sm:col-span-1">
              <span className="sr-only">หมวดหมู่</span>
              <select name="cat" defaultValue={filters.cat} className="input">
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">สถานะ</span>
              <select name="status" defaultValue={filters.status} className="input">
                <option value="">ทุกสถานะ</option>
                <option value="available">ยังมีสินค้า</option>
                <option value="sold">ขายแล้ว</option>
              </select>
            </label>
            <label>
              <span className="sr-only">เรียงตาม</span>
              <select name="sort" defaultValue={filters.sort} className="input">
                <option value="">เพิ่มล่าสุด</option>
                <option value="price_asc">ราคา ต่ำ → สูง</option>
                <option value="price_desc">ราคา สูง → ต่ำ</option>
              </select>
            </label>
          </div>
          <noscript>
            <button type="submit" className="btn-outline mt-2 w-full">ใช้ตัวกรอง</button>
          </noscript>
        </AutoSubmitForm>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted">
            {activeCat ? <span className="text-white">{activeCat.name} · </span> : null}
            พบ <span className="font-semibold text-white">{result.total.toLocaleString("th-TH")}</span> รายการ
            {filters.q && (
              <>
                {" "}สำหรับ “<span className="text-accent">{filters.q}</span>”
              </>
            )}
          </p>
          {hasFilter && (
            <Link href="/#products" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
              <Icon name="x" className="h-4 w-4" /> ล้างตัวกรอง
            </Link>
          )}
        </div>

        {result.items.length === 0 ? (
          <div className="card mt-4 flex flex-col items-center px-6 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-raised text-muted">
              <Icon name="search" className="h-7 w-7" />
            </span>
            <p className="mt-4 font-display text-lg font-semibold text-white">ไม่พบสินค้าที่ค้นหา</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              ลองใช้คำค้นอื่น เปลี่ยนหมวดหมู่ หรือล้างตัวกรองเพื่อดูสินค้าทั้งหมด หากหาไม่เจอ ทักถามผู้ขายทาง Facebook ได้เลย
            </p>
            <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Link href="/#products" className="btn-outline">ล้างตัวกรอง</Link>
              <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <Icon name="facebook" className="h-4 w-4" /> สอบถามทาง Facebook
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {result.items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <Pagination page={result.page} pages={result.pages} makeHref={(p) => makeHref({ page: p })} />
      </section>
    </>
  );
}

function CategoryTile({
  href,
  icon,
  label,
  count,
  active,
}: {
  href: string;
  icon: string;
  label: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`group flex w-[6.5rem] shrink-0 flex-col items-center gap-2 rounded-2xl border px-2 py-4 text-center transition sm:w-auto ${
        active ? "border-accent bg-accent/10" : "border-line bg-card hover:border-accent/50"
      }`}
    >
      <span
        className={`grid h-11 w-11 place-items-center rounded-xl transition ${
          active ? "bg-accent text-ink" : "bg-raised text-accent group-hover:bg-accent/15"
        }`}
      >
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <span className={`line-clamp-2 text-xs font-medium leading-snug ${active ? "text-accent" : "text-fg-2"}`}>{label}</span>
      {count !== undefined && <span className="text-[11px] text-muted">{count} ชิ้น</span>}
    </Link>
  );
}
