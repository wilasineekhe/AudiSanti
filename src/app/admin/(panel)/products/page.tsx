import Link from "next/link";
import { deleteProduct, setProductStatus } from "@/app/admin/actions";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import { EmptyState, Notice, PageHeader } from "@/components/admin/ui";
import { AutoSubmitForm } from "@/components/AutoSubmitForm";
import { Icon } from "@/components/Icon";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { buildProductWhere, getProductCategories, productCardInclude } from "@/lib/queries";

type SP = Promise<{ q?: string; cat?: string; status?: string; saved?: string; deleted?: string }>;

export default async function AdminProducts({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const f = { q: sp.q || "", cat: sp.cat || "", status: sp.status || "" };
  const [categories, products] = await Promise.all([
    getProductCategories(),
    prisma.product.findMany({
      where: buildProductWhere(f),
      orderBy: { updatedAt: "desc" },
      include: productCardInclude,
      take: 200,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="จัดการสินค้า"
        description={`ทั้งหมด ${products.length} รายการ`}
        action={
          <Link href="/admin/products/new" className="btn-primary w-full sm:w-auto">
            <Icon name="plus" className="h-4 w-4" /> เพิ่มสินค้า
          </Link>
        }
      />

      {sp.saved && <Notice>บันทึกสินค้าเรียบร้อย ข้อมูลล่าสุดแสดงบนหน้าร้านแล้ว</Notice>}
      {sp.deleted && <Notice>ลบสินค้าแล้ว</Notice>}

      <AutoSubmitForm action="/admin/products" className="card mb-4 grid gap-2 p-3 sm:grid-cols-[1fr_180px_160px_auto]">
        <label className="relative">
          <span className="sr-only">ค้นหาชื่อสินค้า</span>
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={f.q} type="search" placeholder="ค้นหาชื่อสินค้า" className="input pl-10" />
        </label>
        <div className="grid grid-cols-2 gap-2 sm:contents">
          <select name="cat" defaultValue={f.cat} className="input" aria-label="หมวดหมู่">
            <option value="">ทุกหมวดหมู่</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>
          <select name="status" defaultValue={f.status} className="input" aria-label="สถานะ">
            <option value="">ทุกสถานะ</option>
            <option value="available">ยังมีสินค้า</option>
            <option value="sold">ขายแล้ว</option>
          </select>
        </div>
        <button className="btn-outline">ค้นหา</button>
      </AutoSubmitForm>

      {products.length === 0 ? (
        <EmptyState icon="box" title="ไม่พบสินค้า">
          {f.q || f.cat || f.status ? (
            <Link href="/admin/products" className="text-accent hover:underline">ล้างตัวกรอง</Link>
          ) : (
            <Link href="/admin/products/new" className="text-accent hover:underline">เพิ่มสินค้าชิ้นแรก</Link>
          )}
        </EmptyState>
      ) : (
        <>
          {/* ตารางบนคอมพิวเตอร์ */}
          <div className="card hidden overflow-hidden lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-line bg-raised/50 text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">สินค้า</th>
                  <th className="px-4 py-3 font-medium">หมวดหมู่</th>
                  <th className="px-4 py-3 text-right font-medium">ราคา</th>
                  <th className="px-4 py-3 font-medium">สถานะ</th>
                  <th className="px-4 py-3 font-medium">แก้ไขล่าสุด</th>
                  <th className="px-4 py-3 text-right font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-raised/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={p.images[0]?.path} />
                        <Link href={`/admin/products/${p.id}`} className="line-clamp-2 max-w-xs font-medium text-white hover:text-accent">
                          {p.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.category?.name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-white">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(p.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <RowActions id={p.id} name={p.name} status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* การ์ดบนมือถือ */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {products.map((p) => (
              <li key={p.id} className="card p-3">
                <div className="flex gap-3">
                  <Thumb src={p.images[0]?.path} large />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/products/${p.id}`} className="line-clamp-2 text-sm font-medium text-white">
                      {p.name}
                    </Link>
                    <p className="mt-1 font-display font-semibold text-accent">{formatPrice(p.price)}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span className="truncate text-xs text-muted">{p.category?.name}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 border-t border-line pt-3">
                  <RowActions id={p.id} name={p.name} status={p.status} stretch />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}

function Thumb({ src, large }: { src?: string; large?: boolean }) {
  return (
    <span className={`shrink-0 overflow-hidden rounded-lg bg-raised ${large ? "h-20 w-20" : "h-11 w-11"}`}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      )}
    </span>
  );
}

function RowActions({ id, name, status, stretch }: { id: number; name: string; status: "AVAILABLE" | "SOLD"; stretch?: boolean }) {
  const next = status === "AVAILABLE" ? "SOLD" : "AVAILABLE";
  return (
    <div className={`flex items-center gap-2 ${stretch ? "" : "justify-end"}`}>
      <form action={setProductStatus} className={stretch ? "flex-1" : ""}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="status" value={next} />
        <button className="btn-outline btn-sm w-full whitespace-nowrap">
          {next === "SOLD" ? "ตั้งเป็นขายแล้ว" : "ตั้งเป็นยังมี"}
        </button>
      </form>
      <Link href={`/admin/products/${id}`} className="btn-outline btn-sm" aria-label={`แก้ไข ${name}`}>
        <Icon name="edit" className="h-4 w-4" />
        <span className={stretch ? "" : "sr-only"}>แก้ไข</span>
      </Link>
      <ConfirmSubmit
        action={deleteProduct}
        fields={{ id }}
        title="ลบสินค้านี้?"
        message={<>“{name}” และรูปทั้งหมดของสินค้านี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</>}
        ariaLabel={`ลบ ${name}`}
      >
        <Icon name="trash" className="h-4 w-4" />
      </ConfirmSubmit>
    </div>
  );
}
