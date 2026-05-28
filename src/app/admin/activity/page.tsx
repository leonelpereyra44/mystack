"use client";

import { useEffect, useState, useCallback } from "react";
import {
  UserPlus,
  Building2,
  Calendar,
  CreditCard,
  XCircle,
  Loader2,
  Activity,
  RefreshCw,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type EventType =
  | "user_registered"
  | "business_created"
  | "appointment_created"
  | "subscription_created"
  | "subscription_cancelled";

interface ActivityEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  timestamp: string;
  meta?: Record<string, string>;
}

interface Summary {
  todayTotal: number;
  todayUsers: number;
  todayBusinesses: number;
  todayAppointments: number;
  todaySubscriptions: number;
}

const EVENT_CONFIG: Record<
  EventType,
  { icon: React.ElementType; color: string; bg: string }
> = {
  user_registered:      { icon: UserPlus,   color: "text-blue-600",    bg: "bg-blue-100" },
  business_created:     { icon: Building2,  color: "text-emerald-600", bg: "bg-emerald-100" },
  appointment_created:  { icon: Calendar,   color: "text-violet-600",  bg: "bg-violet-100" },
  subscription_created: { icon: CreditCard, color: "text-orange-600",  bg: "bg-orange-100" },
  subscription_cancelled: { icon: XCircle,  color: "text-red-600",     bg: "bg-red-100" },
};

const APPOINTMENT_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: "Pendiente",    cls: "bg-yellow-100 text-yellow-700" },
  CONFIRMED:   { label: "Confirmada",   cls: "bg-blue-100 text-blue-700" },
  CANCELLED:   { label: "Cancelada",    cls: "bg-red-100 text-red-700" },
  COMPLETED:   { label: "Completada",   cls: "bg-green-100 text-green-700" },
  NO_SHOW:     { label: "No asistió",   cls: "bg-orange-100 text-orange-700" },
  RESCHEDULED: { label: "Reprogramada", cls: "bg-purple-100 text-purple-700" },
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free", BASIC: "Básico", PRO: "Pro", PREMIUM: "Premium", ENTERPRISE: "Enterprise",
};

const FILTER_OPTIONS = [
  { value: "all",           label: "Todo" },
  { value: "users",         label: "Usuarios" },
  { value: "businesses",    label: "Negocios" },
  { value: "appointments",  label: "Reservas" },
  { value: "subscriptions", label: "Suscripciones" },
];

const PERIOD_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "week",  label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "all",   label: "Todo" },
];

const PAGE_SIZE = 20;

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (m < 1)  return "justo ahora";
  if (m < 60) return `hace ${m} min`;
  if (h < 24) return `hace ${h}h`;
  if (d < 30) return `hace ${d}d`;
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function absoluteTime(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Skeleton row ────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 py-3 px-1">
      <div className="relative z-10 h-9 w-9 shrink-0 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-3.5 w-40 rounded bg-muted animate-pulse" />
        <div className="h-3 w-64 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-3 w-14 rounded bg-muted animate-pulse mt-1" />
    </div>
  );
}

// ── Stats card ───────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  value,
  label,
  loading,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
  loading: boolean;
}) {
  return (
    <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <div>
        {loading ? (
          <div className="h-6 w-8 rounded bg-muted animate-pulse mb-1" />
        ) : (
          <p className="text-2xl font-bold leading-none">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AdminActivityPage() {
  const [events, setEvents]     = useState<ActivityEvent[]>([]);
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing]   = useState(false);
  const [hasMore, setHasMore]   = useState(false);
  const [filter, setFilter]     = useState("all");
  const [period, setPeriod]     = useState("all");
  const [limit, setLimit]       = useState(PAGE_SIZE);

  const fetchActivity = useCallback(
    async (opts: { refresh?: boolean; loadMore?: boolean; newLimit?: number } = {}) => {
      const { refresh = false, loadMore = false, newLimit } = opts;
      const effectiveLimit = newLimit ?? limit;

      if (refresh)   setRefreshing(true);
      else if (loadMore) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetch(
          `/api/admin/activity?filter=${filter}&period=${period}&limit=${effectiveLimit}`
        );
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events ?? []);
          setHasMore(data.hasMore ?? false);
          // Keep summary from first successful load (always "today")
          if (data.summary) setSummary(data.summary);
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [filter, period, limit]
  );

  // Re-fetch when filter or period changes (reset limit)
  useEffect(() => {
    setLimit(PAGE_SIZE);
    setEvents([]);
    setLoading(true);

    const effectiveLimit = PAGE_SIZE;
    fetch(`/api/admin/activity?filter=${filter}&period=${period}&limit=${effectiveLimit}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(data.events ?? []);
        setHasMore(data.hasMore ?? false);
        if (data.summary) setSummary(data.summary);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, period]);

  function handleLoadMore() {
    const newLimit = limit + PAGE_SIZE;
    setLimit(newLimit);
    fetchActivity({ loadMore: true, newLimit });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Actividad
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Eventos recientes del sistema — registros, negocios, reservas y suscripciones.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchActivity({ refresh: true })}
          disabled={refreshing || loading}
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Stats cards — always "today" */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Activity}  iconColor="text-primary"      iconBg="bg-primary/10"    value={summary?.todayTotal ?? 0}         label="eventos hoy"       loading={!summary} />
        <StatCard icon={Users}     iconColor="text-blue-600"     iconBg="bg-blue-100"      value={summary?.todayUsers ?? 0}         label="usuarios hoy"      loading={!summary} />
        <StatCard icon={Calendar}  iconColor="text-violet-600"   iconBg="bg-violet-100"    value={summary?.todayAppointments ?? 0}  label="reservas hoy"      loading={!summary} />
        <StatCard icon={CreditCard} iconColor="text-orange-600"  iconBg="bg-orange-100"   value={summary?.todaySubscriptions ?? 0} label="suscripciones hoy" loading={!summary} />
      </div>

      {/* Toolbar: period + filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        {/* Period */}
        <div className="flex gap-1 bg-muted/50 rounded-lg p-1 w-fit">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                period === opt.value
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border",
                filter === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
          {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-xl bg-card">
          <Activity className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium">Sin eventos para este período</p>
          <p className="text-sm mt-1">Probá cambiando el filtro o el rango de fechas.</p>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-0.5">
              {events.map((event, idx) => {
                const cfg = EVENT_CONFIG[event.type];
                const Icon = cfg.icon;
                const showSep =
                  idx === 0 ||
                  new Date(event.timestamp).toDateString() !==
                    new Date(events[idx - 1].timestamp).toDateString();

                return (
                  <div key={event.id}>
                    {showSep && (
                      <div className="flex items-center gap-3 py-3 pl-14">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                          {new Date(event.timestamp).toLocaleDateString("es-AR", {
                            weekday: "long", day: "numeric", month: "long", year: "numeric",
                          })}
                        </span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    )}

                    <div className="flex items-start gap-4 py-2.5 px-1 rounded-lg hover:bg-muted/40 transition-colors group">
                      {/* Icon dot */}
                      <div
                        className={cn(
                          "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-background",
                          cfg.bg
                        )}
                      >
                        <Icon className={cn("h-4 w-4", cfg.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">{event.title}</p>
                            <p className="text-sm text-muted-foreground mt-0.5 truncate">
                              {event.description}
                            </p>
                            {/* Meta badges */}
                            {event.meta && (
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {event.type === "appointment_created" && event.meta.status && (
                                  <span
                                    className={cn(
                                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                      APPOINTMENT_STATUS[event.meta.status]?.cls ?? "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {APPOINTMENT_STATUS[event.meta.status]?.label ?? event.meta.status}
                                  </span>
                                )}
                                {(event.type === "subscription_created" || event.type === "subscription_cancelled") &&
                                  event.meta.plan && (
                                    <Badge variant="outline" className="text-xs h-5">
                                      {PLAN_LABELS[event.meta.plan] ?? event.meta.plan}
                                    </Badge>
                                  )}
                                {event.type === "business_created" && event.meta.type && (
                                  <Badge variant="outline" className="text-xs h-5 capitalize">
                                    {event.meta.type}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <span
                            className="text-xs text-muted-foreground shrink-0 cursor-default"
                            title={absoluteTime(event.timestamp)}
                          >
                            {relativeTime(event.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="gap-2"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                {loadingMore ? "Cargando..." : `Cargar ${PAGE_SIZE} más`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
