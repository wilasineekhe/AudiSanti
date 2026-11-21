"use client";

import { useState } from "react";
import { Icon } from "./Icon";

export function ProductGallery({ images, name, sold }: { images: string[]; name: string; sold: boolean }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-2xl border border-line bg-card text-line">
        <Icon name="image" className="h-16 w-16" />
      </div>
    );
  }
  const go = (d: number) => setIdx((i) => (i + d + images.length) % images.length);
  return (
    <div className="min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-line bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[idx]}
          alt={`${name} รูปที่ ${idx + 1}`}
          className={`h-full w-full object-cover ${sold ? "opacity-60 grayscale" : ""}`}
        />
        {sold && (
          <div className="absolute inset-0 grid place-items-center">
            <span className="rotate-[-8deg] rounded-xl border-2 border-sold bg-ink/80 px-6 py-2 font-display text-2xl font-bold tracking-widest text-sold">
              ขายแล้ว
            </span>
          </div>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink/70 text-white backdrop-blur hover:border-accent"
              aria-label="รูปก่อนหน้า"
            >
              <Icon name="chevronLeft" className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink/70 text-white backdrop-blur hover:border-accent"
              aria-label="รูปถัดไป"
            >
              <Icon name="chevronRight" className="h-5 w-5" />
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs text-white">
              {idx + 1} / {images.length}
            </span>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`ดูรูปที่ ${i + 1}`}
              aria-current={i === idx}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition sm:h-20 sm:w-20 ${
                i === idx ? "border-accent" : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
