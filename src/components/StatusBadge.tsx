import { STATUS_LABEL } from "@/lib/format";

export function StatusBadge({ status, solid = false }: { status: "AVAILABLE" | "SOLD"; solid?: boolean }) {
  const ok = status === "AVAILABLE";
  const tone = solid
    ? ok
      ? "badge shadow-lg backdrop-blur bg-ok-deep/90 text-ok ring-1 ring-ok/40"
      : "badge shadow-lg backdrop-blur bg-sold-deep/90 text-sold ring-1 ring-sold/40"
    : ok
      ? "badge-ok"
      : "badge-sold";
  return (
    <span className={tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-ok" : "bg-sold"}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}
