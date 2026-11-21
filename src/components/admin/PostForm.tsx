"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { savePost } from "@/app/admin/actions";
import { Icon } from "../Icon";
import { CROP_COVER, ImageCropper, setInputFile, urlToFile } from "./ImageCropper";
import { Notice } from "./ui";
import { useFormAction } from "./useFormAction";

export type PostFormValues = {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categoryId: number | null;
  coverImage: string | null;
  published: boolean;
};

const TIPS = [
  ["## หัวข้อ", "หัวข้อใหญ่"],
  ["**ตัวหนา**", "ตัวหนา"],
  ["- รายการ", "รายการแบบจุด"],
  ["[ข้อความ](https://...)", "ลิงก์"],
  ["![คำอธิบาย](/uploads/...)", "รูปภาพ"],
  ["> ข้อความ", "กล่องอ้างอิง"],
];

export function PostForm({
  initial,
  categories,
  preview,
}: {
  initial: PostFormValues;
  categories: { id: number; name: string }[];
  preview?: React.ReactNode;
}) {
  const { state, pending, onSubmit } = useFormAction(savePost);
  const [cover, setCover] = useState<string | null>(initial.coverImage);
  const [removeCover, setRemoveCover] = useState(false);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [cropError, setCropError] = useState<string | null>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const recrop = async () => {
    setCropError(null);
    try {
      setCropSource(original ?? (cover ? await urlToFile(cover) : null));
    } catch {
      setCropError("โหลดภาพปกเดิมมาครอบตัดไม่ได้");
    }
  };
  const [tab, setTab] = useState<"write" | "preview">(preview ? "preview" : "write");

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="removeCover" value={removeCover ? "1" : ""} />

      <div className="min-w-0 space-y-6">
        {state?.error && <Notice tone="error">{state.error}</Notice>}

        <section className="card space-y-4 p-4 sm:p-5">
          <div>
            <label htmlFor="title" className="label">ชื่อเรื่อง *</label>
            <input id="title" name="title" required defaultValue={initial.title} className="input text-base" placeholder="เช่น วิธีเลือกลำโพงบลูทูธมือสอง" />
          </div>
          <div>
            <label htmlFor="excerpt" className="label">ข้อความเกริ่น</label>
            <textarea id="excerpt" name="excerpt" rows={2} defaultValue={initial.excerpt} className="input" placeholder="สรุปสั้น ๆ 1–2 ประโยค แสดงในหน้ารายการบทความ" />
          </div>
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2 sm:px-5">
            <span className="text-sm font-medium text-white">เนื้อหา (Markdown)</span>
            {preview && (
              <div className="flex rounded-lg bg-ink p-1 text-xs">
                {(["write", "preview"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-md px-3 py-1.5 ${tab === t ? "bg-card text-accent" : "text-muted"}`}
                  >
                    {t === "write" ? "เขียน" : "ตัวอย่าง"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className={tab === "write" ? "p-4 sm:p-5" : "hidden"}>
            <textarea
              name="content"
              rows={18}
              defaultValue={initial.content}
              className="input font-mono text-[13px]"
              placeholder={"เขียนเนื้อหาที่นี่...\n\n## หัวข้อ\nย่อหน้า..."}
            />
            <details className="mt-3 text-xs text-muted">
              <summary className="cursor-pointer select-none text-accent">วิธีจัดรูปแบบข้อความ</summary>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {TIPS.map(([code, label]) => (
                  <li key={code} className="flex min-w-0 items-center gap-2">
                    <code className="truncate rounded bg-ink px-1.5 py-0.5 text-accent">{code}</code>
                    <span className="shrink-0">{label}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
          {preview && <div className={tab === "preview" ? "p-4 sm:p-6" : "hidden"}>{preview}</div>}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <section className="card space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-white">การเผยแพร่</h2>
            <span className={initial.published ? "badge-ok" : "badge bg-warn/15 text-warn ring-1 ring-warn/30"}>
              {initial.published ? "เผยแพร่แล้ว" : "ฉบับร่าง"}
            </span>
          </div>
          <div>
            <label htmlFor="categoryId" className="label">หมวดหมู่</label>
            <select id="categoryId" name="categoryId" defaultValue={initial.categoryId ?? ""} className="input">
              <option value="">— ไม่ระบุ —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="slug" className="label">ลิงก์บทความ (slug)</label>
            <input id="slug" name="slug" defaultValue={initial.slug} className="input" placeholder="สร้างจากชื่อเรื่องอัตโนมัติ" />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <h2 className="font-display font-semibold text-white">ภาพปก</h2>
          <div className="mt-3 aspect-[16/9] overflow-hidden rounded-xl border border-line bg-raised">
            {cover && !removeCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-muted">
                <Icon name="image" className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <label className="btn-outline btn-sm flex-1 cursor-pointer">
              <Icon name="image" className="h-4 w-4" /> เลือกรูป
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setCropSource(f);
                  e.target.value = "";
                }}
              />
            </label>
            {cover && !removeCover && (
              <>
                <button type="button" className="btn-ghost btn-sm" onClick={recrop} aria-label="ครอบตัดภาพปก">
                  <Icon name="crop" className="h-4 w-4" />
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setRemoveCover(true)}>
                  ลบภาพ
                </button>
              </>
            )}
          </div>
          <input ref={coverInput} type="file" name="cover" className="hidden" tabIndex={-1} aria-hidden />
          {cropError && <p className="mt-2 text-xs text-danger">{cropError}</p>}
          <p className="mt-2 text-xs text-muted">ภาพจะถูกครอบตัดเป็น 16:9 ตามกรอบที่แสดงในหน้า Blog</p>
          {cropSource && (
            <ImageCropper
              file={cropSource}
              preset={CROP_COVER}
              onCancel={() => setCropSource(null)}
              onDone={(file) => {
                setInputFile(coverInput.current, file);
                setOriginal(cropSource);
                setCover(URL.createObjectURL(file));
                setRemoveCover(false);
                setCropSource(null);
              }}
            />
          )}
        </section>

        <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-ink/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 lg:grid-cols-1">
            <button type="submit" name="intent" value="publish" disabled={pending} className="btn-primary lg:order-1">
              <Icon name="check" className="hidden h-4 w-4 sm:block" />
              {initial.published ? "บันทึก" : "เผยแพร่"}
            </button>
            <button type="submit" name="intent" value="preview" disabled={pending} className="btn-outline lg:order-2">
              <Icon name="eye" className="hidden h-4 w-4 sm:block" /> ดูตัวอย่าง
            </button>
            <button type="submit" name="intent" value="draft" disabled={pending} className="btn-outline lg:order-3">
              {initial.published ? "ย้ายเป็นร่าง" : "บันทึกร่าง"}
            </button>
            <Link href="/admin/blog" className="btn-ghost hidden lg:order-4 lg:inline-flex">
              ยกเลิก
            </Link>
          </div>
          {pending && <p className="mt-2 text-center text-xs text-muted">กำลังบันทึก...</p>}
        </div>
      </aside>
      {/* เว้นที่ให้แถบปุ่มบันทึกด้านล่างบนมือถือ */}
      <div className="h-20 lg:hidden" aria-hidden />
    </form>
  );
}
