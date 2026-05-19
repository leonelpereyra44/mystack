"use client";

import { useState } from "react";
import { Loader2, AlertTriangle, Trash2, Info } from "lucide-react";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { ChangePasswordForm } from "./change-password-form";
import { SubscriptionCard } from "./subscription-card";

interface Business {
  id: string;
  name: string;
}

interface AccountFormProps {
  business: Business;
}

export function AccountForm({ business }: AccountFormProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleOpenDeleteDialog = () => {
    setShowDeleteDialog(true);
    setDeleteStep(1);
    setDeleteConfirmation("");
    setDeletePassword("");
    setDeleteError("");
  };

  const handleCloseDeleteDialog = () => {
    setShowDeleteDialog(false);
    setDeleteStep(1);
    setDeleteConfirmation("");
    setDeletePassword("");
    setDeleteError("");
  };

  const handleDeleteBusiness = async () => {
    if (deleteConfirmation !== "ELIMINAR MI NEGOCIO") {
      setDeleteError("Debes escribir exactamente: ELIMINAR MI NEGOCIO");
      return;
    }

    if (!deletePassword) {
      setDeleteError("Debes ingresar tu contraseña");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/business", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: deletePassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Tu negocio y cuenta han sido eliminados");
        await signOut({ callbackUrl: "/" });
      } else {
        setDeleteError(data.error || "Error al eliminar el negocio");
      }
    } catch (error) {
      console.error("Error deleting business:", error);
      setDeleteError("Error de conexión. Intenta nuevamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cambiar Contraseña */}
      <ChangePasswordForm />

      {/* Suscripción */}
      <SubscriptionCard />

      {/* Zona de Peligro */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
          <CardDescription>
            Acciones irreversibles que afectan permanentemente tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Advertencia</AlertTitle>
            <AlertDescription>
              Eliminar tu negocio borrará permanentemente todos tus datos: servicios,
              staff, horarios, citas pasadas y futuras, y tu cuenta de usuario. Esta
              acción no se puede deshacer.
            </AlertDescription>
          </Alert>
          <Button
            variant="destructive"
            onClick={handleOpenDeleteDialog}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar mi negocio
          </Button>
        </CardContent>
      </Card>

      {/* Delete Business Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Eliminar negocio
            </DialogTitle>
            <DialogDescription>
              {deleteStep === 1
                ? "¿Estás seguro de que deseas eliminar tu negocio?"
                : "Confirma tu identidad para continuar"}
            </DialogDescription>
          </DialogHeader>

          {deleteStep === 1 && (
            <div className="space-y-4 py-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Esta acción es irreversible</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Al eliminar tu negocio se borrarán permanentemente:</p>
                  <ul className="list-disc pl-4 space-y-1 text-sm">
                    <li>
                      Tu negocio <strong>&quot;{business.name}&quot;</strong>
                    </li>
                    <li>Todos los servicios y precios configurados</li>
                    <li>Todo el staff y sus horarios</li>
                    <li>Todas las citas (pasadas y futuras)</li>
                    <li>Los horarios de atención</li>
                    <li>Tu suscripción activa</li>
                    <li>Tu cuenta de usuario</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <Info className="h-5 w-5 text-yellow-600 shrink-0" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Los clientes que tengan citas programadas no serán notificados
                  automáticamente.
                </p>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleCloseDeleteDialog}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => setDeleteStep(2)}>
                  Entiendo, continuar
                </Button>
              </DialogFooter>
            </div>
          )}

          {deleteStep === 2 && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Escribe{" "}
                  <strong className="text-destructive">ELIMINAR MI NEGOCIO</strong> para
                  confirmar
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="ELIMINAR MI NEGOCIO"
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-password">Ingresa tu contraseña</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>

              {deleteError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{deleteError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setDeleteStep(1)}
                  disabled={isDeleting}
                >
                  Volver
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteBusiness}
                  disabled={
                    isDeleting ||
                    deleteConfirmation !== "ELIMINAR MI NEGOCIO" ||
                    !deletePassword
                  }
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar permanentemente
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
