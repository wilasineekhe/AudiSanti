import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader shopName={s.shopName} tagline={s.tagline} logo={s.logo} facebookUrl={s.facebookUrl} />
      <main className="flex-1">{children}</main>
      <SiteFooter shopName={s.shopName} tagline={s.tagline} facebookUrl={s.facebookUrl} />
    </div>
  );
}
