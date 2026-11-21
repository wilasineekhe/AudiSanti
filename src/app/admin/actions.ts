"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/session";
import { deleteImage, isRealFile, saveImage } from "@/lib/uploads";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string, max = 5000) => String(fd.get(k) ?? "").trim().slice(0, max);
const intOrNull = (v: string) => (v && Number.isInteger(Number(v)) ? Number(v) : null);

function refreshPublic() {
  revalidatePath("/", "layout");
}

/* ───────────── เข้าสู่ระบบ ───────────── */

const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const username = str(fd, "username", 100).toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!username || !password) return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" };

  const a = attempts.get(username);
  if (a && a.until > Date.now()) return { error: "ลองผิดหลายครั้งเกินไป กรุณารอ 5 นาทีแล้วลองใหม่" };

  const user = await prisma.adminUser.findUnique({ where: { username } });
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
  if (!user || !ok) {
    const n = (a?.n ?? 0) + 1;
    attempts.set(username, { n, until: n >= 5 ? Date.now() + 5 * 60_000 : 0 });
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }
  attempts.delete(username);

  const token = await createSessionToken(user.id, user.username);
  (await cookies()).set(SESSION_COOKIE, token, sessionCookieOptions);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}

/* ───────────── สินค้า ───────────── */

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  const name = str(fd, "name", 200);
  const price = Number(str(fd, "price").replace(/[,\s]/g, ""));
  if (!name) return { error: "กรุณาใส่ชื่อสินค้า" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" };

  const data = {
    name,
    price: Math.round(price),
    categoryId: intOrNull(str(fd, "categoryId")),
    condition: str(fd, "condition", 300),
    defects: str(fd, "defects", 1000),
    description: str(fd, "description", 10000),
    status: str(fd, "status") === "SOLD" ? ("SOLD" as const) : ("AVAILABLE" as const),
  };

  const newFiles = fd.getAll("newImages").filter(isRealFile);
  const removeIds = fd.getAll("removeImage").map((v) => Number(v)).filter(Number.isInteger);
  const main = str(fd, "main"); // "e:<id>" หรือ "n:<index>"

  let savedPaths: string[] = [];
  try {
    savedPaths = await Promise.all(newFiles.map((f) => saveImage(f, "products")));
  } catch (e) {
    return { error: (e as Error).message };
  }

  const productId = await prisma.$transaction(async (tx) => {
    const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });

    if (removeIds.length) {
      const toRemove = await tx.productImage.findMany({ where: { id: { in: removeIds }, productId: product.id } });
      await tx.productImage.deleteMany({ where: { id: { in: toRemove.map((r) => r.id) } } });
      await Promise.all(toRemove.map((r) => deleteImage(r.path)));
    }

    const maxOrder = await tx.productImage.aggregate({ where: { productId: product.id }, _max: { sortOrder: true } });
    let order = (maxOrder._max.sortOrder ?? 0) + 1;
    const created = [];
    for (const path of savedPaths) {
      created.push(await tx.productImage.create({ data: { productId: product.id, path, sortOrder: order++ } }));
    }

    // ตั้งรูปหลัก
    let mainId: number | undefined;
    if (main.startsWith("e:")) mainId = Number(main.slice(2));
    if (main.startsWith("n:")) mainId = created[Number(main.slice(2))]?.id;
    const remaining = await tx.productImage.findMany({ where: { productId: product.id }, orderBy: { sortOrder: "asc" } });
    if (!mainId || !remaining.some((r) => r.id === mainId)) {
      mainId = remaining.find((r) => r.isMain)?.id ?? remaining[0]?.id;
    }
    await tx.productImage.updateMany({ where: { productId: product.id }, data: { isMain: false } });
    if (mainId) await tx.productImage.update({ where: { id: mainId }, data: { isMain: true } });

    return product.id;
  });

  refreshPublic();
  redirect(`/admin/products?saved=${productId}`);
}

export async function setProductStatus(fd: FormData) {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  const status = str(fd, "status") === "SOLD" ? "SOLD" : "AVAILABLE";
  if (id) await prisma.product.update({ where: { id }, data: { status } });
  refreshPublic();
}

export async function deleteProduct(fd: FormData) {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  if (!id) return;
  const images = await prisma.productImage.findMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } }).catch(() => {});
  await Promise.all(images.map((i) => deleteImage(i.path)));
  refreshPublic();
  redirect("/admin/products?deleted=1");
}

/* ───────────── บทความ ───────────── */

async function uniqueSlug(base: string, excludeId?: number | null) {
  let slug = slugify(base).slice(0, 80);
  for (let i = 2; ; i++) {
    const hit = await prisma.post.findUnique({ where: { slug } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${slugify(base).slice(0, 76)}-${i}`;
  }
}

export async function savePost(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  const title = str(fd, "title", 200);
  if (!title) return { error: "กรุณาใส่ชื่อเรื่อง" };
  const intent = str(fd, "intent"); // publish | draft | preview
  const existing = id ? await prisma.post.findUnique({ where: { id } }) : null;

  let coverImage = existing?.coverImage ?? null;
  const cover = fd.get("cover");
  try {
    if (isRealFile(cover)) {
      const p = await saveImage(cover, "blog");
      await deleteImage(coverImage);
      coverImage = p;
    } else if (str(fd, "removeCover") === "1") {
      await deleteImage(coverImage);
      coverImage = null;
    }
  } catch (e) {
    return { error: (e as Error).message };
  }

  const published = intent === "publish" ? true : intent === "draft" ? false : (existing?.published ?? false);
  const data = {
    title,
    slug: await uniqueSlug(str(fd, "slug", 100) || title, id),
    excerpt: str(fd, "excerpt", 500),
    content: str(fd, "content", 100000),
    categoryId: intOrNull(str(fd, "categoryId")),
    coverImage,
    published,
    publishedAt: published ? (existing?.publishedAt ?? new Date()) : existing?.publishedAt ?? null,
  };

  const post = id ? await prisma.post.update({ where: { id }, data }) : await prisma.post.create({ data });
  refreshPublic();

  if (intent === "preview") redirect(`/admin/blog/${post.id}?preview=1`);
  redirect(`/admin/blog?saved=${post.id}`);
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  if (!id) return;
  const post = await prisma.post.findUnique({ where: { id } });
  if (post) {
    await prisma.post.delete({ where: { id } });
    await deleteImage(post.coverImage);
  }
  refreshPublic();
  redirect("/admin/blog?deleted=1");
}

/* ───────────── หมวดหมู่ ───────────── */

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  const name = str(fd, "name", 80);
  const type = str(fd, "type") === "BLOG" ? "BLOG" : "PRODUCT";
  if (!name) return { error: "กรุณาใส่ชื่อหมวดหมู่" };
  const data = {
    name,
    type: type as "BLOG" | "PRODUCT",
    slug: slugify(str(fd, "slug", 80) || name),
    icon: str(fd, "icon", 30) || "box",
    sortOrder: Number(str(fd, "sortOrder")) || 0,
  };
  try {
    if (id) await prisma.category.update({ where: { id }, data });
    else await prisma.category.create({ data });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "มีหมวดหมู่ที่ใช้ชื่อลิงก์ (slug) นี้แล้ว" };
    }
    throw e;
  }
  refreshPublic();
  return { ok: id ? "บันทึกการแก้ไขแล้ว" : "เพิ่มหมวดหมู่แล้ว" };
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const id = intOrNull(str(fd, "id"));
  // รายการที่ผูกอยู่จะถูกตั้งเป็น "ไม่มีหมวดหมู่" (onDelete: SetNull)
  if (id) await prisma.category.delete({ where: { id } }).catch(() => {});
  refreshPublic();
}

/* ───────────── ตั้งค่าร้าน ───────────── */

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const facebookUrl = str(fd, "facebookUrl", 300);
  if (facebookUrl && !/^https:\/\/(www\.|m\.)?(facebook\.com|fb\.com|m\.me|fb\.me)\//i.test(facebookUrl)) {
    return { error: "ลิงก์ Facebook ต้องขึ้นต้นด้วย https://facebook.com/ หรือ https://m.me/" };
  }
  const current = await prisma.setting.findUnique({ where: { id: 1 } });
  let logo = current?.logo ?? null;
  let heroImage = current?.heroImage ?? null;
  const file = fd.get("logo");
  try {
    if (isRealFile(file)) {
      const p = await saveImage(file, "shop");
      await deleteImage(logo);
      logo = p;
    } else if (str(fd, "removeLogo") === "1") {
      await deleteImage(logo);
      logo = null;
    }
    // รูปหน้าแรก (hero)
    const hero = fd.get("heroImage");
    if (isRealFile(hero)) {
      const p = await saveImage(hero, "shop");
      await deleteImage(heroImage);
      heroImage = p;
    } else if (str(fd, "removeHero") === "1") {
      await deleteImage(heroImage);
      heroImage = null;
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  const data = {
    shopName: str(fd, "shopName", 80) || "Santi Audio",
    tagline: str(fd, "tagline", 150),
    description: str(fd, "description", 1000),
    facebookUrl,
    logo,
    heroImage,
  };
  await prisma.setting.upsert({ where: { id: 1 }, update: data, create: { id: 1, ...data } });
  refreshPublic();
  return { ok: "บันทึกการตั้งค่าแล้ว" };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const session = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { error: "รหัสผ่านใหม่ต้องยาวอย่างน้อย 8 ตัวอักษร" };
  const user = await prisma.adminUser.findUnique({ where: { id: session.userId } });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: "เปลี่ยนรหัสผ่านแล้ว" };
}
