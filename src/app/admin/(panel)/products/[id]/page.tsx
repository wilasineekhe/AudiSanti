import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/Icon";
import { prisma } from "@/lib/prisma";

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } }),
    prisma.category.findMany({ where: { type: "PRODUCT" }, orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title="แก้ไขสินค้า"
        back={{ href: "/admin/products", label: "กลับไปรายการสินค้า" }}
        action={
          <div className="flex gap-2">
            <Link href={`/products/${product.id}`} target="_blank" className="btn-outline btn-sm">
              <Icon name="eye" className="h-4 w-4" /> ดูหน้าร้าน
            </Link>
            <ConfirmSubmit
              action={deleteProduct}
              fields={{ id: product.id }}
              title="ลบสินค้านี้?"
              message={<>“{product.name}” และรูปทั้งหมดจะถูกลบถาวร ไม่สามารถกู้คืนได้</>}
            >
              <Icon name="trash" className="h-4 w-4" /> ลบ
            </ConfirmSubmit>
          </div>
        }
      />
      <ProductForm
        categories={categories}
        initial={{
          id: product.id,
          name: product.name,
          price: product.price,
          categoryId: product.categoryId,
          condition: product.condition,
          defects: product.defects,
          description: product.description,
          status: product.status,
          images: product.images.map((i) => ({ id: i.id, path: i.path, isMain: i.isMain })),
        }}
      />
    </>
  );
}
