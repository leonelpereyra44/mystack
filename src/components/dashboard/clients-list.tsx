"use client";

import { useState, useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  Star,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ClientData {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  createdAt: string;
  totalAppointments: number;
  lastAppointmentDate: string | null;
  totalSpent: number;
}

type SortField = "lastAppointment" | "totalAppointments" | "totalSpent" | "name";
type SortDir = "asc" | "desc";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function AvatarInitial({ name, index }: { name: string; index: number }) {
  const colors = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
    "bg-cyan-100 text-cyan-700",
  ];
  const color = colors[index % colors.length];
  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${color}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SortButton({
  field,
  label,
  currentField,
  currentDir,
  onSort,
}: {
  field: SortField;
  label: string;
  currentField: SortField;
  currentDir: SortDir;
  onSort: (field: SortField) => void;
}) {
  const isActive = currentField === field;
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`h-8 gap-1 text-xs font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}
      onClick={() => onSort(field)}
    >
      {label}
      {isActive ? (
        currentDir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </Button>
  );
}

interface ClientsListProps {
  initialClients: ClientData[];
  total: number;
}

export function ClientsList({ initialClients, total }: ClientsListProps) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("lastAppointment");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return initialClients.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    );
  }, [initialClients, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: number | string = 0;
      let bVal: number | string = 0;

      switch (sortField) {
        case "lastAppointment":
          aVal = a.lastAppointmentDate ?? "";
          bVal = b.lastAppointmentDate ?? "";
          break;
        case "totalAppointments":
          aVal = a.totalAppointments;
          bVal = b.totalAppointments;
          break;
        case "totalSpent":
          aVal = a.totalSpent;
          bVal = b.totalSpent;
          break;
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir]);

  const totalRevenue = initialClients.reduce((sum, c) => sum + c.totalSpent, 0);
  const frequentCount = initialClients.filter((c) => c.totalAppointments >= 5).length;

  return (
    <div className="space-y-4">
      {/* Stats row — mobile: horizontal scroll chips / desktop: grid cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-3 sm:gap-3 scrollbar-none">
        {[
          {
            icon: <Users className="h-4 w-4 text-muted-foreground" />,
            value: total,
            label: "Clientes",
          },
          {
            icon: <Star className="h-4 w-4 text-amber-500" />,
            value: frequentCount,
            label: "Frecuentes",
          },
          {
            icon: <TrendingUp className="h-4 w-4 text-emerald-500" />,
            value: formatCurrency(totalRevenue),
            label: "Ingresos",
          },
        ].map((stat) => (
          <Card key={stat.label} className="flex-shrink-0 min-w-[110px] sm:min-w-0">
            <CardContent className="pt-3 pb-3 px-3 sm:pt-4 sm:pb-4 sm:px-4">
              <div className="flex items-center gap-2">
                {stat.icon}
                <div>
                  <p className="text-lg sm:text-2xl font-bold leading-none">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Mobile: native select for sort */}
        <select
          className="sm:hidden h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring flex-shrink-0"
          value={`${sortField}-${sortDir}`}
          onChange={(e) => {
            const [field, dir] = e.target.value.split("-") as [SortField, SortDir];
            setSortField(field);
            setSortDir(dir);
          }}
        >
          <option value="lastAppointment-desc">Último turno ↓</option>
          <option value="lastAppointment-asc">Último turno ↑</option>
          <option value="totalAppointments-desc">Más turnos</option>
          <option value="totalSpent-desc">Mayor gasto</option>
          <option value="name-asc">Nombre A–Z</option>
        </select>

        {/* Desktop: sort buttons */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground mr-1">Ordenar:</span>
          <SortButton
            field="lastAppointment"
            label="Último turno"
            currentField={sortField}
            currentDir={sortDir}
            onSort={handleSort}
          />
          <SortButton
            field="totalAppointments"
            label="Turnos"
            currentField={sortField}
            currentDir={sortDir}
            onSort={handleSort}
          />
          <SortButton
            field="totalSpent"
            label="Gasto"
            currentField={sortField}
            currentDir={sortDir}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* Results count */}
      {search && (
        <p className="text-sm text-muted-foreground">
          {sorted.length} resultado{sorted.length !== 1 ? "s" : ""} para &quot;{search}&quot;
        </p>
      )}

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          {search ? (
            <>
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin resultados</p>
              <p className="text-sm">Probá con otro nombre, email o teléfono</p>
            </>
          ) : (
            <>
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Todavía no tenés clientes</p>
              <p className="text-sm">Los clientes aparecerán aquí cuando hagan su primera reserva</p>
            </>
          )}
        </div>
      )}

      {/* Client list */}
      <div className="space-y-2">
        {sorted.map((client, index) => {
          const isFrequent = client.totalAppointments >= 5;
          return (
            <Card key={client.id} className="transition-shadow hover:shadow-sm">
              <CardContent className="py-3 px-4 sm:py-4 sm:px-6">

                {/* ── Mobile layout ── */}
                <div className="sm:hidden">
                  {/* Row 1: avatar + name + badge */}
                  <div className="flex items-center gap-3">
                    <AvatarInitial name={client.name} index={index} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{client.name}</span>
                        {isFrequent && (
                          <Badge
                            variant="secondary"
                            className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200 flex-shrink-0"
                          >
                            <Star className="h-3 w-3" />
                            Frecuente
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Row 2: contact info as tappable links */}
                  <div className="mt-2 ml-[52px] space-y-1">
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground active:text-primary"
                    >
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </a>
                    {client.phone && (
                      <a
                        href={`tel:${client.phone}`}
                        className="flex items-center gap-1.5 text-sm text-muted-foreground active:text-primary"
                      >
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </a>
                    )}
                  </div>

                  {/* Row 3: stats strip */}
                  <div className="mt-3 ml-[52px] flex items-center gap-3 text-xs text-muted-foreground">
                    {client.lastAppointmentDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        {formatDistanceToNow(new Date(client.lastAppointmentDate), {
                          locale: es,
                          addSuffix: true,
                        })}
                      </span>
                    )}
                    <span className="font-medium text-foreground">
                      {client.totalAppointments}{" "}
                      {client.totalAppointments === 1 ? "turno" : "turnos"}
                    </span>
                    {client.totalSpent > 0 && (
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(client.totalSpent)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Desktop layout (unchanged) ── */}
                <div className="hidden sm:flex items-start gap-4">
                  <AvatarInitial name={client.name} index={index} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{client.name}</span>
                      {isFrequent && (
                        <Badge
                          variant="secondary"
                          className="text-xs gap-1 bg-amber-100 text-amber-700 border-amber-200"
                        >
                          <Star className="h-3 w-3" />
                          Frecuente
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        {client.email}
                      </span>
                      {client.phone && (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 flex-shrink-0" />
                          {client.phone}
                        </span>
                      )}
                    </div>

                    {client.lastAppointmentDate && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        Último turno:{" "}
                        {format(new Date(client.lastAppointmentDate), "d 'de' MMMM yyyy", {
                          locale: es,
                        })}{" "}
                        (
                        {formatDistanceToNow(new Date(client.lastAppointmentDate), {
                          locale: es,
                          addSuffix: true,
                        })}
                        )
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0 text-right">
                    <div>
                      <p className="text-base font-bold leading-none">
                        {client.totalAppointments}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {client.totalAppointments === 1 ? "turno" : "turnos"}
                      </p>
                    </div>
                    {client.totalSpent > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-emerald-600 leading-none">
                          {formatCurrency(client.totalSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">gastado</p>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
