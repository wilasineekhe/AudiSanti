import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { deletePost } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EmptyState, Notice, PageHeader } from "@/components/admin/ui";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Icon } from "@/components/Icon";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type SP = Promise<{ q?: string; state?: string; saved?: string; deleted?: string }>;

export default async function AdminBlog({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q || "";
  const where: Prisma.PostWhereInput = {};
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (sp.state === "published") where.published = true;
  if (sp.state === "draft") where.published = false;
  const posts = await prisma.post.findMany({ where, include: { category: true }, orderBy: { updatedAt: "desc" } });

  return (
    <>
      <PageHeader
        title="จัดการ Blog"
        description={`ทั้งหมด ${posts.length} บทความ`}
        action={
          <Link href="/admin/blog/new" className="btn-primary w-full sm:w-auto">
            <Icon name="plus" className="h-4 w-4" /> เขียนบทความ
          </Link>
        }
      />
      {sp.saved && <Notice>บันทึกบทความแล้ว</Notice>}
      {sp.deleted && <Notice>ลบบทความแล้ว</Notice>}

      <AutoSubmitForm action="/admin/blog" className="card mb-4 grid gap-2 p-3 sm:grid-cols-[1fr_180px_auto]">
        <label className="relative">
          <span className="sr-only">ค้นหาบทความ</span>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" type="search" defaultValue={q} placeholder="ค้นหาชื่อบทความ" className="input pl-10" />
        </label>
        <select name="state" defaultValue={sp.state ?? ""} className="input" aria-label="สถานะ">
          <option value="">ทุกสถานะ</option>
          <option value="published">เผยแพร่แล้ว</option>
          <option value="draft">ฉบับร่าง</option>
        </select>
        <button className="btn-outline">ค้นหา</button>
      </AutoSubmitForm>

      {posts.length === 0 ? (
        <EmptyState icon="book" title="ยังไม่มีบทความ">
          <Link href="/admin/blog/new" className="text-accent hover:underline">เขียนบทความแรก</Link>
        </EmptyState>
      ) : (
        <ul className="card divide-y divide-line">
          {posts.map((p) => (
            <li key={p.id} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-4">
              <Link href={`/admin/blog/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-raised">
                  {p.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.coverImage} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-sm font-medium text-white hover:text-accent">{p.title}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                    <span className={p.published ? "badge-ok" : "badge bg-warn/15 text-warn ring-1 ring-warn/30"}>
                      {p.published ? "เผยแพร่" : "ร่าง"}
                    </span>
                    {p.category?.name && <span>{p.category.name}</span>}
                    <span>แก้ไข {formatDate(p.updatedAt)}</span>
                  </span>
                </span>
              </Link>
              <div className="flex shrink-0 gap-2">
                <Link href={`/blog/${p.slug}`} target="_blank" className="btn-outline btn-sm flex-1 sm:flex-none" aria-label="ดูบทความ">
                  <Icon name="eye" className="h-4 w-4" /> <span className="sm:sr-only">ดู</span>
                </Link>
                <Link href={`/admin/blog/${p.id}`} className="btn-outline btn-sm flex-1 sm:flex-none" aria-label="แก้ไขบทความ">
                  <Icon name="edit" className="h-4 w-4" /> <span className="sm:sr-only">แก้ไข</span>
                </Link>
                <ConfirmSubmit
                  action={deletePost}
                  fields={{ id: p.id }}
                  title="ลบบทความนี้?"
                  message={<>“{p.title}” จะถูกลบถาวร ไม่สามารถกู้คืนได้</>}
                  ariaLabel="ลบบทความ"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </ConfirmSubmit>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
