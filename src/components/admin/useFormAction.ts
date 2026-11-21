"use client";

import { startTransition, useActionState } from "react";
import type { FormState } from "@/app/admin/actions";

/**
 * ส่งฟอร์มไปยัง server action โดยไม่ล้างค่าในฟอร์ม (React 19 จะรีเซ็ตฟอร์มเมื่อใช้ action={...})
 * เพื่อไม่ให้ข้อมูลที่พิมพ์หายเมื่อบันทึกไม่สำเร็จ
 */
export function useFormAction(fn: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, action, pending] = useActionState(fn, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    if (submitter?.name) fd.set(submitter.name, submitter.value);
    startTransition(() => action(fd));
  };
  return { state, pending, onSubmit };
}
