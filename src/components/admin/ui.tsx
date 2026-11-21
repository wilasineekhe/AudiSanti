import Link from "next/link";
import { Icon } from "../Icon";

export function PageHeader({
  title,
  description,
  action,
  back,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-6">
      {back && (
        <Link href={back.href} className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted hover:text-accent">
          <Icon name="arrowLeft" className="h-4 w-4" /> {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}

export function Notice({ tone = "ok", children }: { tone?: "ok" | "error"; children: React.ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-ok/40 bg-ok/10 text-ok-fg"
      : "border-red-500/40 bg-red-500/10 text-danger";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${cls}`}>
      <Icon name={tone === "ok" ? "check" : "alert"} className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "ok" ? "text-ok" : "text-danger"}`} />
      <span>{children}</span>
    </p>
  );
}

export function EmptyState({ icon, title, children }: { icon: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-xl bg-raised text-muted">
        <Icon name={icon} className="h-6 w-6" />
      </span>
      <p className="mt-3 font-display font-semibold text-white">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}
