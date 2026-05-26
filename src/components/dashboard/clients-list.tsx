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

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{total}</p>
                <p className="text-xs text-muted-foreground">Clientes únicos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">
                  {initialClients.filter((c) => c.totalAppointments >= 5).length}
                </p>
                <p className="text-xs text-muted-foreground">Clientes frecuentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(
                    initialClients.reduce((sum, c) => sum + c.totalSpent, 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Ingresos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + sort */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Ordenar:</span>
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
              <CardContent className="py-4 px-4 sm:px-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <AvatarInitial name={client.name} index={index} />

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-semibold truncate">{client.name}</span>
                      {isFrequent && (
                        <Badge
                          variant="secondary"
                          className="text-xs w-fit gap-1 bg-amber-100 text-amber-700 border-amber-200"
                        >
                          <Star className="h-3 w-3" />
                          Frecuente
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[180px] sm:max-w-none">
                          {client.email}
                        </span>
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

                  {/* Stats */}
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
