import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { PostCard } from "@/components/PostCard";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

type Params = Promise<{ slug: string }>;

function decode(s: string) {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

async function getPost(slugParam: string) {
  const post = await prisma.post.findUnique({ where: { slug: decode(slugParam) }, include: { category: true } });
  if (!post) return null;
  // บทความฉบับร่างดูได้เฉพาะผู้ขายที่ล็อกอินอยู่ (ใช้เป็นหน้าดูตัวอย่าง)
  if (!post.published && !(await getSession())) return null;
  return post;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await getPost((await params).slug);
  if (!post) return { title: "ไม่พบบทความ" };
  return {
    title: post.title,
    description: post.excerpt.slice(0, 160),
    openGraph: { images: post.coverImage ? [post.coverImage] : [] },
  };
}

export default async function PostPage({ params }: { params: Params }) {
  const post = await getPost((await params).slug);
  if (!post) notFound();

  const [settings, related] = await Promise.all([
    getSettings(),
    prisma.post.findMany({
      where: { published: true, id: { not: post.id }, ...(post.categoryId ? { categoryId: post.categoryId } : {}) },
      include: { category: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <article className="pb-6">
      {!post.published && (
        <div className="border-b border-warn/40 bg-warn/10">
          <div className="container-page flex flex-wrap items-center justify-between gap-2 py-3 text-sm text-warn-fg">
            <span className="flex items-center gap-2">
              <Icon name="eye" className="h-4 w-4 text-warn" /> ตัวอย่างบทความ (ฉบับร่าง ลูกค้ายังมองไม่เห็น)
            </span>
            <Link href={`/admin/blog/${post.id}`} className="font-medium text-warn underline">กลับไปแก้ไข</Link>
          </div>
        </div>
      )}

      <div className="container-page max-w-3xl pt-6 sm:pt-10">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
          <Icon name="arrowLeft" className="h-4 w-4" /> กลับหน้า Blog
        </Link>
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {post.category && (
            <Link href={`/blog?cat=${post.category.slug}`} className="font-medium text-accent hover:underline">
              {post.category.name}
            </Link>
          )}
          <span className="flex items-center gap-1 text-muted">
            <Icon name="calendar" className="h-4 w-4" />
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
        </div>
        <h1 className="mt-3 break-words font-display text-2xl font-bold leading-tight text-white sm:text-4xl">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-base leading-relaxed text-fg-2 sm:text-lg">{post.excerpt}</p>}
      </div>

      {post.coverImage && (
        <div className="container-page mt-6 max-w-4xl sm:mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt={post.title} className="aspect-[16/9] w-full rounded-2xl border border-line object-cover" />
        </div>
      )}

      <div className="container-page mt-8 max-w-3xl">
        <Markdown content={post.content} />

        <div className="mt-12 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/10 to-transparent p-5 sm:p-6">
          <p className="font-display text-lg font-semibold text-white">สนใจสินค้าหรืออยากสอบถามเพิ่มเติม?</p>
          <p className="mt-1 text-sm text-muted">ทักผู้ขายทาง Facebook หรือเลือกชมสินค้าในร้านได้เลย</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <Icon name="facebook" className="h-4 w-4" /> ติดต่อ Facebook
            </a>
            <Link href="/" className="btn-outline">
              <Icon name="store" className="h-4 w-4" /> เลือกชมสินค้า
            </Link>
            <Link href="/blog" className="btn-ghost">
              <Icon name="arrowLeft" className="h-4 w-4" /> กลับหน้า Blog
            </Link>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-14">
          <h2 className="font-display text-xl font-semibold text-white">บทความที่เกี่ยวข้อง</h2>
          <div className="mt-4 grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
