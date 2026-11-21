# Santi Audio

เว็บไซต์ร้านเครื่องเสียงและอุปกรณ์อิเล็กทรอนิกส์มือสอง — หน้าร้าน, Blog และหลังบ้านผู้ขาย ในโปรเจกต์ Next.js เดียว
ลูกค้าดูสินค้าแล้วติดต่อผู้ขายทาง Facebook (ไม่มีตะกร้า/ชำระเงิน/บัญชีลูกค้า)

**เทคโนโลยี:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma · PostgreSQL · Cloudinary

## โครงสร้างหน้า

| ส่วน | URL |
|---|---|
| หน้าร้าน (ค้นหา / กรองหมวด-สถานะ / เรียงราคา) | `/` |
| รายละเอียดสินค้า | `/products/[id]` |
| Blog / บทความ | `/blog`, `/blog/[slug]` |
| เข้าสู่ระบบผู้ขาย | `/admin/login` |
| แดชบอร์ด | `/admin` |
| จัดการสินค้า | `/admin/products` |
| จัดการ Blog (Markdown, ร่าง/เผยแพร่/ดูตัวอย่าง) | `/admin/blog` |
| หมวดหมู่สินค้าและ Blog | `/admin/categories` |
| ตั้งค่าร้าน (ชื่อ, คำอธิบาย, ลิงก์ Facebook, โลโก้, เปลี่ยนรหัสผ่าน) | `/admin/settings` |

รูปที่อัปโหลดเก็บใน `UPLOAD_DIR` และเสิร์ฟผ่าน `/uploads/...` ฐานข้อมูลเก็บเฉพาะตำแหน่งไฟล์

## รันในเครื่อง

ต้องใช้ Node.js 20.9 ขึ้นไป (แนะนำ 22)

```bash
npm install
cp .env.example .env        # แล้วแก้ค่าใน .env
npx prisma migrate deploy   # สร้างตาราง
npx prisma db seed          # สร้างบัญชีผู้ขาย + หมวดหมู่ + ข้อมูลตัวอย่าง
npm run dev                 # http://localhost:3000
```

ถ้าไม่มี PostgreSQL ในเครื่อง ใช้ฐานข้อมูลจำลองของ Prisma ได้:

```bash
npx prisma dev --name santi-audio --detach
```

แล้วนำ URL แบบ `postgres://...` ที่แสดง (เติม `&connection_limit=1&pgbouncer=true`) ไปใส่ `DATABASE_URL`

## ตัวแปรสภาพแวดล้อม

| ตัวแปร | ความหมาย |
|---|---|
| `DATABASE_URL` | PostgreSQL (บน Neon ใช้ URL แบบ pooled) |
| `DIRECT_URL` | PostgreSQL แบบต่อตรง ใช้ตอนรัน migration (ในเครื่องใส่ค่าเดียวกับ `DATABASE_URL`) |
| `CLOUDINARY_URL` | ที่เก็บรูปบน Cloudinary — ถ้าไม่ตั้ง รูปจะเก็บใน `UPLOAD_DIR` |
| `AUTH_SECRET` | ค่าลับสำหรับเซ็นคุกกี้ล็อกอิน ยาว ≥ 32 ตัวอักษร |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | บัญชีผู้ขายเริ่มต้น ใช้ตอน seed ครั้งแรกเท่านั้น (รหัสผ่านถูก hash ด้วย bcrypt ก่อนเก็บ) |
| `FACEBOOK_URL` | ลิงก์ Facebook เริ่มต้น (แก้ได้ในหน้าตั้งค่าร้าน) |
| `UPLOAD_DIR` | โฟลเดอร์เก็บรูปเมื่อไม่ได้ใช้ Cloudinary (ในเครื่อง / Railway Volume `/data/uploads`) |
| `SEED_SAMPLE_DATA` | ตั้งเป็น `false` หากไม่ต้องการสินค้า/บทความตัวอย่างตอน deploy ครั้งแรก |

## Deploy ฟรี: Vercel + Neon + Cloudinary

| ส่วน | บริการ | หน้าที่ |
|---|---|---|
| เว็บ | [Vercel](https://vercel.com) (Hobby) | รัน Next.js |
| ฐานข้อมูล | [Neon](https://neon.tech) (Free) | PostgreSQL |
| รูปภาพ | [Cloudinary](https://cloudinary.com) (Free) | เก็บรูปที่อัปโหลดจากหลังบ้าน |

1. **Neon** → สร้าง Project (เลือก Region ใกล้ไทย เช่น Singapore) → ปุ่ม **Connect**
   - คัดลอก URL แบบ **Pooled** (มีคำว่า `-pooler`) → ใช้เป็น `DATABASE_URL`
   - ปิดตัวเลือก Connection pooling แล้วคัดลอกอีกครั้ง (ไม่มี `-pooler`) → ใช้เป็น `DIRECT_URL`
2. **Cloudinary** → สมัคร → Console → **API Keys** → คัดลอก *API environment variable* (`cloudinary://...`) → ใช้เป็น `CLOUDINARY_URL`
3. Push โค้ดขึ้น GitHub
4. **Vercel** → Add New → Project → Import repository นี้ → **Environment Variables** ใส่:

   | ตัวแปร | ค่า |
   |---|---|
   | `DATABASE_URL` | URL แบบ pooled จาก Neon |
   | `DIRECT_URL` | URL แบบตรงจาก Neon |
   | `CLOUDINARY_URL` | จาก Cloudinary |
   | `AUTH_SECRET` | ข้อความสุ่มยาว ≥ 32 ตัวอักษร |
   | `ADMIN_USERNAME` / `ADMIN_PASSWORD` | บัญชีผู้ขายเริ่มต้น |
   | `FACEBOOK_URL` | ลิงก์ Facebook ของร้าน |
   | `SEED_SAMPLE_DATA` | `false` (ไม่สร้างสินค้าตัวอย่าง) |

5. กด **Deploy** — สคริปต์ `vercel-build` จะสร้างตาราง (migration) + บัญชีผู้ขาย + หมวดหมู่ แล้ว build เว็บ
6. เข้า `https://<ชื่อโปรเจกต์>.vercel.app/admin/login` → เปลี่ยนรหัสผ่านในหน้าตั้งค่าร้าน

> - Vercel รับข้อมูลได้ราว 4.5 MB ต่อการบันทึกหนึ่งครั้ง — รูปที่ครอบตัดแล้วมีขนาดเล็ก แต่ถ้าเพิ่มรูปสินค้าหลายรูปพร้อมกันจนเกิน 4 MB ระบบจะเตือนให้บันทึกเป็นรอบ ๆ
> - ฐานข้อมูลฟรีของ Neon จะพักเมื่อไม่มีคนใช้ คนแรกที่เข้าหลังว่างไปนานอาจรอเพิ่ม 1–2 วินาที
> - push โค้ดใหม่ขึ้น GitHub เมื่อไร Vercel จะ deploy ให้อัตโนมัติ

## Deploy บน Railway (ทางเลือกแบบเสียเงิน)

1. Railway → **New Project → Deploy from GitHub repo** + **+ New → Database → PostgreSQL**
2. บริการเว็บตั้ง `DATABASE_URL = ${{Postgres.DATABASE_URL}}` และ `DIRECT_URL = ${{Postgres.DATABASE_URL}}`
3. **Settings → Volumes** mount path `/data` แล้วตั้ง `UPLOAD_DIR=/data/uploads` (หรือใช้ `CLOUDINARY_URL` แทน Volume)
4. ใส่ `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FACEBOOK_URL` แล้ว Deploy — `npm start` จะรัน migration + seed ให้

## หมายเหตุ

- ข้อมูลตัวอย่างใช้ภาพกราฟิก SVG แทนรูปจริง ผู้ขายลบหรือแก้ไขสินค้าตัวอย่างได้ในหลังบ้าน
- อัปโหลดรูปได้เฉพาะ JPG / PNG / WEBP / GIF ไม่เกิน 8 MB ต่อรูป
- เนื้อหา Blog เป็น Markdown และไม่อนุญาต HTML ดิบ
