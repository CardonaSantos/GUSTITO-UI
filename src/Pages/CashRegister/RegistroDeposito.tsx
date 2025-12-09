"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

import { useStore } from "@/components/Context/ContextSucursal";
import {
  DepositoCreatePayload,
  EgresoCreatePayload,
  useCreateDeposito,
  useCreateEgreso,
} from "./hooks";

// ================================
// Component
// ================================
export default function RegistroDeposito() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const usuarioId = useStore((state) => state.userId) ?? 0;

  // ================================
  // Estado Depósito
  // ================================
  const [formDataDeposito, setFormDataDeposito] =
    useState<DepositoCreatePayload>({
      monto: 0,
      numeroBoleta: "",
      banco: "",
      usadoParaCierre: false,
      sucursalId,
      usuarioId,
      descripcion: "",
    });

  const [depositErrors, setDepositErrors] = useState<
    Partial<DepositoCreatePayload>
  >({});
  const [openConfirmDeposito, setOpenConfirmDeposito] = useState(false);

  const createDepositoMutation = useCreateDeposito();

  // ================================
  // Estado Egreso
  // ================================
  const [formDataEgreso, setFormDataEgreso] = useState<EgresoCreatePayload>({
    descripcion: "",
    monto: 0,
    sucursalId,
    usuarioId,
  });
  const [openConfirmEgreso, setOpenConfirmEgreso] = useState(false);
  const createEgresoMutation = useCreateEgreso();

  // ================================
  // Handlers Depósito
  // ================================
  const handleDepositoInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormDataDeposito((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number(value) || 0 : (value as string),
    }));

    setDepositErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleDepositoBancoChange = (value: string) => {
    setFormDataDeposito((prev) => ({ ...prev, banco: value }));
    setDepositErrors((prev) => ({ ...prev, banco: undefined }));
  };

  const validarFormularioDeposito = (): boolean => {
    const { numeroBoleta, banco, descripcion } = formDataDeposito;

    const newErrors: Partial<DepositoCreatePayload> = {};

    if (!numeroBoleta.trim())
      newErrors.numeroBoleta = "Ingrese el número de boleta";
    if (!banco) newErrors.banco = "Seleccione un banco";
    if (!descripcion.trim()) newErrors.descripcion = "Ingrese una descripción";

    if (Object.keys(newErrors).length > 0) {
      setDepositErrors(newErrors);
      toast.warning("Falta información en el formulario de depósito");
      return false;
    }

    return true;
  };

  const handleSubmitDeposito = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (createDepositoMutation.isPending) return;

    if (!validarFormularioDeposito()) return;

    const payload: DepositoCreatePayload = {
      ...formDataDeposito,
      sucursalId,
      usuarioId,
    };

    try {
      await toast.promise(createDepositoMutation.mutateAsync(payload), {
        loading: "Registrando depósito...",
        success: "El depósito se ha registrado correctamente.",
        error: "No se pudo registrar el depósito. Intente nuevamente.",
      });

      setFormDataDeposito({
        monto: 0,
        numeroBoleta: "",
        banco: "",
        usadoParaCierre: false,
        sucursalId,
        usuarioId,
        descripcion: "",
      });
      setOpenConfirmDeposito(false);
      setDepositErrors({});
    } catch {
      // El error ya se mostró en toast.promise
    }
  };

  // ================================
  // Handlers Egreso
  // ================================
  const handleEgresoInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormDataEgreso((prev) => ({
      ...prev,
      [name]: name === "monto" ? Number(value) || 0 : (value as string),
    }));
  };

  const validarFormularioEgreso = (): boolean => {
    if (!formDataEgreso.monto || formDataEgreso.monto <= 0) {
      toast.warning("Ingrese un monto válido para el egreso");
      return false;
    }

    if (!formDataEgreso.descripcion.trim()) {
      toast.warning("Ingrese una descripción para el egreso");
      return false;
    }

    return true;
  };

  const handleSubmitEgreso = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (createEgresoMutation.isPending) return;

    if (!validarFormularioEgreso()) return;

    const payload: EgresoCreatePayload = {
      ...formDataEgreso,
      sucursalId,
      usuarioId,
    };

    try {
      await toast.promise(createEgresoMutation.mutateAsync(payload), {
        loading: "Registrando egreso...",
        success: "El egreso se ha registrado correctamente.",
        error: "No se pudo registrar el egreso. Intente nuevamente.",
      });

      setFormDataEgreso({
        monto: 0,
        sucursalId,
        usuarioId,
        descripcion: "",
      });
      setOpenConfirmEgreso(false);
    } catch {
      // El error ya se mostró en toast.promise
    }
  };

  // ================================
  // Render
  // ================================
  return (
    <Tabs defaultValue="deposito" className="max-w-5xl mx-auto mt-10">
      <TabsList className="flex justify-center gap-4 mb-6">
        <TabsTrigger value="deposito" className="flex-1 text-center">
          Registrar Depósito
        </TabsTrigger>
        <TabsTrigger value="egreso" className="flex-1 text-center">
          Registrar Egreso
        </TabsTrigger>
      </TabsList>

      {/* ================= DEPÓSITO ================ */}
      <TabsContent value="deposito">
        <Card className="w-full border border-[#e2b7b8] dark:border-[#7b2c7d] rounded-2xl shadow-sm">
          <CardHeader className="text-center border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
            <CardTitle className="text-[#7b2c7d]">
              Registro de Depósito
            </CardTitle>
            <CardDescription>
              Ingrese los detalles del depósito para la sucursal
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmitDeposito}>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="monto">Monto</Label>
                  <Input
                    id="monto"
                    name="monto"
                    type="number"
                    step="0.01"
                    value={formDataDeposito.monto}
                    onChange={handleDepositoInputChange}
                    placeholder="0.00"
                  />
                  {depositErrors.monto && (
                    <p className="text-sm text-red-500">
                      {depositErrors.monto}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroBoleta">Número de Boleta</Label>
                  <Input
                    id="numeroBoleta"
                    name="numeroBoleta"
                    value={formDataDeposito.numeroBoleta}
                    onChange={handleDepositoInputChange}
                    placeholder="Ingrese el número de boleta"
                  />
                  {depositErrors.numeroBoleta && (
                    <p className="text-sm text-red-500">
                      {depositErrors.numeroBoleta}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Select
                    value={formDataDeposito.banco || undefined}
                    onValueChange={handleDepositoBancoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un banco" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANRURAL">BANRURAL</SelectItem>
                      <SelectItem value="BANCO INDUSTRIAL">
                        BANCO INDUSTRIAL
                      </SelectItem>
                      <SelectItem value="YAMAN KUTX MICOOPE">
                        YAMAN KUTX MICOOPE
                      </SelectItem>
                      <SelectItem value="OTRO">OTRO</SelectItem>
                    </SelectContent>
                  </Select>
                  {depositErrors.banco && (
                    <p className="text-sm text-red-500">
                      {depositErrors.banco}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descripcion">Descripción</Label>
                  <Textarea
                    id="descripcion"
                    name="descripcion"
                    value={formDataDeposito.descripcion}
                    onChange={handleDepositoInputChange}
                    placeholder="Ingrese una descripción"
                  />
                  {depositErrors.descripcion && (
                    <p className="text-sm text-red-500">
                      {depositErrors.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center pb-6">
              <Button
                type="button"
                onClick={() => setOpenConfirmDeposito(true)}
                disabled={createDepositoMutation.isPending}
                className="w-full max-w-xs bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
              >
                Registrar Depósito
              </Button>
            </CardFooter>
          </form>

          <Dialog
            onOpenChange={setOpenConfirmDeposito}
            open={openConfirmDeposito}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Confirmación de Registro de Depósito
                </DialogTitle>
                <DialogDescription className="text-center">
                  ¿Estás seguro de crear el registro con esta información? La
                  acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <Button
                disabled={createDepositoMutation.isPending}
                onClick={() => handleSubmitDeposito()}
                className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
              >
                {createDepositoMutation.isPending && (
                  <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                )}
                Sí, continuar
              </Button>
            </DialogContent>
          </Dialog>
        </Card>
      </TabsContent>

      {/* ================= EGRESO ================ */}
      <TabsContent value="egreso">
        <Card className="w-full border border-[#e2b7b8] dark:border-[#7b2c7d] rounded-2xl shadow-sm">
          <CardHeader className="text-center border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
            <CardTitle className="text-[#7b2c7d]">Registro de Egreso</CardTitle>
            <CardDescription>Ingrese los detalles del egreso</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmitEgreso}>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="monto-egreso">Monto</Label>
                <Input
                  id="monto-egreso"
                  name="monto"
                  type="number"
                  step="1"
                  value={formDataEgreso.monto}
                  onChange={handleEgresoInputChange}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion-egreso">Descripción</Label>
                <Textarea
                  id="descripcion-egreso"
                  name="descripcion"
                  value={formDataEgreso.descripcion}
                  onChange={handleEgresoInputChange}
                  placeholder="Ingrese una descripción"
                />
              </div>
            </CardContent>

            <CardFooter className="flex justify-center pb-6">
              <Button
                type="button"
                disabled={createEgresoMutation.isPending}
                className="w-full max-w-xs bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                onClick={() => setOpenConfirmEgreso(true)}
              >
                Registrar Egreso
              </Button>
            </CardFooter>
          </form>

          <Dialog onOpenChange={setOpenConfirmEgreso} open={openConfirmEgreso}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Confirmación de Registro de Egreso
                </DialogTitle>
                <DialogDescription className="text-center">
                  ¿Estás seguro de crear el registro con esta información? La
                  acción no se puede deshacer.
                </DialogDescription>
              </DialogHeader>
              <Button
                disabled={createEgresoMutation.isPending}
                onClick={() => handleSubmitEgreso()}
                className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
              >
                {createEgresoMutation.isPending && (
                  <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                )}
                Sí, continuar
              </Button>
            </DialogContent>
          </Dialog>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
