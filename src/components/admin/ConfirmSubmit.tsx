"use client";

import { useRef, useState } from "react";
import { Icon } from "../Icon";

/** ปุ่มที่ถามยืนยันก่อนส่งฟอร์ม (ใช้กับการลบ) */
export function ConfirmSubmit({
  action,
  fields,
  title,
  message,
  confirmLabel = "ลบ",
  children,
  className = "btn-danger btn-sm",
  ariaLabel,
}: {
  action: (fd: FormData) => void | Promise<void>;
  fields: Record<string, string | number>;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={action} className="contents">
      {Object.entries(fields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button type="button" className={className} onClick={() => setOpen(true)} aria-label={ariaLabel}>
        {children}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => !busy && setOpen(false)}
        >
          <div className="card w-full max-w-md p-6 text-left" onClick={(e) => e.stopPropagation()}>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-red-500/15 text-danger">
              <Icon name="trash" className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">{title}</h2>
            <div className="mt-2 text-sm leading-relaxed text-muted">{message}</div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline" disabled={busy} onClick={() => setOpen(false)}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn bg-red-600 text-pure hover:bg-red-500"
                disabled={busy}
                onClick={() => {
                  setBusy(true);
                  formRef.current?.requestSubmit();
                  setTimeout(() => setOpen(false), 300);
                }}
              >
                {busy ? "กำลังลบ..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
