"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { saveProduct } from "@/app/admin/actions";
import { Icon } from "../Icon";
import { CROP_PRODUCT, ImageCropper, urlToFile } from "./ImageCropper";
import { Notice } from "./ui";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

type Existing = { id: number; path: string; isMain: boolean };
type NewImage = { file: File; url: string; original: File };
/** งานครอบตัดที่รออยู่: รูปใหม่, ครอบรูปใหม่ซ้ำ, หรือครอบรูปเดิมที่อัปโหลดแล้ว */
type CropJob = { source: File; target?: { kind: "new"; url: string } | { kind: "existing"; id: number } };
type Category = { id: number; name: string };

export type ProductFormValues = {
  id?: number;
  name: string;
  price: number | "";
  categoryId: number | null;
  condition: string;
  defects: string;
  description: string;
  status: "AVAILABLE" | "SOLD";
  images: Existing[];
};

export function ProductForm({ initial, categories }: { initial: ProductFormValues; categories: Category[] }) {
  const [state, action, pending] = useActionState(saveProduct, undefined);
  const [removed, setRemoved] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<NewImage[]>([]);
  const [queue, setQueue] = useState<CropJob[]>([]);
  const [done, setDone] = useState(0); // จำนวนรูปที่ครอบเสร็จในรอบนี้ (ไว้แสดง 1/3, 2/3)
  const [cropError, setCropError] = useState<string | null>(null);
  const initialMain = initial.images.find((i) => i.isMain) ?? initial.images[0];
  const [main, setMain] = useState(initialMain ? `e:${initialMain.id}` : "n:0");
  const hiddenInput = useRef<HTMLInputElement>(null);

  // ซิงก์ไฟล์ที่เลือกไว้เข้ากับ input ที่ส่งไปกับฟอร์ม
  useEffect(() => {
    if (!hiddenInput.current) return;
    const dt = new DataTransfer();
    newFiles.forEach((f) => dt.items.add(f.file));
    hiddenInput.current.files = dt.files;
  }, [newFiles]);

  useEffect(() => () => newFiles.forEach((f) => URL.revokeObjectURL(f.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const visibleExisting = initial.images.filter((i) => !removed.includes(i.id));
  const total = visibleExisting.length + newFiles.length;

  // ถ้ารูปหลักถูกลบ เลือกรูปแรกที่เหลือแทน
  useEffect(() => {
    const valid =
      (main.startsWith("e:") && visibleExisting.some((i) => `e:${i.id}` === main)) ||
      (main.startsWith("n:") && Number(main.slice(2)) < newFiles.length);
    if (!valid) setMain(visibleExisting[0] ? `e:${visibleExisting[0].id}` : "n:0");
  }, [removed, newFiles.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const enqueue = (jobs: CropJob[]) => {
    if (!jobs.length) return;
    setCropError(null);
    setQueue((q) => [...q, ...jobs]);
  };

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    enqueue(
      Array.from(list)
        .filter((f) => f.type.startsWith("image/"))
        .map((source) => ({ source })),
    );
  };

  const cropExisting = async (img: Existing) => {
    try {
      enqueue([{ source: await urlToFile(img.path), target: { kind: "existing", id: img.id } }]);
    } catch {
      setCropError("โหลดรูปเดิมมาครอบตัดไม่ได้ ลองใหม่อีกครั้ง");
    }
  };

  const finishJob = () => {
    setQueue((q) => q.slice(1));
    setDone((d) => d + 1);
  };
  useEffect(() => {
    if (!queue.length) setDone(0);
  }, [queue.length]);

  const onCropped = (job: CropJob, file: File) => {
    const url = URL.createObjectURL(file);
    const item: NewImage = { file, url, original: job.source };
    const t = job.target;
    if (t?.kind === "new") {
      // แทนที่รูปใหม่เดิมในตำแหน่งเดิม (รูปหลักยังเป็นตำแหน่งเดิม)
      setNewFiles((prev) =>
        prev.map((f) => {
          if (f.url !== t.url) return f;
          URL.revokeObjectURL(f.url);
          return item;
        }),
      );
    } else {
      const index = newFiles.length;
      setNewFiles((prev) => [...prev, item]);
      if (t?.kind === "existing") {
        // รูปเดิมถูกแทนด้วยรูปที่ครอบแล้ว ถ้าเป็นรูปหลักให้รูปใหม่เป็นรูปหลักแทน
        setRemoved((r) => [...r, t.id]);
        if (main === `e:${t.id}`) setMain(`n:${index}`);
      }
    }
    finishJob();
  };

  const removeNew = (idx: number) => {
    setNewFiles((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
    setMain((m) => {
      if (!m.startsWith("n:")) return m;
      const cur = Number(m.slice(2));
      return cur > idx ? `n:${cur - 1}` : m;
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        // โฮสต์ฟรีอย่าง Vercel รับข้อมูลได้ไม่เกินราว 4.5 MB ต่อการบันทึกหนึ่งครั้ง
        const bytes = newFiles.reduce((sum, f) => sum + f.file.size, 0);
        if (bytes > MAX_UPLOAD_BYTES) {
          setCropError(
            `รูปใหม่รวมกัน ${(bytes / 1024 / 1024).toFixed(1)} MB เกินที่บันทึกได้ต่อครั้ง (4 MB) — ลบรูปใหม่บางรูปออก บันทึกก่อน แล้วค่อยเพิ่มที่เหลือ`,
          );
          return;
        }
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="grid gap-6 lg:grid-cols-[1fr_340px]"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {removed.map((id) => (
        <input key={id} type="hidden" name="removeImage" value={id} />
      ))}
      <input type="hidden" name="main" value={main} />
      <input ref={hiddenInput} type="file" name="newImages" multiple className="hidden" tabIndex={-1} aria-hidden />

      <div className="min-w-0 space-y-6">
        {state?.error && <Notice tone="error">{state.error}</Notice>}

        <section className="card space-y-4 p-4 sm:p-5">
          <h2 className="font-display font-semibold text-white">ข้อมูลสินค้า</h2>
          <div>
            <label htmlFor="name" className="label">ชื่อสินค้า *</label>
            <input id="name" name="name" required defaultValue={initial.name} className="input" placeholder="เช่น ลำโพง JBL Charge 4 สีดำ" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="price" className="label">ราคา (บาท) *</label>
              <input id="price" name="price" required inputMode="numeric" defaultValue={initial.price} className="input" placeholder="0" />
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
          </div>
          <div>
            <label htmlFor="condition" className="label">สภาพสินค้า (โดยย่อ)</label>
            <input id="condition" name="condition" defaultValue={initial.condition} className="input" placeholder="เช่น สภาพ 90% ใช้งานปกติทุกฟังก์ชัน" />
          </div>
          <div>
            <label htmlFor="defects" className="label">ตำหนิ</label>
            <textarea id="defects" name="defects" rows={2} defaultValue={initial.defects} className="input" placeholder="เช่น มีรอยขนแมวที่ฝาด้านบน (เว้นว่างถ้าไม่มี)" />
          </div>
          <div>
            <label htmlFor="description" className="label">รายละเอียด</label>
            <textarea id="description" name="description" rows={6} defaultValue={initial.description} className="input" placeholder="สเปก อุปกรณ์ที่ให้ไป การรับประกัน ฯลฯ" />
          </div>
        </section>

        <section className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-semibold text-white">รูปสินค้า</h2>
            <span className="text-xs text-muted">{total} รูป · แตะ ★ เพื่อเลือกรูปหลัก</span>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {visibleExisting.map((img) => (
              <ImageTile
                key={img.id}
                src={img.path}
                isMain={main === `e:${img.id}`}
                onMain={() => setMain(`e:${img.id}`)}
                onCrop={() => cropExisting(img)}
                onRemove={() => setRemoved((r) => [...r, img.id])}
              />
            ))}
            {newFiles.map((f, i) => (
              <ImageTile
                key={f.url}
                src={f.url}
                isNew
                isMain={main === `n:${i}`}
                onMain={() => setMain(`n:${i}`)}
                onCrop={() => enqueue([{ source: f.original, target: { kind: "new", url: f.url } }])}
                onRemove={() => removeNew(i)}
              />
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-accent">
              <Icon name="plus" className="h-6 w-6" />
              <span className="text-xs">เพิ่มรูป</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="sr-only"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {cropError && <p className="mt-3 text-xs text-danger">{cropError}</p>}
          <p className="mt-3 text-xs text-muted">
            รองรับ JPG, PNG, WEBP ไม่เกิน 8 MB ต่อรูป · เลือกรูปแล้วจะให้ครอบตัดเป็นสี่เหลี่ยมจัตุรัสตามกรอบที่แสดงหน้าร้าน กด
            <Icon name="crop" className="mx-1 inline h-3.5 w-3.5 align-[-2px] text-accent" />
            เพื่อครอบตัดใหม่
          </p>
          {queue[0] && (
            <ImageCropper
              key={done}
              file={queue[0].source}
              preset={CROP_PRODUCT}
              step={done + queue.length > 1 ? `${done + 1}/${done + queue.length}` : undefined}
              onDone={(file) => onCropped(queue[0], file)}
              onCancel={finishJob}
            />
          )}
        </section>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        <section className="card p-4 sm:p-5">
          <h2 className="font-display font-semibold text-white">สถานะ</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(["AVAILABLE", "SOLD"] as const).map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="radio" name="status" value={s} defaultChecked={initial.status === s} className="peer sr-only" />
                <span
                  className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-line text-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                    s === "AVAILABLE"
                      ? "peer-checked:border-ok peer-checked:bg-ok/10 peer-checked:text-ok"
                      : "peer-checked:border-sold peer-checked:bg-sold/10 peer-checked:text-white"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${s === "AVAILABLE" ? "bg-ok" : "bg-sold"}`} />
                  {s === "AVAILABLE" ? "ยังมีสินค้า" : "ขายแล้ว"}
                </span>
              </label>
            ))}
          </div>
        </section>

        <div className="fixed inset-x-0 bottom-[60px] z-30 border-t border-line bg-ink/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 lg:grid-cols-1">
            <button type="submit" disabled={pending} className="btn-primary order-2 lg:order-1">
              <Icon name="check" className="h-4 w-4" />
              {pending ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <Link href="/admin/products" className="btn-outline order-1 lg:order-2">
              ยกเลิก
            </Link>
          </div>
        </div>
      </aside>
      {/* เว้นที่ให้แถบปุ่มบันทึกด้านล่างบนมือถือ */}
      <div className="h-20 lg:hidden" aria-hidden />
    </form>
  );
}

function ImageTile({
  src,
  isMain,
  isNew,
  onMain,
  onCrop,
  onRemove,
}: {
  src: string;
  isMain: boolean;
  isNew?: boolean;
  onMain: () => void;
  onCrop: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${isMain ? "border-accent" : "border-line"}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {isMain && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-ink">รูปหลัก</span>}
      {isNew && !isMain && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] text-accent">ใหม่</span>}
      <div className="absolute right-1.5 top-1.5 flex gap-1">
        <button
          type="button"
          onClick={onMain}
          className={`grid h-8 w-8 place-items-center rounded-lg backdrop-blur ${isMain ? "bg-accent text-ink" : "bg-ink/80 text-white hover:text-accent"}`}
          aria-label="ตั้งเป็นรูปหลัก"
          aria-pressed={isMain}
        >
          <Icon name="star" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-lg bg-ink/80 text-white backdrop-blur hover:text-danger"
          aria-label="ลบรูปนี้"
        >
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={onCrop}
        className="absolute bottom-1.5 right-1.5 grid h-8 w-8 place-items-center rounded-lg bg-ink/80 text-white backdrop-blur hover:text-accent"
        aria-label="ครอบตัดรูปนี้"
        title="ครอบตัดรูป"
      >
        <Icon name="crop" className="h-4 w-4" />
      </button>
    </div>
  );
}
