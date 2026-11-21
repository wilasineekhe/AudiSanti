import { cache } from "react";
import { prisma } from "./prisma";

export const getSettings = cache(async () => {
  const s = await prisma.setting.findUnique({ where: { id: 1 } });
  const fallbackFb = process.env.FACEBOOK_URL || "https://www.facebook.com/";
  return {
    shopName: s?.shopName || "Santi Audio",
    tagline: s?.tagline || "เครื่องเสียงและอุปกรณ์อิเล็กทรอนิกส์มือสอง",
    description: s?.description || "",
    facebookUrl: s?.facebookUrl || fallbackFb,
    logo: s?.logo || null,
    heroImage: s?.heroImage || null,
  };
});
