"use client";

import { useRef, useState } from "react";
import { changePassword, saveSettings } from "@/app/admin/actions";
import { Icon } from "../Icon";
import { CROP_HERO, CROP_LOGO, ImageCropper, setInputFile, urlToFile } from "./ImageCropper";
import { Notice } from "./ui";
import { useFormAction } from "./useFormAction";

export function SettingsForm({
  initial,
}: {
  initial: {
    shopName: string;
    tagline: string;
    description: string;
    facebookUrl: string;
    logo: string | null;
    heroImage: string | null;
  };
}) {
  const { state, pending, onSubmit } = useFormAction(saveSettings);
  const [logo, setLogo] = useState(initial.logo);
  const [remove, setRemove] = useState(false);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const recrop = async () => {
    try {
      setCropSource(original ?? (logo ? await urlToFile(logo) : null));
    } catch {
      /* โหลดโลโก้เดิมไม่ได้ ให้เลือกไฟล์ใหม่แทน */
    }
  };

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-white">ข้อมูลร้าน</h2>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && <Notice>{state.ok}</Notice>}
      <input type="hidden" name="removeLogo" value={remove ? "1" : ""} />

      <div className="flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-raised text-accent">
          {logo && !remove ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="h-full w-full object-cover" />
          ) : (
            <Icon name="wave" className="h-7 w-7" />
          )}
        </span>
        <div className="flex flex-wrap gap-2">
          <label className="btn-outline btn-sm cursor-pointer">
            <Icon name="image" className="h-4 w-4" /> เปลี่ยนโลโก้
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCropSource(f);
                e.target.value = "";
              }}
            />
          </label>
          {logo && !remove && (
            <>
              <button type="button" className="btn-ghost btn-sm" onClick={recrop}>
                <Icon name="crop" className="h-4 w-4" /> ครอบตัด
              </button>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setRemove(true)}>
                ใช้โลโก้เริ่มต้น
              </button>
            </>
          )}
        </div>
        <input ref={logoInput} type="file" name="logo" className="hidden" tabIndex={-1} aria-hidden />
        {cropSource && (
          <ImageCropper
            file={cropSource}
            preset={CROP_LOGO}
            onCancel={() => setCropSource(null)}
            onDone={(file) => {
              setInputFile(logoInput.current, file);
              setOriginal(cropSource);
              setLogo(URL.createObjectURL(file));
              setRemove(false);
              setCropSource(null);
            }}
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="shopName" className="label">ชื่อร้าน</label>
          <input id="shopName" name="shopName" defaultValue={initial.shopName} className="input" />
        </div>
        <div>
          <label htmlFor="tagline" className="label">คำอธิบายสั้น (ใต้ชื่อร้าน)</label>
          <input id="tagline" name="tagline" defaultValue={initial.tagline} className="input" />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="label">คำอธิบายร้าน</label>
        <textarea id="description" name="description" rows={3} defaultValue={initial.description} className="input" />
      </div>
      <HeroImageField initial={initial.heroImage} />
      <div>
        <label htmlFor="facebookUrl" className="label">ลิงก์ Facebook ของร้าน</label>
        <input
          id="facebookUrl"
          name="facebookUrl"
          type="url"
          defaultValue={initial.facebookUrl}
          placeholder="https://www.facebook.com/ชื่อเพจ หรือ https://m.me/ชื่อเพจ"
          className="input"
        />
        <p className="mt-1.5 text-xs text-muted">ปุ่ม “ติดต่อ Facebook” ทุกปุ่มในเว็บจะพาไปที่ลิงก์นี้ ใช้ลิงก์ m.me เพื่อเปิดแชท Messenger ได้ทันที</p>
      </div>
      <button disabled={pending} className="btn-primary w-full sm:w-auto">
        <Icon name="check" className="h-4 w-4" />
        {pending ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
      </button>
    </form>
  );
}

/** รูปด้านขวาของส่วนหัวหน้าแรก ครอบตัดเป็น 4:3 */
function HeroImageField({ initial }: { initial: string | null }) {
  const [image, setImage] = useState(initial);
  const [remove, setRemove] = useState(false);
  const [cropSource, setCropSource] = useState<File | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const shown = image && !remove;

  const recrop = async () => {
    setError(null);
    try {
      setCropSource(original ?? (image ? await urlToFile(image) : null));
    } catch {
      setError("โหลดรูปเดิมมาครอบตัดไม่ได้ ลองเลือกรูปใหม่แทน");
    }
  };

  return (
    <div>
      <span className="label">รูปหน้าแรก</span>
      <input type="hidden" name="removeHero" value={remove ? "1" : ""} />
      <input ref={input} type="file" name="heroImage" className="hidden" tabIndex={-1} aria-hidden />
      <div className="grid gap-3 sm:grid-cols-[240px_1fr] sm:items-center">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-line bg-raised">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-muted">
              <Icon name="image" className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-xs leading-relaxed text-muted">
            แสดงด้านขวาของชื่อร้านในหน้าแรก (มือถือแสดงใต้ข้อความ) แนะนำรูปขนาด 1200 × 900 px หรือใหญ่กว่า เลือกรูปแล้วจะให้ครอบตัดเป็น 4:3
            {!shown && " · ถ้าไม่ใส่รูป หน้าแรกจะแสดงแค่ข้อความเหมือนเดิม"}
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="btn-outline btn-sm cursor-pointer">
              <Icon name="image" className="h-4 w-4" /> {shown ? "เปลี่ยนรูป" : "เลือกรูป"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setCropSource(f);
                  e.target.value = "";
                }}
              />
            </label>
            {shown && (
              <>
                <button type="button" className="btn-ghost btn-sm" onClick={recrop}>
                  <Icon name="crop" className="h-4 w-4" /> ครอบตัด
                </button>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    setRemove(true);
                    setInputFile(input.current, null);
                  }}
                >
                  ลบรูป
                </button>
              </>
            )}
          </div>
          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      </div>
      {cropSource && (
        <ImageCropper
          file={cropSource}
          preset={CROP_HERO}
          onCancel={() => setCropSource(null)}
          onDone={(file) => {
            setInputFile(input.current, file);
            setOriginal(cropSource);
            setImage(URL.createObjectURL(file));
            setRemove(false);
            setCropSource(null);
          }}
        />
      )}
    </div>
  );
}

export function PasswordForm() {
  const { state, pending, onSubmit } = useFormAction(changePassword);
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4 sm:p-6">
      <h2 className="font-display text-lg font-semibold text-white">เปลี่ยนรหัสผ่าน</h2>
      {state?.error && <Notice tone="error">{state.error}</Notice>}
      {state?.ok && <Notice>{state.ok}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="current" className="label">รหัสผ่านปัจจุบัน</label>
          <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
        </div>
        <div>
          <label htmlFor="next" className="label">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</label>
          <input id="next" name="next" type="password" autoComplete="new-password" minLength={8} required className="input" />
        </div>
      </div>
      <button disabled={pending} className="btn-outline w-full sm:w-auto">
        {pending ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
      </button>
    </form>
  );
}
