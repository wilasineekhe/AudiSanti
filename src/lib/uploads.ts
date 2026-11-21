import "server-only";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import crypto from "crypto";

/**
 * ที่เก็บรูป
 * - ถ้าตั้ง CLOUDINARY_URL (เช่นบน Vercel) → อัปโหลดไป Cloudinary แล้วเก็บ URL เต็มในฐานข้อมูล
 * - ถ้าไม่ตั้ง (รันในเครื่อง) → เก็บไฟล์ใน UPLOAD_DIR แล้วเสิร์ฟผ่าน /uploads/...
 */
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 8 * 1024 * 1024;
const CLOUD_FOLDER = "santi-audio";

type Folder = "products" | "blog" | "shop";

export function isRealFile(v: FormDataEntryValue | null): v is File {
  return typeof v === "object" && v !== null && "size" in v && v.size > 0;
}

/** อ่าน cloudinary://API_KEY:API_SECRET@CLOUD_NAME */
function cloudinaryConfig() {
  const raw = process.env.CLOUDINARY_URL;
  if (!raw) return null;
  const m = raw.trim().match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) throw new Error("CLOUDINARY_URL ไม่ถูกต้อง (ต้องเป็น cloudinary://API_KEY:API_SECRET@CLOUD_NAME)");
  return { apiKey: m[1], apiSecret: m[2], cloud: m[3] };
}

function sign(params: Record<string, string>, secret: string) {
  const base = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(base + secret).digest("hex");
}

/** บันทึกรูปแล้วคืนค่าที่อยู่สำหรับเก็บในฐานข้อมูล (/uploads/... หรือ https://res.cloudinary.com/...) */
export async function saveImage(file: File, folder: Folder) {
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error("รองรับเฉพาะไฟล์ JPG, PNG, WEBP หรือ GIF");
  if (file.size > MAX_BYTES) throw new Error("ไฟล์รูปต้องไม่เกิน 8 MB");
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

  const cfg = cloudinaryConfig();
  if (cfg) {
    const params = {
      folder: `${CLOUD_FOLDER}/${folder}`,
      public_id: name,
      timestamp: String(Math.floor(Date.now() / 1000)),
    };
    const body = new FormData();
    Object.entries(params).forEach(([k, v]) => body.set(k, v));
    body.set("api_key", cfg.apiKey);
    body.set("signature", sign(params, cfg.apiSecret));
    body.set("file", file);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/upload`, { method: "POST", body });
    const json = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
    if (!res.ok || !json.secure_url) {
      console.error("Cloudinary upload failed", res.status, json.error?.message);
      throw new Error("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
    return json.secure_url;
  }

  const dir = path.join(UPLOAD_DIR, folder);
  await mkdir(dir, { recursive: true });
  const fileName = name + ext;
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${fileName}`;
}

/** ลบรูป (ไม่ error ถ้าลบไม่ได้ เพื่อไม่ให้การบันทึกข้อมูลล้ม) */
export async function deleteImage(stored: string | null | undefined) {
  if (!stored) return;

  if (stored.startsWith("https://res.cloudinary.com/")) {
    const cfg = cloudinaryConfig();
    // .../image/upload/v123/santi-audio/products/abc.jpg → santi-audio/products/abc
    const m = stored.match(/\/image\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z0-9]+)?$/i);
    if (!cfg || !m) return;
    const params = { public_id: decodeURIComponent(m[1]), timestamp: String(Math.floor(Date.now() / 1000)) };
    const body = new FormData();
    Object.entries(params).forEach(([k, v]) => body.set(k, v));
    body.set("api_key", cfg.apiKey);
    body.set("signature", sign(params, cfg.apiSecret));
    await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloud}/image/destroy`, { method: "POST", body }).catch(() => {});
    return;
  }

  if (!stored.startsWith("/uploads/")) return;
  const abs = path.resolve(UPLOAD_DIR, stored.replace(/^\/uploads\//, ""));
  if (!abs.startsWith(UPLOAD_DIR + path.sep)) return;
  await unlink(abs).catch(() => {});
}
