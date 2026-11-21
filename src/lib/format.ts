export function formatPrice(n: number) {
  return "฿" + n.toLocaleString("th-TH");
}

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function slugify(input: string) {
  const s = input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return s || "item";
}

export const STATUS_LABEL = { AVAILABLE: "ยังมีสินค้า", SOLD: "ขายแล้ว" } as const;
