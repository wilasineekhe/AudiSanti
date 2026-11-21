import { ProductForm } from "@/components/admin/ProductForm";
import { PageHeader } from "@/components/admin/ui";
import { prisma } from "@/lib/prisma";

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ where: { type: "PRODUCT" }, orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="เพิ่มสินค้า" back={{ href: "/admin/products", label: "กลับไปรายการสินค้า" }} />
      <ProductForm
        categories={categories}
        initial={{ name: "", price: "", categoryId: null, condition: "", defects: "", description: "", status: "AVAILABLE", images: [] }}
      />
    </>
  );
}
