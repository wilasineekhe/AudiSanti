"use client";

import { useState } from "react";
import { Icon } from "./Icon";

/** ปุ่มติดต่อผู้ขาย: ถ้าสินค้าขายแล้วจะถามยืนยันก่อน และมีปุ่มคัดลอกชื่อสินค้า */
export function ContactSeller({ facebookUrl, productName, sold }: { facebookUrl: string; productName: string; sold: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);

  const open = () => window.open(facebookUrl, "_blank", "noopener,noreferrer");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(productName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* เบราว์เซอร์ไม่อนุญาต */
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => (sold ? setConfirming(true) : open())}
        className={`${sold ? "btn-outline" : "btn-primary"} min-h-[52px] w-full text-base`}
      >
        <Icon name="facebook" className="h-5 w-5" />
        สนใจสินค้านี้ ติดต่อผู้ขายทาง Facebook
      </button>
      <button type="button" onClick={copy} className="btn-ghost w-full border border-dashed border-line">
        <Icon name={copied ? "check" : "tag"} className={`h-4 w-4 ${copied ? "text-ok" : ""}`} />
        {copied ? "คัดลอกชื่อสินค้าแล้ว" : "คัดลอกชื่อสินค้าเพื่อส่งให้ผู้ขาย"}
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sold-title"
          onClick={() => setConfirming(false)}
        >
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-warn/15 text-warn">
              <Icon name="alert" className="h-6 w-6" />
            </span>
            <h2 id="sold-title" className="mt-4 font-display text-lg font-semibold text-white">
              สินค้านี้ขายแล้ว
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              “{productName}” ถูกขายไปแล้ว คุณยังสามารถทักผู้ขายเพื่อสอบถามสินค้าที่ใกล้เคียง หรือให้ผู้ขายแจ้งเมื่อมีของเข้าใหม่ได้
            </p>
            <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button type="button" className="btn-outline" onClick={() => setConfirming(false)}>
                ยกเลิก
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setConfirming(false);
                  open();
                }}
              >
                ยังต้องการติดต่อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
