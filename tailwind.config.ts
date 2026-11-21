import type { Config } from "tailwindcss";

/** สีทั้งหมดอ่านจากตัวแปร CSS ใน src/app/globals.css (มีทั้งธีมสว่างและธีมมืด) */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: v("strong"), // สีตัวอักษรเด่น (หัวข้อ) — ธีมสว่างเป็นสีเข้ม
        pure: "#FFFFFF", // ขาวจริง สำหรับตัวอักษรบนปุ่มสีแดง
        deep: v("deep"),
        ink: v("ink"),
        card: v("card"),
        raised: v("raised"),
        line: v("line"),
        fg: { DEFAULT: v("fg"), 2: v("fg-2"), 3: v("fg-3") },
        faint: v("faint"),
        muted: v("muted"),
        accent: { DEFAULT: v("accent"), hover: v("accent-hover"), dim: v("accent-dim") },
        ok: { DEFAULT: v("ok"), fg: v("ok-fg"), deep: v("ok-deep") },
        sold: { DEFAULT: v("sold"), deep: v("sold-deep") },
        warn: { DEFAULT: v("warn"), fg: v("warn-fg") },
        danger: v("danger"),
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgb(var(--accent) / 0.3), 0 8px 30px -12px rgb(var(--accent) / 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
