import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // ยึดโฟลเดอร์โปรเจกต์เป็น root (ในเครื่องมี package-lock.json อื่นอยู่ในโฟลเดอร์ผู้ใช้)
  outputFileTracingRoot: path.resolve(process.cwd()),
  experimental: {
    // บน Vercel จำกัดที่ราว 4.5 MB ต่อคำขออยู่แล้ว ฟอร์มสินค้าจึงเช็กขนาดรูปรวมไม่ให้เกิน 4 MB
    serverActions: { bodySizeLimit: "25mb" },
  },
};

export default nextConfig;
