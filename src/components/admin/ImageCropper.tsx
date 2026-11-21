"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../Icon";

export type CropPreset = { aspect: number; maxWidth: number; label: string };

/** กรอบตรงกับที่หน้าร้านแสดง: การ์ด/แกลเลอรีสินค้าเป็นสี่เหลี่ยมจัตุรัส ภาพปก Blog เป็น 16:9 */
export const CROP_PRODUCT: CropPreset = {
  aspect: 1,
  maxWidth: 1400,
  label: "กรอบสี่เหลี่ยมจัตุรัส ตรงกับการ์ดสินค้าและหน้ารายละเอียดสินค้าที่ลูกค้าเห็น",
};
export const CROP_COVER: CropPreset = {
  aspect: 16 / 9,
  maxWidth: 1920,
  label: "กรอบ 16:9 ตรงกับภาพปกในหน้า Blog และหน้าบทความ",
};
export const CROP_HERO: CropPreset = {
  aspect: 4 / 3,
  maxWidth: 1200,
  label: "กรอบ 4:3 ตรงกับรูปด้านขวาของส่วนหัวหน้าแรก (บนมือถือจะแสดงใต้ข้อความ)",
};
export const CROP_LOGO: CropPreset = { aspect: 1, maxWidth: 512, label: "โลโก้ร้าน (สี่เหลี่ยมจัตุรัส)" };

const MAX_ZOOM = 4;
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

type View = { zoom: number; cx: number; cy: number };
type Size = { w: number; h: number };

export function ImageCropper({
  file,
  preset,
  step,
  onDone,
  onCancel,
}: {
  file: File;
  preset: CropPreset;
  step?: string;
  onDone: (cropped: File) => void;
  onCancel: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<Size | null>(null);
  const [frame, setFrame] = useState<Size>({ w: 0, h: 0 });
  const [view, setView] = useState<View>({ zoom: 1, cx: 0, cy: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const urls = useRef<string[]>([]);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef<number | null>(null);
  const latest = useRef({ nat, frame, view });
  latest.current = { nat, frame, view };

  // โหลดไฟล์
  useEffect(() => {
    const url = URL.createObjectURL(file);
    urls.current.push(url);
    setSrc(url);
    setNat(null);
    setError(null);
  }, [file]);
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // วัดขนาดกรอบ
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setFrame({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ล็อกการเลื่อนหน้า + ปิดด้วย Esc
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const baseScale = (n: Size, f: Size) => Math.max(f.w / n.w, f.h / n.h);

  /** ตั้งค่ามุมมองใหม่ โดยบังคับให้รูปเต็มกรอบเสมอ */
  const apply = useCallback((next: View) => {
    const { nat: n, frame: f } = latest.current;
    if (!n || !f.w) return setView(next);
    const zoom = clamp(next.zoom, 1, MAX_ZOOM);
    const s = baseScale(n, f) * zoom;
    const hw = f.w / (2 * s);
    const hh = f.h / (2 * s);
    setView({ zoom, cx: clamp(next.cx, hw, n.w - hw), cy: clamp(next.cy, hh, n.h - hh) });
  }, []);

  /** ซูมโดยให้จุด (mx, my) ในกรอบอยู่ที่เดิม */
  const zoomAt = useCallback(
    (zoom: number, mx?: number, my?: number) => {
      const { nat: n, frame: f, view: v } = latest.current;
      if (!n || !f.w) return;
      const z = clamp(zoom, 1, MAX_ZOOM);
      const px = (mx ?? f.w / 2) - f.w / 2;
      const py = (my ?? f.h / 2) - f.h / 2;
      const s0 = baseScale(n, f) * v.zoom;
      const s1 = baseScale(n, f) * z;
      const ix = v.cx + px / s0;
      const iy = v.cy + py / s0;
      apply({ zoom: z, cx: ix - px / s1, cy: iy - py / s1 });
    },
    [apply],
  );

  // คงตำแหน่งให้ถูกต้องเมื่อขนาดกรอบเปลี่ยน
  useEffect(() => {
    apply(latest.current.view);
  }, [frame, apply]);

  // ล้อเมาส์ (ต้องเป็น non-passive เพื่อกันหน้าเลื่อน)
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(latest.current.view.zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const n = { w: img.naturalWidth, h: img.naturalHeight };
    setNat(n);
    latest.current.nat = n;
    apply({ zoom: 1, cx: n.w / 2, cy: n.h / 2 });
  };

  const relPoint = (e: React.PointerEvent) => {
    const r = frameRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, relPoint(e));
    pinchDist.current = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const map = pointers.current;
    const prev = map.get(e.pointerId);
    if (!prev) return;
    const cur = relPoint(e);
    map.set(e.pointerId, cur);
    const { nat: n, frame: f, view: v } = latest.current;
    if (!n || !f.w) return;

    if (map.size === 1) {
      const s = baseScale(n, f) * v.zoom;
      apply({ zoom: v.zoom, cx: v.cx - (cur.x - prev.x) / s, cy: v.cy - (cur.y - prev.y) / s });
    } else if (map.size === 2) {
      const [a, b] = Array.from(map.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current) zoomAt(v.zoom * (dist / pinchDist.current), (a.x + b.x) / 2, (a.y + b.y) / 2);
      pinchDist.current = dist;
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    pinchDist.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const { nat: n, frame: f, view: v } = latest.current;
    if (!n || !f.w) return;
    const s = baseScale(n, f) * v.zoom;
    const d = (e.shiftKey ? 40 : 10) / s;
    const moves: Record<string, [number, number]> = { ArrowLeft: [d, 0], ArrowRight: [-d, 0], ArrowUp: [0, d], ArrowDown: [0, -d] };
    if (moves[e.key]) {
      e.preventDefault();
      apply({ zoom: v.zoom, cx: v.cx + moves[e.key][0], cy: v.cy + moves[e.key][1] });
    } else if (e.key === "+" || e.key === "=") zoomAt(v.zoom * 1.1);
    else if (e.key === "-") zoomAt(v.zoom / 1.1);
  };

  const toBlob = (canvas: HTMLCanvasElement, type: string, q: number) =>
    new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("toBlob failed"))), type, q));

  const rotate = async () => {
    const img = imgRef.current;
    if (!img || !nat) return;
    setBusy(true);
    try {
      const c = document.createElement("canvas");
      c.width = nat.h;
      c.height = nat.w;
      const ctx = c.getContext("2d")!;
      ctx.translate(c.width / 2, c.height / 2);
      ctx.rotate(Math.PI / 2);
      ctx.drawImage(img, -nat.w / 2, -nat.h / 2);
      const url = URL.createObjectURL(await toBlob(c, "image/png", 1));
      urls.current.push(url);
      setSrc(url);
    } catch {
      setError("หมุนรูปไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    const img = imgRef.current;
    if (!img || !nat || !frame.w) return;
    setBusy(true);
    try {
      const s = baseScale(nat, frame) * view.zoom;
      const sw = frame.w / s;
      const sh = frame.h / s;
      const outW = Math.max(1, Math.round(Math.min(preset.maxWidth, sw)));
      const outH = Math.max(1, Math.round(outW / preset.aspect));
      const c = document.createElement("canvas");
      c.width = outW;
      c.height = outH;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#FFFFFF"; // พื้นหลังสำหรับรูปโปร่งใส
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, view.cx - sw / 2, view.cy - sh / 2, sw, sh, 0, 0, outW, outH);
      const blob = await toBlob(c, "image/jpeg", 0.85);
      const name = (file.name.replace(/\.[^.]+$/, "") || "image") + ".jpg";
      onDone(new File([blob], name, { type: "image/jpeg" }));
    } catch {
      setError("ครอบตัดรูปไม่สำเร็จ ลองเลือกรูปใหม่อีกครั้ง");
      setBusy(false);
    }
  };

  const s = nat && frame.w ? baseScale(nat, frame) * view.zoom : 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-title"
    >
      <div className="flex max-h-[100dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-2xl border border-line bg-card shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon name="crop" className="h-5 w-5 shrink-0 text-accent" />
            <h2 id="crop-title" className="font-display font-semibold text-white">ครอบตัดรูป</h2>
            {step && <span className="rounded-md bg-raised px-1.5 py-0.5 text-xs text-muted">{step}</span>}
          </div>
          <button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:text-white" aria-label="ปิด">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <p className="text-xs text-muted">{preset.label}</p>

          <div
            ref={frameRef}
            tabIndex={0}
            role="application"
            aria-label="พื้นที่ครอบตัด ลากเพื่อเลื่อนรูป ใช้ปุ่มลูกศรเลื่อน และ + / - เพื่อซูม"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            className="relative mx-auto cursor-grab touch-none select-none overflow-hidden rounded-xl bg-ink outline-none ring-accent focus-visible:ring-2 active:cursor-grabbing"
            style={{ aspectRatio: preset.aspect, width: `min(100%, ${Math.round(55 * preset.aspect)}vh)` }}
          >
            {src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={src}
                alt=""
                draggable={false}
                onLoad={onLoad}
                onError={() => setError("เปิดไฟล์รูปนี้ไม่ได้")}
                className="pointer-events-none absolute left-0 top-0 max-w-none"
                style={
                  nat && s
                    ? {
                        width: nat.w * s,
                        height: nat.h * s,
                        transform: `translate(${frame.w / 2 - view.cx * s}px, ${frame.h / 2 - view.cy * s}px)`,
                      }
                    : { opacity: 0 }
                }
              />
            )}
            {/* เส้นแบ่ง 3 ส่วนช่วยจัดองค์ประกอบ */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="border-[0.5px] border-white/15" />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-accent/60" />
            {!nat && !error && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted">กำลังโหลดรูป...</div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => zoomAt(view.zoom / 1.2)} className="btn-ghost btn-sm h-10 w-10 shrink-0 p-0" aria-label="ซูมออก">
              <Icon name="minus" className="h-4 w-4" />
            </button>
            <input
              type="range"
              min={1}
              max={MAX_ZOOM}
              step={0.01}
              value={view.zoom}
              onChange={(e) => zoomAt(Number(e.target.value))}
              className="h-2 min-w-0 flex-1 cursor-pointer accent-accent"
              aria-label="ระดับการซูม"
            />
            <button type="button" onClick={() => zoomAt(view.zoom * 1.2)} className="btn-ghost btn-sm h-10 w-10 shrink-0 p-0" aria-label="ซูมเข้า">
              <Icon name="plus" className="h-4 w-4" />
            </button>
            <button type="button" onClick={rotate} disabled={busy || !nat} className="btn-outline btn-sm h-10 shrink-0" aria-label="หมุนรูป 90 องศา">
              <Icon name="rotate" className="h-4 w-4" />
              <span className="hidden sm:inline">หมุน</span>
            </button>
          </div>
          <p className="text-center text-xs text-muted">ลากรูปเพื่อจัดตำแหน่ง · ใช้ล้อเมาส์ แถบซูม หรือถ่างนิ้วเพื่อซูม</p>
          {error && <p className="text-center text-sm text-danger">{error}</p>}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-line p-4 sm:flex sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-ghost">
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => nat && apply({ zoom: 1, cx: nat.w / 2, cy: nat.h / 2 })}
            disabled={!nat}
            className="btn-outline"
          >
            รีเซ็ต
          </button>
          <button type="button" onClick={confirm} disabled={busy || !nat} className="btn-primary">
            <Icon name="check" className="hidden h-4 w-4 sm:block" />
            {busy ? "..." : "ใช้รูปนี้"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** ใส่ไฟล์ลงใน <input type="file"> เพื่อส่งไปกับฟอร์ม */
export function setInputFile(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  const dt = new DataTransfer();
  if (file) dt.items.add(file);
  input.files = dt.files;
}

/** โหลดรูปที่อยู่บนเว็บแล้ว (เช่น /uploads/...) กลับมาเป็นไฟล์เพื่อครอบตัดใหม่ */
export async function urlToFile(url: string): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("load failed");
  const blob = await res.blob();
  const name = url.split("/").pop()?.split("?")[0] || "image";
  return new File([blob], name, { type: blob.type || "image/jpeg" });
}
