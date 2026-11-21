import Link from "next/link";
import { Icon } from "./Icon";

export function Pagination({ page, pages, makeHref }: { page: number; pages: number; makeHref: (p: number) => string }) {
  if (pages <= 1) return null;
  const nums: (number | "gap")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "gap") nums.push("gap");
  }
  const base = "grid h-10 min-w-[2.5rem] place-items-center rounded-full px-3 text-sm transition";
  const arrow = (target: number, enabled: boolean, icon: string, label: string) =>
    enabled ? (
      <Link href={makeHref(target)} className={`${base} border border-line text-muted hover:text-white`} aria-label={label}>
        <Icon name={icon} className="h-4 w-4" />
      </Link>
    ) : (
      <span className={`${base} border border-line/50 text-line`} aria-hidden>
        <Icon name={icon} className="h-4 w-4" />
      </span>
    );

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="เลขหน้า">
      {arrow(page - 1, page > 1, "chevronLeft", "หน้าก่อนหน้า")}
      {nums.map((n, i) =>
        n === "gap" ? (
          <span key={`g${i}`} className="px-1 text-muted">
            ...
          </span>
        ) : (
          <Link
            key={n}
            href={makeHref(n)}
            aria-current={n === page ? "page" : undefined}
            className={`${base} ${n === page ? "border-2 border-accent font-semibold text-accent" : "text-fg-2 hover:bg-card"}`}
          >
            {n}
          </Link>
        ),
      )}
      {arrow(page + 1, page < pages, "chevronRight", "หน้าถัดไป")}
    </nav>
  );
}
