import { redirect } from "next/navigation";

export default function LegacySoundCloudTokenExportPage() {
  redirect("/admin/dashboard/tokens");
}
