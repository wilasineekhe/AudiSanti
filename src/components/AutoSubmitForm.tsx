"use client";

import { useRef } from "react";

/** ฟอร์ม GET ที่ส่งอัตโนมัติเมื่อเปลี่ยนตัวเลือกใน select */
export function AutoSubmitForm({
  children,
  className,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  action: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={action}
      method="get"
      role="search"
      className={className}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") ref.current?.requestSubmit();
      }}
    >
      {children}
    </form>
  );
}
