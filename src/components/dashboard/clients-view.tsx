"use client";

import { useState, useMemo } from "react";
import { Users, Search, Phone, Mail, Calendar, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface Client {
  email: string;
  name: string;
  phone: string | null;
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  lastAppointmentDate: string;
  lastService: string;
}

interface ClientsViewProps {
  clients: Client[];
}

export function ClientsView({ clients }: ClientsViewProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
    );
  }, [clients, search]);

  const recurring = clients.filter((c) => c.totalAppointments > 1).length;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Todos los clientes que hicieron reservas en tu negocio
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{clients.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes frecuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold">{recurring}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Nuevos este mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold">
                {
                  clients.filter((c) => {
                    const now = new Date();
                    const d = parseISO(c.lastAppointmentDate);
                    return (
                      d.getMonth() === now.getMonth() &&
                      d.getFullYear() === now.getFullYear()
                    );
                  }).length
                }
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Users className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {search ? "No se encontraron clientes con esa búsqueda" : "Todavía no tenés clientes"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contacto</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Último servicio</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Última visita</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Reservas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((client) => (
                  <tr key={client.email} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          {client.totalAppointments > 1 && (
                            <Badge variant="secondary" className="text-xs mt-0.5">
                              Frecuente
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5 text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </span>
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{client.lastService}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(parseISO(client.lastAppointmentDate), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium">{client.totalAppointments}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {filtered.map((client) => (
              <Card key={client.email}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{client.name}</p>
                        {client.totalAppointments > 1 && (
                          <Badge variant="secondary" className="text-xs">Frecuente</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      {client.phone && (
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{client.lastService}</span>
                        <span>·</span>
                        <span>{format(parseISO(client.lastAppointmentDate), "d MMM yyyy", { locale: es })}</span>
                        <span>·</span>
                        <span>{client.totalAppointments} reservas</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
