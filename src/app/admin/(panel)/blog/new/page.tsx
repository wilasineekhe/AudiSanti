import { PostForm } from "@/components/admin/PostForm";
import { PageHeader } from "@/components/admin/ui";
import { getBlogCategories } from "@/lib/queries";

export default async function NewPost() {
  const categories = await getBlogCategories();
  return (
    <>
      <PageHeader title="เขียนบทความ" back={{ href: "/admin/blog", label: "กลับไปรายการบทความ" }} />
      <PostForm
        categories={categories}
        initial={{ title: "", slug: "", excerpt: "", content: "", categoryId: null, coverImage: null, published: false }}
      />
    </>
  );
}
