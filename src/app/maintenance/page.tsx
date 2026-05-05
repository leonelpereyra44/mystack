import { getSystemConfigs, CONFIG_KEYS } from "@/lib/system-config";

export default async function MaintenancePage() {
  const configs = await getSystemConfigs([CONFIG_KEYS.MAINTENANCE_MESSAGE]);
  const message =
    configs[CONFIG_KEYS.MAINTENANCE_MESSAGE] ||
    "Estamos realizando mantenimiento. Volvemos pronto.";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)] flex items-center justify-center shadow-xl shadow-[oklch(0.65_0.14_175)]/30">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
                />
              </svg>
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-full bg-[oklch(0.65_0.14_175)]/20 animate-ping" />
          </div>
        </div>

        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="text-2xl font-bold">
            <span className="text-slate-800">my</span>
            <span className="text-[oklch(0.55_0.15_230)]">stack</span>
          </span>
        </div>

        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          En mantenimiento
        </h1>
        <p className="text-lg text-slate-600 mb-8 leading-relaxed">{message}</p>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.14_175)] animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.14_175)] animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-[oklch(0.65_0.14_175)] animate-bounce [animation-delay:300ms]" />
          </div>
          <span>Trabajando en mejoras</span>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          Si eres administrador,{" "}
          <a
            href="/admin"
            className="underline hover:text-slate-600 transition-colors"
          >
            accede al panel
          </a>
          .
        </p>
      </div>
    </div>
  );
}
