import { PasswordForm, SettingsForm } from "@/components/admin/SettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/settings";

export default async function Settings() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="ตั้งค่าร้าน" description="ชื่อร้าน คำอธิบาย รูปหน้าแรก ลิงก์ Facebook และโลโก้" />
      <div className="space-y-6">
        <SettingsForm initial={s} />
        <PasswordForm />
      </div>
    </>
  );
}
