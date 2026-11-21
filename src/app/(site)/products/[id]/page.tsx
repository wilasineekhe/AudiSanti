import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContactSeller } from "@/components/ContactSeller";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { ProductGallery } from "@/components/ProductGallery";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatPrice } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { productCardInclude } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

type Params = Promise<{ id: string }>;

async function getProduct(idParam: string) {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }] } },
  });
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const p = await getProduct((await params).id);
  if (!p) return { title: "ไม่พบสินค้า" };
  return {
    title: p.name,
    description: `${formatPrice(p.price)} · ${p.condition}`.slice(0, 160),
    openGraph: { images: p.images[0]?.path ? [p.images[0].path] : [] },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const product = await getProduct((await params).id);
  if (!product) notFound();

  const [settings, related] = await Promise.all([
    getSettings(),
    product.categoryId
      ? prisma.product.findMany({
          where: { categoryId: product.categoryId, id: { not: product.id } },
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          include: productCardInclude,
          take: 4,
        })
      : Promise.resolve([]),
  ]);

  const sold = product.status === "SOLD";

  return (
    <div className="container-page py-6 sm:py-10">
      <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted" aria-label="breadcrumb">
        <Link href="/" className="shrink-0 hover:text-accent">หน้าร้าน</Link>
        {product.category && (
          <>
            <Icon name="chevronRight" className="h-3.5 w-3.5 shrink-0" />
            <Link href={`/?cat=${product.category.slug}#products`} className="truncate hover:text-accent">
              {product.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="mt-4 grid gap-6 lg:mt-6 lg:grid-cols-2 lg:gap-10">
        <ProductGallery images={product.images.map((i) => i.path)} name={product.name} sold={sold} />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />
            {product.category && (
              <span className="badge bg-accent/10 text-accent ring-1 ring-accent/30">{product.category.name}</span>
            )}
          </div>
          <h1 className="mt-3 break-words font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
            {product.name}
          </h1>
          <p className={`mt-3 font-display text-3xl font-bold ${sold ? "text-sold" : "text-accent"}`}>
            {formatPrice(product.price)}
          </p>

          {sold && (
            <div className="mt-4 flex gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-warn-fg">
              <Icon name="alert" className="h-5 w-5 shrink-0 text-warn" />
              <p>สินค้าชิ้นนี้ขายแล้ว หากสนใจสินค้าใกล้เคียง สามารถทักสอบถามผู้ขายได้</p>
            </div>
          )}

          <dl className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            <Row icon="check" iconClass="text-ok" label="สภาพ" value={product.condition || "-"} />
            <Row icon="alert" iconClass="text-warn" label="ตำหนิ" value={product.defects || "ไม่มีตำหนิที่แจ้งไว้"} />
            <Row icon="calendar" iconClass="text-muted" label="อัปเดตล่าสุด" value={formatDate(product.updatedAt)} />
          </dl>

          {product.description && (
            <section className="mt-6">
              <h2 className="font-display text-lg font-semibold text-white">รายละเอียดสินค้า</h2>
              <p className="mt-2 whitespace-pre-line break-words text-[15px] leading-7 text-fg-2">{product.description}</p>
            </section>
          )}

          <div className="mt-8 rounded-2xl border border-accent/30 bg-gradient-to-b from-accent/10 to-transparent p-4 sm:p-5">
            <ContactSeller facebookUrl={settings.facebookUrl} productName={product.name} sold={sold} />
            <p className="mt-4 flex gap-2 text-sm leading-relaxed text-muted">
              <Icon name="image" className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              แคปภาพสินค้าหรือส่งชื่อสินค้าให้ผู้ขายทาง Facebook เพื่อสอบถามรายละเอียดและความพร้อมของสินค้า
            </p>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-white">สินค้าในหมวดเดียวกัน</h2>
            {product.category && (
              <Link href={`/?cat=${product.category.slug}#products`} className="shrink-0 text-sm text-accent hover:underline">
                ดูทั้งหมด
              </Link>
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ icon, iconClass, label, value }: { icon: string; iconClass: string; label: string; value: string }) {
  return (
    <div className="flex gap-3 p-4">
      <Icon name={icon} className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
      <div className="min-w-0">
        <dt className="text-xs text-muted">{label}</dt>
        <dd className="mt-0.5 whitespace-pre-line break-words text-sm text-white">{value}</dd>
      </div>
    </div>
  );
}
