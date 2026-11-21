"use client";

import { useEffect, useRef } from "react";
import { saveCategory } from "@/app/admin/actions";
import { Icon } from "../Icon";
import { useFormAction } from "./useFormAction";

export const PRODUCT_ICONS: [string, string][] = [
  ["speaker", "ลำโพง"],
  ["headphones", "หูฟัง"],
  ["amp", "แอมป์"],
  ["mic", "ไมโครโฟน"],
  ["mixer", "มิกเซอร์"],
  ["car", "รถยนต์"],
  ["chip", "อิเล็กทรอนิกส์"],
  ["box", "ทั่วไป"],
  ["wave", "คลื่นเสียง"],
];

export function CategoryForm({
  type,
  initial,
}: {
  type: "PRODUCT" | "BLOG";
  initial?: { id: number; name: string; slug: string; icon: string; sortOrder: number };
}) {
  const { state, pending, onSubmit } = useFormAction(saveCategory);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && !initial) ref.current?.reset();
  }, [state, initial]);

  return (
    <form ref={ref} onSubmit={onSubmit} className="min-w-0">
      {initial && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="type" value={type} />
      <div className={`grid gap-2 ${type === "PRODUCT" ? "grid-cols-[minmax(0,1fr)_88px] md:grid-cols-[minmax(0,1fr)_170px_80px_auto]" : "grid-cols-[minmax(0,1fr)_88px] md:grid-cols-[minmax(0,1fr)_80px_auto]"}`}>
        <input name="name" required defaultValue={initial?.name} placeholder="ชื่อหมวดหมู่" className="input" aria-label="ชื่อหมวดหมู่" />
        {type === "PRODUCT" && (
          <select name="icon" defaultValue={initial?.icon ?? "box"} className="input order-3 col-span-2 md:order-none md:col-span-1" aria-label="ไอคอน">
            {PRODUCT_ICONS.map(([v, l]) => (
              <option key={v} value={v}>ไอคอน: {l}</option>
            ))}
          </select>
        )}
        <input
          name="sortOrder"
          type="number"
          defaultValue={initial?.sortOrder ?? 0}
          className="input"
          aria-label="ลำดับการแสดง"
          title="ลำดับการแสดง (น้อยขึ้นก่อน)"
        />
        <button disabled={pending} className={`${initial ? "btn-outline" : "btn-primary"} order-4 col-span-2 md:order-none md:col-span-1`}>
          <Icon name={initial ? "check" : "plus"} className="h-4 w-4" />
          {pending ? "..." : initial ? "บันทึก" : "เพิ่ม"}
        </button>
      </div>
      {initial && <input type="hidden" name="slug" value={initial.slug} />}
      {state?.error && <p className="mt-2 text-xs text-danger">{state.error}</p>}
      {state?.ok && <p className="mt-2 text-xs text-ok">{state.ok}</p>}
    </form>
  );
}
