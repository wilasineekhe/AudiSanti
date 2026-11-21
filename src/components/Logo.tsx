import Link from "next/link";

export function Logo({ name, tagline, logo }: { name: string; tagline?: string; logo?: string | null }) {
  return (
    <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={`${name} หน้าแรก`}>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logo} alt="" className="h-9 w-9 shrink-0 rounded-xl border border-line object-cover" />
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/40 bg-accent/10 text-accent">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 12h3l2-6 3 12 3-15 3 18 2-9h4" />
          </svg>
        </span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-[17px] font-semibold tracking-wide text-white">{name}</span>
        {tagline && <span className="block truncate text-[11px] text-muted sm:text-xs">{tagline}</span>}
      </span>
    </Link>
  );
}
