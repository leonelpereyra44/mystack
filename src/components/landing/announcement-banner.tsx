import { getSystemConfigs, CONFIG_KEYS } from "@/lib/system-config";

const colorClasses = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-orange-50 border-orange-200 text-orange-800",
  success: "bg-green-50 border-green-200 text-green-800",
} as const;

export async function AnnouncementBanner() {
  const configs = await getSystemConfigs([
    CONFIG_KEYS.SITE_ANNOUNCEMENT,
    CONFIG_KEYS.ANNOUNCEMENT_COLOR,
  ]);

  const text = configs[CONFIG_KEYS.SITE_ANNOUNCEMENT];
  const color = (configs[CONFIG_KEYS.ANNOUNCEMENT_COLOR] as keyof typeof colorClasses) ?? "info";

  if (!text) return null;

  return (
    <div className={`border-b px-4 py-2.5 text-sm font-medium text-center ${colorClasses[color] ?? colorClasses.info}`}>
      {text}
    </div>
  );
}
