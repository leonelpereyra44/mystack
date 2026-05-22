import { redirect } from "next/navigation";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ subscription?: string }>;
}) {
  const params = await searchParams;
  const qs = params.subscription ? `?subscription=${params.subscription}` : "";
  redirect(`/dashboard/subscription${qs}`);
}
