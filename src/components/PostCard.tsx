import Link from "next/link";
import type { Category, Post } from "@prisma/client";
import { formatDate } from "@/lib/format";
import { Icon } from "./Icon";

export function PostCard({ post, featured = false }: { post: Post & { category: Category | null }; featured?: boolean }) {
  return (
    <article
      className={`group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card transition hover:border-accent/50 ${
        featured ? "md:col-span-2 md:flex-row" : ""
      }`}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={`relative block shrink-0 overflow-hidden bg-raised ${featured ? "aspect-[16/9] md:aspect-auto md:w-1/2" : "aspect-[16/9]"}`}
        tabIndex={-1}
        aria-hidden
      >
        {post.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="grid-bg grid h-full w-full place-items-center text-accent/40">
            <Icon name="book" className="h-12 w-12" />
          </div>
        )}
      </Link>
      <div className={`flex flex-1 flex-col p-4 sm:p-5 ${featured ? "md:justify-center md:p-8" : ""}`}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {post.category && <span className="font-medium text-accent">{post.category.name}</span>}
          <span className="flex items-center gap-1 text-muted">
            <Icon name="calendar" className="h-3.5 w-3.5" />
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
        </div>
        <h3 className={`mt-2 line-clamp-2 font-display font-semibold leading-snug text-white ${featured ? "text-xl sm:text-2xl" : "text-base sm:text-lg"}`}>
          <Link href={`/blog/${post.slug}`} className="hover:text-accent">
            {post.title}
          </Link>
        </h3>
        {post.excerpt && (
          <p className={`mt-2 text-sm leading-relaxed text-muted ${featured ? "line-clamp-4" : "line-clamp-3"}`}>{post.excerpt}</p>
        )}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-accent hover:gap-2"
          aria-label={`อ่านเพิ่มเติม: ${post.title}`}
        >
          อ่านเพิ่มเติม <Icon name="arrowRight" className="h-4 w-4 transition-all" />
        </Link>
      </div>
    </article>
  );
}
