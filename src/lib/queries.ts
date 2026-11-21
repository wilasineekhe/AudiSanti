import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export const PAGE_SIZE = 12;

export type ProductFilters = {
  q?: string;
  cat?: string;
  status?: string;
  sort?: string;
  page?: number;
};

export const productCardInclude = {
  category: true,
  images: { orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }], take: 1 },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

export async function getProductCategories() {
  return prisma.category.findMany({
    where: { type: "PRODUCT" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function getBlogCategories() {
  return prisma.category.findMany({
    where: { type: "BLOG" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function buildProductWhere(f: ProductFilters): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (f.q?.trim()) where.name = { contains: f.q.trim(), mode: "insensitive" };
  if (f.cat) where.category = { slug: f.cat, type: "PRODUCT" };
  if (f.status === "available") where.status = "AVAILABLE";
  if (f.status === "sold") where.status = "SOLD";
  return where;
}

export function productOrder(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "price_asc") return [{ price: "asc" }, { id: "desc" }];
  if (sort === "price_desc") return [{ price: "desc" }, { id: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
}

export async function searchProducts(f: ProductFilters) {
  const where = buildProductWhere(f);
  const page = Math.max(1, f.page || 1);
  const [total, items] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      // ถ้าไม่ได้กรองสถานะ ให้สินค้าที่ยังมีขึ้นก่อน
      orderBy: f.status ? productOrder(f.sort) : [{ status: "asc" }, ...productOrder(f.sort)],
      include: productCardInclude,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { total, items, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
