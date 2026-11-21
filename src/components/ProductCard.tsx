import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { ProductCardData } from "@/lib/queries";
import { Icon } from "./Icon";
import { StatusBadge } from "./StatusBadge";

export function ProductCard({ product }: { product: ProductCardData }) {
  const img = product.images[0]?.path;
  const sold = product.status === "SOLD";
  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-square overflow-hidden bg-raised">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.04] ${sold ? "opacity-50 grayscale" : ""}`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-line">
            <Icon name="image" className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-2 top-2 sm:left-3 sm:top-3">
          <StatusBadge status={product.status} solid />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        {product.category && (
          <span className="truncate text-[11px] font-medium tracking-wide text-accent/80 sm:text-xs">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-white sm:min-h-[3rem] sm:text-[15px] sm:leading-6">
          {product.name}
        </h3>
        <p className={`font-display text-base font-semibold sm:text-lg ${sold ? "text-sold" : "text-white"}`}>
          {formatPrice(product.price)}
        </p>
        {product.condition && (
          <p className="flex min-w-0 items-start gap-1.5 text-xs text-fg-3">
            <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
            <span className="line-clamp-1">{product.condition}</span>
          </p>
        )}
        {product.defects && (
          <p className="flex min-w-0 items-start gap-1.5 text-xs text-fg-3">
            <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
            <span className="line-clamp-1">{product.defects}</span>
          </p>
        )}
        <span className="mt-auto flex items-center gap-1 pt-2 text-xs font-medium text-muted transition group-hover:text-accent">
          ดูรายละเอียด <Icon name="arrowRight" className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}
