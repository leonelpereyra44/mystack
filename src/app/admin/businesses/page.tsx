"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  Building2, 
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Users,
  Calendar,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Business {
  id: string;
  name: string;
  slug: string;
  businessType: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  subscription: {
    plan: string;
    status: string;
  } | null;
  _count: {
    appointments: number;
    staff: number;
    services: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });
      if (search) params.set("search", search);
      if (planFilter) params.set("plan", planFilter);

      const response = await fetch(`/api/admin/businesses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, planFilter]);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchBusinesses();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Negocios</h1>
          <p className="text-muted-foreground">
            {pagination?.total || 0} negocios registrados
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={planFilter} onValueChange={(value) => {
              setPlanFilter(value === "ALL" ? "" : value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                <SelectItem value="PRO">PRO</SelectItem>
                <SelectItem value="FREE">FREE</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      {/* Businesses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : businesses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mb-4" />
              <p>No se encontraron negocios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Dueño</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Registro</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{business.name}</p>
                        <p className="text-sm text-muted-foreground">
                          /{business.slug}
                        </p>
                        {business.businessType && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {business.businessType}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{business.owner.name || "Sin nombre"}</p>
                        <p className="text-xs text-muted-foreground">
                          {business.owner.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          business.subscription?.plan === "PRO"
                            ? "bg-gradient-to-r from-[oklch(0.65_0.14_175)] to-[oklch(0.62_0.18_250)]"
                            : ""
                        }
                        variant={business.subscription?.plan === "PRO" ? "default" : "secondary"}
                      >
                        {business.subscription?.plan || "FREE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {business._count.appointments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {business._count.staff}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {business._count.services}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(business.createdAt).toLocaleDateString("es-AR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link 
                        href={`/${business.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Ver página
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage >= pagination.totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
