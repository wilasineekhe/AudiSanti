"use client";

import { Icon } from "@/components/Icon";
import { useFormAction } from "@/components/admin/useFormAction";
import { login } from "../actions";

export function LoginForm() {
  const { state, pending, onSubmit } = useFormAction(login);
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-danger">
          <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="username" className="label">ชื่อผู้ใช้หรืออีเมล</label>
        <input id="username" name="username" autoComplete="username" required className="input" autoCapitalize="none" />
      </div>
      <div>
        <label htmlFor="password" className="label">รหัสผ่าน</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
