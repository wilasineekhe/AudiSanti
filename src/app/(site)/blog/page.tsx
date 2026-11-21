import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Pagination } from "@/components/Pagination";
import { PostCard } from "@/components/PostCard";
import { prisma } from "@/lib/prisma";
import { getBlogCategories } from "@/lib/queries";

export const metadata: Metadata = { title: "Blog" };

const PER_PAGE = 9;
type SP = Promise<{ q?: string; cat?: string; page?: string }>;

export default async function BlogPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q?.slice(0, 100) || "";
  const cat = sp.cat || "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.PostWhereInput = { published: true };
  if (q.trim()) {
    where.OR = [
      { title: { contains: q.trim(), mode: "insensitive" } },
      { excerpt: { contains: q.trim(), mode: "insensitive" } },
    ];
  }
  if (cat) where.category = { slug: cat, type: "BLOG" };

  const [categories, total, posts] = await Promise.all([
    getBlogCategories(),
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: { category: true },
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const href = (over: { cat?: string; page?: number }) => {
    const p = new URLSearchParams();
    const c = "cat" in over ? over.cat : cat;
    if (q) p.set("q", q);
    if (c) p.set("cat", c);
    if (over.page && over.page > 1) p.set("page", String(over.page));
    const s = p.toString();
    return s ? `/blog?${s}` : "/blog";
  };
  const showFeatured = page === 1 && !q && !cat && posts.length > 2;

  return (
    <div className="container-page py-8 sm:py-12">
      <header className="max-w-2xl">
        <p className="text-sm font-medium text-accent">Blog</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">เรื่องเล่าและความรู้เครื่องเสียง</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
          ประวัติร้าน วิธีเลือกซื้อ วิธีดูแล และเรื่องราวของสินค้ามือสองแต่ละชิ้น
        </p>
      </header>

      <form action="/blog" method="get" role="search" className="mt-6 flex gap-2">
        {cat && <input type="hidden" name="cat" value={cat} />}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">ค้นหาบทความ</span>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" type="search" defaultValue={q} placeholder="ค้นหาบทความ" className="input pl-10" enterKeyHint="search" />
        </label>
        <button className="btn-primary shrink-0 px-4 sm:px-6">
          <Icon name="search" className="h-4 w-4 sm:hidden" />
          <span className="hidden sm:inline">ค้นหา</span>
        </button>
      </form>

      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ cat: "" })} className={`chip ${!cat ? "chip-active" : ""}`}>
          ทั้งหมด
        </Link>
        {categories.map((c) => (
          <Link key={c.id} href={href({ cat: c.slug })} className={`chip ${cat === c.slug ? "chip-active" : ""}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {(q || cat) && (
        <p className="mt-5 text-sm text-muted">
          พบ <span className="font-semibold text-white">{total}</span> บทความ{" "}
          <Link href="/blog" className="ml-2 text-accent hover:underline">ล้างตัวกรอง</Link>
        </p>
      )}

      {posts.length === 0 ? (
        <div className="card mt-6 px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold text-white">ไม่พบบทความ</p>
          <p className="mt-2 text-sm text-muted">ลองใช้คำค้นอื่น หรือเลือกหมวดหมู่อื่น</p>
          <Link href="/blog" className="btn-outline mt-5">ดูบทความทั้งหมด</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} featured={showFeatured && i === 0} />
          ))}
        </div>
      )}

      <Pagination page={page} pages={pages} makeHref={(p) => href({ page: p })} />
    </div>
  );
}
