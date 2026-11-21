import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="text-center">
        <p className="font-display text-6xl font-bold text-accent">404</p>
        <h1 className="mt-3 font-display text-xl font-semibold text-white">ไม่พบหน้าที่ต้องการ</h1>
        <p className="mt-2 text-sm text-muted">สินค้าหรือบทความนี้อาจถูกลบหรือย้ายไปแล้ว</p>
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/" className="btn-primary">กลับหน้าร้าน</Link>
          <Link href="/blog" className="btn-outline">ไปที่ Blog</Link>
        </div>
      </div>
    </div>
  );
}
