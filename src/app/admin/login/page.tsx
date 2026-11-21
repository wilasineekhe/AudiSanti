import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "เข้าสู่ระบบผู้ขาย", robots: { index: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  const s = await getSettings();
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="grid-bg absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_65%)]" />
      <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/40 bg-accent/10 text-accent">
            <Icon name="wave" className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">{s.shopName}</h1>
          <p className="mt-1 text-sm text-muted">เข้าสู่ระบบสำหรับผู้ขาย</p>
        </div>
        <div className="card mt-6 p-5 sm:p-6">
          <LoginForm />
        </div>
        <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm text-muted hover:text-accent">
          <Icon name="arrowLeft" className="h-4 w-4" /> กลับไปหน้าร้าน
        </Link>
      </div>
    </div>
  );
}
