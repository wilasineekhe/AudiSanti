/**
 * Seed ข้อมูลเริ่มต้น — รันได้ซ้ำโดยไม่สร้างข้อมูลซ้ำ
 * - สร้างบัญชีผู้ขายจาก ADMIN_USERNAME / ADMIN_PASSWORD (ครั้งแรกเท่านั้น)
 * - สร้างการตั้งค่าร้าน
 * - สร้างหมวดหมู่ + สินค้าและบทความตัวอย่าง (เฉพาะเมื่อยังไม่มีหมวดหมู่ใด ๆ และ SEED_SAMPLE_DATA ไม่ใช่ "false")
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const ICONS: Record<string, string> = {
  speaker: '<rect x="5" y="2" width="14" height="20" rx="2"/><circle cx="12" cy="14" r="4"/><circle cx="12" cy="14" r="1"/><circle cx="12" cy="6.5" r="1.2"/>',
  headphones: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
  amp: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="7" cy="12" r="2.5"/><circle cx="13" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/><path d="M5 18v2M19 18v2"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8"/>',
  mixer: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>',
  car: '<path d="M5 17h14M3 17v-4l2-5a2 2 0 0 1 2-1.4h10A2 2 0 0 1 19 8l2 5v4"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M3 13h18"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  wave: '<path d="M2 12h2l2-6 3 12 3-15 3 18 3-12 2 3h2"/>',
};

/** สร้างภาพตัวอย่าง SVG (แทนรูปถ่ายจริงจนกว่าผู้ขายจะอัปโหลด) */
async function sampleImage(name: string, icon: string, hue: number, variant = 0, wide = false) {
  const w = wide ? 1200 : 800;
  const h = wide ? 675 : 800;
  const size = wide ? 300 : 360;
  const cx = w / 2 - size / 2 + (variant ? (variant % 2 ? -60 : 60) : 0);
  const cy = h / 2 - size / 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">
<defs>
<radialGradient id="g" cx="${variant % 2 ? 30 : 70}%" cy="25%" r="85%"><stop offset="0" stop-color="hsl(${hue} 70% 22%)"/><stop offset=".55" stop-color="#15191D"/><stop offset="1" stop-color="#0E1012"/></radialGradient>
<pattern id="p" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="#30363D" stroke-opacity=".45"/></pattern>
</defs>
<rect width="${w}" height="${h}" fill="url(#g)"/><rect width="${w}" height="${h}" fill="url(#p)"/>
<ellipse cx="${w / 2}" cy="${h * 0.82}" rx="${size * 0.7}" ry="22" fill="#000" opacity=".45"/>
<g transform="translate(${cx} ${cy}) scale(${size / 24})" fill="none" stroke="hsl(${hue} 90% 62%)" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">${ICONS[icon] ?? ICONS.wave}</g>
</svg>`;
  const dir = path.join(UPLOAD_DIR, "samples");
  await mkdir(dir, { recursive: true });
  const file = `${name}-${variant}.svg`;
  await writeFile(path.join(dir, file), svg);
  return `/uploads/samples/${file}`;
}

const productCats = [
  { name: "ลำโพง", slug: "speakers", icon: "speaker" },
  { name: "หูฟัง", slug: "headphones", icon: "headphones" },
  { name: "แอมป์และเครื่องขยายเสียง", slug: "amplifiers", icon: "amp" },
  { name: "ไมโครโฟนและคาราโอเกะ", slug: "microphones", icon: "mic" },
  { name: "มิกเซอร์และอุปกรณ์เสียง", slug: "mixers", icon: "mixer" },
  { name: "เครื่องเสียงรถยนต์", slug: "car-audio", icon: "car" },
  { name: "อุปกรณ์อิเล็กทรอนิกส์อื่น ๆ", slug: "electronics", icon: "chip" },
];

const blogCats = [
  { name: "ประวัติร้าน Santi Audio", slug: "about" },
  { name: "ความรู้เรื่องเครื่องเสียง", slug: "knowledge" },
  { name: "วิธีเลือกซื้ออุปกรณ์", slug: "buying-guide" },
  { name: "วิธีดูแลและแก้ปัญหาเบื้องต้น", slug: "care" },
  { name: "เรื่องราวและข้อมูลสินค้า", slug: "stories" },
];

const products: {
  name: string; price: number; cat: string; condition: string; defects: string; description: string; sold?: boolean; imgs?: number;
}[] = [
  { name: "ลำโพงบลูทูธ JBL Charge 4 สีดำ", price: 2490, cat: "speakers", condition: "สภาพ 90% เสียงดี เบสแน่น แบตอึด", defects: "มีรอยขนแมวเล็กน้อยที่ตะแกรงด้านหน้า", description: "ลำโพงบลูทูธกันน้ำ IPX7\nแบตใช้งานได้ประมาณ 15–18 ชั่วโมง\nพร้อมสายชาร์จ USB-C\nทดสอบเสียงทุกย่านความถี่แล้ว", imgs: 3 },
  { name: "หูฟัง Sony WH-1000XM3 ตัดเสียงรบกวน", price: 3990, cat: "headphones", condition: "สภาพ 85% ตัดเสียงรบกวนทำงานปกติ", defects: "ฟองน้ำครอบหูเริ่มลอกเล็กน้อย", description: "หูฟังไร้สายตัดเสียงรบกวน\nพร้อมเคสแข็งและสาย AUX\nแบตยังอึด ใช้งานได้ราว 20 ชม.", imgs: 2 },
  { name: "แอมป์ Yamaha A-S301 Integrated Amplifier", price: 8500, cat: "amplifiers", condition: "สภาพ 92% ใช้งานปกติทุกช่อง", defects: "มีรอยขีดข่วนเล็กน้อยที่ฝาด้านบน", description: "แอมป์ 2 แชนแนล 60W x2\nมี DAC ในตัว รองรับ Optical / Coaxial\nปุ่มวอลุ่มไม่มีเสียงแตก", imgs: 3 },
  { name: "ไมโครโฟนไร้สาย Shure BLX288 คู่", price: 6900, cat: "microphones", condition: "สภาพ 88% รับสัญญาณดี ระยะไกล", defects: "ไม่มีกล่องเดิม", description: "ชุดไมค์ลอยคู่ UHF\nเหมาะสำหรับร้องเพลง งานพูด งานอีเวนต์\nพร้อมตัวรับสัญญาณและอะแดปเตอร์" },
  { name: "มิกเซอร์ Behringer Xenyx 1202FX", price: 3200, cat: "mixers", condition: "สภาพ 80% ทุกแชนแนลใช้งานได้", defects: "วอลุ่มช่อง 3 มีเสียงซ่าเล็กน้อยตอนหมุน", description: "มิกเซอร์ 12 อินพุต มีเอฟเฟกต์ในตัว\nเหมาะกับห้องซ้อม งานเล็ก", sold: true },
  { name: "ซับวูฟเฟอร์รถยนต์ Pioneer 12 นิ้ว พร้อมตู้", price: 2800, cat: "car-audio", condition: "สภาพ 85% เบสลึก ไม่มีเสียงขาด", defects: "ตู้มีรอยถลอกที่มุม", description: "ซับ 12 นิ้ว พร้อมตู้ไม้ MDF\nเหมาะกับรถเก๋งและกระบะ" },
  { name: "ลำโพงบ้าน Bookshelf Wharfedale Diamond 9.1", price: 4500, cat: "speakers", condition: "สภาพ 90% เสียงใส มิติดี", defects: "", description: "ลำโพงวางหิ้ง 2 ทาง\nขายเป็นคู่ พร้อมสายลำโพง", imgs: 2 },
  { name: "หูฟัง Audio-Technica ATH-M50x สีดำ", price: 3300, cat: "headphones", condition: "สภาพ 87% เสียงครบ ไม่มีข้างเบา", defects: "หนังคาดหัวมีรอยลอก", description: "หูฟังมอนิเตอร์ยอดนิยม\nสายถอดได้ 3 เส้น", sold: true },
  { name: "เครื่องเล่น CD Marantz CD5005", price: 5200, cat: "electronics", condition: "สภาพ 88% อ่านแผ่นไว", defects: "ไม่มีรีโมท", description: "เครื่องเล่นซีดีโทนเสียงอบอุ่น\nอ่านแผ่น CD-R / MP3 ได้" },
  { name: "Power Amp Crown XLS 1002", price: 7900, cat: "amplifiers", condition: "สภาพ 85% กำลังขับเต็ม", defects: "หน้ากากมีรอยเล็กน้อย", description: "เพาเวอร์แอมป์ 2 ชาแนล\nมี DSP ในตัว เหมาะงานกลางแจ้งขนาดเล็ก" },
  { name: "เครื่องเล่นวิทยุติดรถยนต์ Kenwood 2DIN", price: 2200, cat: "car-audio", condition: "สภาพ 82% จอทัชใช้งานปกติ", defects: "จอมีรอยขนแมว", description: "รองรับบลูทูธ USB และกล้องถอย" },
  { name: "ไมค์คอนเดนเซอร์ Rode NT1-A", price: 4200, cat: "microphones", condition: "สภาพ 93% เสียงใส noise ต่ำ", defects: "", description: "ไมค์สตูดิโอ พร้อม Shock mount และ Pop filter", sold: true },
  { name: "Audio Interface Focusrite Scarlett 2i2 Gen3", price: 3400, cat: "mixers", condition: "สภาพ 95% แทบไม่ได้ใช้", defects: "", description: "อินเทอร์เฟซ 2 อินพุต สำหรับอัดเสียงและไลฟ์สด\nพร้อมสาย USB" },
  { name: "DAC/แอมป์หูฟัง FiiO K5 Pro", price: 2900, cat: "electronics", condition: "สภาพ 90% ไม่มีเสียงรบกวน", defects: "ปุ่มวอลุ่มฝืดเล็กน้อย", description: "DAC พร้อมแอมป์หูฟังตั้งโต๊ะ ขับหูฟังได้หลากหลาย" },
];

const HUES: Record<string, number> = { speakers: 192, headphones: 205, amplifiers: 28, microphones: 150, mixers: 262, "car-audio": 350, electronics: 175 };

async function main() {
  // บัญชีผู้ขาย
  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const adminCount = await prisma.adminUser.count();
  if (adminCount === 0) {
    if (!password) {
      console.warn("⚠ ยังไม่มีบัญชีผู้ขาย: ตั้งค่า ADMIN_PASSWORD แล้วรัน seed อีกครั้ง");
    } else {
      await prisma.adminUser.create({ data: { username, passwordHash: await bcrypt.hash(password, 12) } });
      console.log(`✓ สร้างบัญชีผู้ขาย "${username}"`);
    }
  }

  // ตั้งค่าร้าน
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      shopName: "Santi Audio",
      tagline: "เครื่องเสียงและอุปกรณ์อิเล็กทรอนิกส์มือสอง",
      description: "คัดเครื่องเสียงมือสองสภาพดี ทดสอบทุกชิ้นก่อนขาย แจ้งตำหนิตามจริง สนใจชิ้นไหนทักสอบถามผู้ขายทาง Facebook ได้เลย",
      facebookUrl: process.env.FACEBOOK_URL || "https://www.facebook.com/",
    },
  });

  if ((await prisma.category.count()) > 0) {
    console.log("✓ มีข้อมูลอยู่แล้ว ข้ามการสร้างข้อมูลตัวอย่าง");
    return;
  }

  // หมวดหมู่
  for (const [i, c] of productCats.entries()) {
    await prisma.category.create({ data: { ...c, type: "PRODUCT", sortOrder: i + 1 } });
  }
  for (const [i, c] of blogCats.entries()) {
    await prisma.category.create({ data: { ...c, type: "BLOG", icon: "book", sortOrder: i + 1 } });
  }
  console.log("✓ สร้างหมวดหมู่");

  if (process.env.SEED_SAMPLE_DATA === "false") return;

  const cats = await prisma.category.findMany();
  const catId = (slug: string, type: "PRODUCT" | "BLOG" = "PRODUCT") => cats.find((c) => c.slug === slug && c.type === type)!.id;

  // สินค้าตัวอย่าง (เพิ่มทีละชิ้นให้เวลาสร้างต่างกัน)
  for (const [i, p] of products.entries()) {
    const icon = productCats.find((c) => c.slug === p.cat)!.icon;
    const imgs = [];
    for (let v = 0; v < (p.imgs ?? 1); v++) imgs.push(await sampleImage(`p${i + 1}`, icon, HUES[p.cat] + v * 18, v));
    await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        categoryId: catId(p.cat),
        condition: p.condition,
        defects: p.defects,
        description: p.description,
        status: p.sold ? "SOLD" : "AVAILABLE",
        createdAt: new Date(Date.now() - (products.length - i) * 86_400_000),
        images: { create: imgs.map((path, k) => ({ path, isMain: k === 0, sortOrder: k })) },
      },
    });
  }
  console.log(`✓ สร้างสินค้าตัวอย่าง ${products.length} ชิ้น`);

  const posts = [
    {
      title: "จุดเริ่มต้นของ Santi Audio",
      slug: "santi-audio-story",
      cat: "about",
      icon: "wave",
      hue: 192,
      excerpt: "จากความชอบฟังเพลงและซ่อมเครื่องเสียงในบ้าน สู่ร้านเครื่องเสียงมือสองที่คัดของดีและบอกตำหนิตามจริง",
      content: `Santi Audio เริ่มต้นจากความชอบส่วนตัวในการฟังเพลงและการซ่อมเครื่องเสียงเก่าในบ้าน เมื่อเครื่องที่ซ่อมเสร็จมีมากขึ้น จึงเริ่มส่งต่อให้คนที่สนใจ

## สิ่งที่เรายึดถือ

- **ทดสอบทุกชิ้นก่อนขาย** ฟังจริงทุกย่านเสียง
- **แจ้งตำหนิตามจริง** ถ่ายรูปให้เห็นชัด
- **คุยกันตรง ๆ** ผ่าน Facebook ถามได้ทุกเรื่อง

> เครื่องเสียงดี ๆ ไม่จำเป็นต้องเป็นของใหม่เสมอไป

ขอบคุณลูกค้าทุกท่านที่ให้ความไว้วางใจครับ`,
    },
    {
      title: "5 ข้อควรเช็กก่อนซื้อลำโพงบลูทูธมือสอง",
      slug: "check-used-bluetooth-speaker",
      cat: "buying-guide",
      icon: "speaker",
      hue: 200,
      excerpt: "แบตเตอรี่ การเชื่อมต่อ เสียงแตก และจุดอื่น ๆ ที่ควรตรวจก่อนตัดสินใจซื้อลำโพงบลูทูธมือสอง",
      content: `ลำโพงบลูทูธมือสองเป็นตัวเลือกที่คุ้มค่า แต่ควรเช็กสิ่งเหล่านี้ก่อนซื้อ

## 1. แบตเตอรี่
ถามระยะเวลาใช้งานจริงต่อการชาร์จหนึ่งครั้ง และดูว่าชาร์จเข้าปกติหรือไม่

## 2. เสียงแตกที่วอลุ่มสูง
ลองเปิดเพลงที่มีเบสหนักที่ระดับเสียง 70–80%

## 3. การเชื่อมต่อบลูทูธ
ดูว่าเชื่อมต่อง่าย ไม่หลุดเมื่อเดินห่างประมาณ 5–10 เมตร

## 4. พอร์ตชาร์จและปุ่ม
พอร์ตไม่หลวม ปุ่มกดทุกปุ่มทำงาน

## 5. ตำหนิภายนอก
รอยขีดข่วนไม่มีผลกับเสียง แต่ควรรู้ก่อนเพื่อความสบายใจ

หากไม่แน่ใจ ทักถามผู้ขายทาง Facebook ได้เลยครับ`,
    },
    {
      title: "แอมป์ Integrated กับ Power Amp ต่างกันอย่างไร",
      slug: "integrated-vs-power-amp",
      cat: "knowledge",
      icon: "amp",
      hue: 28,
      excerpt: "อธิบายความต่างของแอมป์สองแบบแบบเข้าใจง่าย พร้อมแนะนำว่าแบบไหนเหมาะกับการใช้งานของคุณ",
      content: `## Integrated Amplifier
รวมปรีแอมป์และเพาเวอร์แอมป์ไว้ในเครื่องเดียว มีปุ่มปรับเสียงและเลือกอินพุต เหมาะกับการฟังเพลงในบ้าน

## Power Amplifier
ทำหน้าที่ขยายกำลังอย่างเดียว ต้องใช้ร่วมกับปรีแอมป์หรือมิกเซอร์ เหมาะกับงานเวที งานกลางแจ้ง

| | Integrated | Power Amp |
|---|---|---|
| ใช้งาน | บ้าน | เวที/งานอีเวนต์ |
| ปรับเสียง | มีในตัว | ต้องใช้อุปกรณ์เพิ่ม |`,
    },
    {
      title: "ดูแลหูฟังให้ใช้งานได้นาน",
      slug: "headphone-care",
      cat: "care",
      icon: "headphones",
      hue: 205,
      excerpt: "วิธีเก็บ ทำความสะอาด และแก้ปัญหาเบื้องต้นของหูฟัง ทั้งแบบมีสายและไร้สาย",
      content: `- เก็บในเคสทุกครั้งหลังใช้งาน
- เช็ดฟองน้ำด้วยผ้าหมาด ๆ สัปดาห์ละครั้ง
- อย่าดึงสายที่ตัวสาย ให้จับที่หัวแจ็ค
- หูฟังไร้สาย ไม่ควรปล่อยแบตหมดเป็นเวลานาน

## เสียงออกข้างเดียว?
ลองเปลี่ยนสายหรือเช็กการตั้งค่า Balance ในโทรศัพท์ก่อน`,
    },
  ];

  for (const [i, p] of posts.entries()) {
    await prisma.post.create({
      data: {
        title: p.title,
        slug: p.slug,
        excerpt: p.excerpt,
        content: p.content,
        categoryId: catId(p.cat, "BLOG"),
        coverImage: await sampleImage(`blog${i + 1}`, p.icon, p.hue, 0, true),
        published: true,
        publishedAt: new Date(Date.now() - (posts.length - i) * 3 * 86_400_000),
      },
    });
  }
  console.log(`✓ สร้างบทความตัวอย่าง ${posts.length} เรื่อง`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
