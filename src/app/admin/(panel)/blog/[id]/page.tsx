import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePost } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PostForm } from "@/components/admin/PostForm";
import { Notice, PageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { prisma } from "@/lib/prisma";
import { getBlogCategories } from "@/lib/queries";

export default async function EditPost({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const id = Number((await params).id);
  const { preview } = await searchParams;
  if (!Number.isInteger(id)) notFound();
  const [post, categories] = await Promise.all([prisma.post.findUnique({ where: { id } }), getBlogCategories()]);
  if (!post) notFound();

  return (
    <>
      <PageHeader
        title="แก้ไขบทความ"
        back={{ href: "/admin/blog", label: "กลับไปรายการบทความ" }}
        action={
          <div className="flex gap-2">
            <Link href={`/blog/${post.slug}`} target="_blank" className="btn-outline btn-sm">
              <Icon name="eye" className="h-4 w-4" /> เปิดหน้าบทความ
            </Link>
            <ConfirmSubmit
              action={deletePost}
              fields={{ id: post.id }}
              title="ลบบทความนี้?"
              message={<>“{post.title}” จะถูกลบถาวร ไม่สามารถกู้คืนได้</>}
            >
              <Icon name="trash" className="h-4 w-4" /> ลบ
            </ConfirmSubmit>
          </div>
        }
      />
      {preview && (
        <Notice>
          บันทึกแล้ว กำลังแสดงตัวอย่างเนื้อหา{post.published ? "" : " (ยังเป็นฉบับร่าง ลูกค้ายังมองไม่เห็น)"}
        </Notice>
      )}
      <PostForm
        key={post.updatedAt.toISOString()}
        categories={categories}
        preview={preview ? <Markdown content={post.content || "_ยังไม่มีเนื้อหา_"} /> : undefined}
        initial={{
          id: post.id,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          categoryId: post.categoryId,
          coverImage: post.coverImage,
          published: post.published,
        }}
      />
    </>
  );
}
