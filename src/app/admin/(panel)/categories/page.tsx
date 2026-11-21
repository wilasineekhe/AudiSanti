import { deleteCategory } from "@/app/admin/actions";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { PageHeader } from "@/components/admin/ui";
import { Icon } from "@/components/Icon";
import { prisma } from "@/lib/prisma";

export default async function Categories() {
  const cats = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true, posts: true } } },
  });
  const groups = [
    { type: "PRODUCT" as const, title: "หมวดสินค้า", unit: "สินค้า", items: cats.filter((c) => c.type === "PRODUCT") },
    { type: "BLOG" as const, title: "หมวด Blog", unit: "บทความ", items: cats.filter((c) => c.type === "BLOG") },
  ];

  return (
    <>
      <PageHeader title="จัดการหมวดหมู่" description="เพิ่ม แก้ไข และลบหมวดสินค้าและหมวด Blog · ตัวเลขคือลำดับการแสดง (น้อยขึ้นก่อน)" />
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.type}>
            <h2 className="font-display text-lg font-semibold text-white">{g.title}</h2>
            <div className="card mt-3 divide-y divide-line">
              {g.items.map((c) => {
                const count = g.type === "PRODUCT" ? c._count.products : c._count.posts;
                return (
                  <div key={c.id} className="space-y-2.5 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {g.type === "PRODUCT" && (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                            <Icon name={c.icon} className="h-5 w-5" />
                          </span>
                        )}
                        <span className="truncate text-xs text-muted">
                          {count} {g.unit}
                        </span>
                      </div>
                      <ConfirmSubmit
                        action={deleteCategory}
                        fields={{ id: c.id }}
                        title={`ลบหมวด “${c.name}”?`}
                        message={
                          count > 0 ? (
                            <span className="text-warn-fg">
                              หมวดนี้ยังมี{g.unit}ผูกอยู่ {count} รายการ หากลบ {g.unit}เหล่านั้นจะกลายเป็น “ไม่มีหมวดหมู่” (ตัว{g.unit}ไม่ถูกลบ)
                            </span>
                          ) : (
                            "หมวดนี้ไม่มีรายการผูกอยู่ ลบได้อย่างปลอดภัย"
                          )
                        }
                        ariaLabel={`ลบหมวด ${c.name}`}
                      >
                        <Icon name="trash" className="h-4 w-4" /> ลบ
                      </ConfirmSubmit>
                    </div>
                    <CategoryForm type={g.type} initial={c} />
                  </div>
                );
              })}
              <div className="bg-raised/40 p-3 sm:p-4">
                <p className="mb-2 text-xs font-medium text-accent">+ เพิ่ม{g.title}</p>
                <CategoryForm type={g.type} />
              </div>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
