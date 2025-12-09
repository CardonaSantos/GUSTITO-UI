"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Banknote,
  CoinsIcon,
  CheckCircle2,
  Coins,
  CreditCard,
} from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";

import {
  useCloseCaja,
  useGetCajaAbierta,
  useGetDepositosSucursal,
  useGetEgresosSucursal,
  useGetVentasCaja,
  useOpenCaja,
  RegistroCajaInicioPayload,
  RegistroCajaCierrePayload,
} from "@/hooks/useHooks/useCaja";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
};

// Aux: prevenir scroll en inputs number
const handleNumberWheel: React.WheelEventHandler<HTMLInputElement> = (
  event
) => {
  event.currentTarget.blur();
};

// Componente principal
export default function RegistroCaja() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const usuarioId = useStore((state) => state.userId) ?? 0;
  const userName = useStore((state) => state.userNombre) ?? "";

  // Queries
  const { data: cajaInfo, isLoading: isLoadingCaja } = useGetCajaAbierta(
    sucursalId,
    usuarioId
  );

  // Caja abierta (si existe)
  const registroAbierto = cajaInfo?.cajaAbierta ?? null;
  // Última caja cerrada (si existe)
  const ultimaCajaCerrada = cajaInfo?.ultimaCajaCerrada ?? null;

  const isCashRegistOpen = !!registroAbierto;

  // Resumen calculado por el backend
  const resumen = registroAbierto?.resumen;

  // saldo teórico según backend (lo que "debería" haber en caja)
  const saldoTeoricoFinal = resumen?.saldoTeoricoFinal ?? 0;

  const { data: depositos = [] } = useGetDepositosSucursal(sucursalId);
  const { data: egresos = [] } = useGetEgresosSucursal(sucursalId);
  const { data: ventas = [] } = useGetVentasCaja(sucursalId, usuarioId);

  // Mutations
  const openCajaMutation = useOpenCaja();
  const closeCajaMutation = useCloseCaja();

  // Formularios
  const [formDataInicio, setFormDataInicio] =
    useState<RegistroCajaInicioPayload>({
      saldoInicial: 0,
      estado: "ABIERTO",
      comentario: "",
      sucursalId,
      usuarioId,
    });

  const [formDataCierre, setFormDataCierre] = useState<
    Omit<
      RegistroCajaCierrePayload,
      "depositosIds" | "egresosIds" | "ventasIds" | "id"
    >
  >({
    saldoInicial: 0,
    saldoFinal: saldoTeoricoFinal ?? 0,
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaCierre: "",
    estado: "ABIERTO",
    comentario: "",
    sucursalId,
    usuarioId,
  });

  useEffect(() => {
    if (saldoTeoricoFinal) {
      setFormDataCierre((previa) => ({
        ...previa,
        saldoFinal: saldoTeoricoFinal,
      }));
    }
  }, [saldoTeoricoFinal]);

  // Diálogos
  const [openConfirmInicio, setOpenConfirmInicio] = useState(false);
  const [openConfirmCierre, setOpenConfirmCierre] = useState(false);

  // Si hay caja abierta, sincronizamos datos de cierre
  useEffect(() => {
    if (registroAbierto) {
      setFormDataCierre((prev) => ({
        ...prev,
        comentario: registroAbierto.comentario ?? "",
        saldoInicial: registroAbierto.saldoInicial ?? 0,
      }));
    }
  }, [registroAbierto]);

  // Si NO hay caja abierta pero SÍ hay última caja cerrada,
  // sugerimos saldoInicial = saldoFinal de esa caja (solo si está en 0).
  useEffect(() => {
    if (!registroAbierto && ultimaCajaCerrada) {
      setFormDataInicio((prev) => {
        if (prev.saldoInicial && prev.saldoInicial > 0) return prev;

        return {
          ...prev,
          saldoInicial: ultimaCajaCerrada.saldoFinal ?? 0,
          comentario:
            prev.comentario ||
            `Saldo inicial basado en el cierre anterior del ${formatearFecha(
              ultimaCajaCerrada.fechaCierre
            )}`,
        };
      });
    }
  }, [registroAbierto, ultimaCajaCerrada]);

  // Handlers de inputs
  const handleInputInicioChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormDataInicio((prev) => ({
      ...prev,
      [name]: name === "saldoInicial" ? Number(value) || 0 : (value as string),
    }));
  };

  const handleInputCierreChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormDataCierre((prev) => ({
      ...prev,
      [name]:
        name === "saldoFinal" || name === "saldoInicial"
          ? Number(value) || 0
          : (value as string),
    }));
  };

  // Totales calculados
  const totalDepositos = useMemo(
    () => depositos.reduce((acc, d) => acc + d.monto, 0),
    [depositos]
  );
  const totalEgresos = useMemo(
    () => egresos.reduce((acc, e) => acc + e.monto, 0),
    [egresos]
  );
  const totalVentas = useMemo(
    () => ventas.reduce((acc, v) => acc + v.totalVenta, 0),
    [ventas]
  );

  // Submits
  const handleSubmitInicio = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!formDataInicio.saldoInicial || formDataInicio.saldoInicial <= 0) {
      toast.warning("Debe ingresar un saldo inicial mayor a 0");
      return;
    }

    const payload: RegistroCajaInicioPayload = {
      ...formDataInicio,
      sucursalId,
      usuarioId,
    };

    try {
      await toast.promise(openCajaMutation.mutateAsync(payload), {
        loading: "Creando registro de caja...",
        success: "El registro de caja se ha creado correctamente.",
        error: "No se pudo abrir el registro de caja. Intente nuevamente.",
      });

      setFormDataInicio({
        saldoInicial: 0,
        estado: "ABIERTO",
        comentario: "",
        sucursalId,
        usuarioId,
      });
      setOpenConfirmInicio(false);
    } catch {
      // el toast.promise ya mostró el error
    }
  };

  const handleSubmitCierre = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!registroAbierto) return;

    if (!formDataCierre.saldoFinal || formDataCierre.saldoFinal <= 0) {
      toast.warning("Debe ingresar un saldo final mayor a 0");
      return;
    }

    const payload: RegistroCajaCierrePayload = {
      ...formDataCierre,
      sucursalId,
      usuarioId,
      fechaCierre: new Date().toISOString(),
      depositosIds: depositos.map((d) => d.id),
      egresosIds: egresos.map((e) => e.id),
      ventasIds: ventas.map((v) => v.id),
      id: registroAbierto.id,
    };

    try {
      await toast.promise(closeCajaMutation.mutateAsync(payload), {
        loading: "Cerrando registro de caja...",
        success: "El registro de caja se ha cerrado correctamente.",
        error: "No se pudo cerrar el registro de caja. Intente nuevamente.",
      });

      setFormDataCierre({
        saldoInicial: 0,
        saldoFinal: 0,
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaCierre: "",
        estado: "ABIERTO",
        comentario: "",
        sucursalId,
        usuarioId,
      });
      setOpenConfirmCierre(false);
    } catch {
      // error ya mostrado en toast.promise
    }
  };

  console.log("Caja info: ", cajaInfo);

  if (isLoadingCaja && !cajaInfo) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <p className="text-sm text-muted-foreground">
          Cargando registro de caja...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* CARD PRINCIPAL */}
      <Card className="w-full border border-[#e2b7b8] dark:border-[#7b2c7d] rounded-2xl">
        {isCashRegistOpen ? (
          <>
            <CardHeader className="border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#7b2c7d]">
                    <CoinsIcon className="h-5 w-5" />
                    Registro de Caja Abierto
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {userName} · desde{" "}
                    {registroAbierto
                      ? formatearFecha(registroAbierto.fechaInicio)
                      : ""}
                  </CardDescription>
                </div>
                <Badge className="bg-[#7b2c7d] text-white text-xs">
                  ABIERTO
                </Badge>
              </div>
            </CardHeader>

            <form onSubmit={handleSubmitCierre}>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="saldoInicial">Saldo inicial</Label>
                    <Input
                      id="saldoInicial"
                      name="saldoInicial"
                      type="number"
                      value={registroAbierto?.saldoInicial ?? 0}
                      readOnly
                      className="bg-muted/50"
                      onWheel={handleNumberWheel}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="saldoFinal">Saldo final</Label>
                    <Input
                      id="saldoFinal"
                      name="saldoFinal"
                      type="number"
                      value={formDataCierre.saldoFinal}
                      onChange={handleInputCierreChange}
                      onWheel={handleNumberWheel}
                      placeholder="0.00"
                      inputMode="decimal"
                      aria-label="Saldo final de salida"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comentario">Comentario</Label>
                  <Textarea
                    id="comentario"
                    name="comentario"
                    value={
                      formDataCierre.comentario ??
                      registroAbierto?.comentario ??
                      ""
                    }
                    onChange={handleInputCierreChange}
                    placeholder="Comentarios del cierre (opcional)"
                    rows={3}
                  />
                </div>

                {/* Resumen rápido */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CoinsIcon className="h-3 w-3 text-[#7b2c7d]" />
                      Saldo inicial
                    </p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(
                        resumen?.saldoInicial ??
                          registroAbierto?.saldoInicial ??
                          0
                      )}
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-[#7b2c7d]" />
                      Ventas
                    </p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(resumen?.totalVentas ?? totalVentas)}
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-[#7b2c7d]" />
                      Egresos
                    </p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(resumen?.totalEgresos ?? totalEgresos)}
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Banknote className="h-3 w-3 text-[#7b2c7d]" />
                      Depósitos
                    </p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(resumen?.totalDepositos ?? totalDepositos)}
                    </p>
                  </div>
                </div>

                {/* Resumen esperado vs contado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CoinsIcon className="h-3 w-3 text-[#7b2c7d]" />
                      Saldo esperado
                    </p>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(saldoTeoricoFinal)}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                  onClick={() => setOpenConfirmCierre(true)}
                  disabled={closeCajaMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Cerrar caja
                </Button>
              </CardFooter>
            </form>

            {/* Dialog Cierre */}
            <Dialog
              open={openConfirmCierre}
              onOpenChange={setOpenConfirmCierre}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Confirmar cierre de caja
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Revisa que el saldo final y los movimientos sean correctos.
                    Esta acción no puede deshacerse.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpenConfirmCierre(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                    disabled={closeCajaMutation.isPending}
                    onClick={() => handleSubmitCierre()}
                  >
                    {closeCajaMutation.isPending && (
                      <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    )}
                    Confirmar cierre
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <>
            <CardHeader className="border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#7b2c7d]">
                    <CoinsIcon className="h-5 w-5" />
                    Registrar inicio de turno
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {userName}
                  </CardDescription>
                </div>
                <Badge className="bg-[#e2b7b8] text-[#7b2c7d] text-xs">
                  CAJA CERRADA
                </Badge>
              </div>
            </CardHeader>
            <form onSubmit={handleSubmitInicio}>
              <CardContent className="space-y-4 pt-4">
                {ultimaCajaCerrada && (
                  <div className="text-xs text-muted-foreground bg-[#fff5f7] dark:bg-[#7b2c7d]/10 border border-dashed border-[#e2b7b8]/80 rounded-xl p-3">
                    Última caja cerrada por{" "}
                    <span className="font-semibold">
                      {ultimaCajaCerrada.usuario?.nombre}
                    </span>{" "}
                    el {formatearFecha(ultimaCajaCerrada.fechaCierre)} con un
                    saldo final de{" "}
                    <span className="font-semibold">
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(ultimaCajaCerrada.saldoFinal ?? 0)}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="saldoInicial">Saldo inicial</Label>
                  <Input
                    id="saldoInicial"
                    name="saldoInicial"
                    type="number"
                    value={formDataInicio.saldoInicial}
                    onChange={handleInputInicioChange}
                    onWheel={handleNumberWheel}
                    placeholder="0.00"
                    inputMode="decimal"
                    aria-label="Saldo inicial en caja"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comentario">Comentario</Label>
                  <Textarea
                    id="comentario"
                    name="comentario"
                    value={formDataInicio.comentario}
                    onChange={handleInputInicioChange}
                    placeholder="Comentario opcional"
                    rows={3}
                  />
                </div>
              </CardContent>
              <CardFooter className="pt-0 flex flex-col gap-2">
                <Button
                  type="button"
                  className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                  onClick={() => setOpenConfirmInicio(true)}
                  disabled={openCajaMutation.isPending}
                >
                  <CoinsIcon className="h-4 w-4 mr-2" />
                  Iniciar turno
                </Button>
              </CardFooter>
            </form>

            {/* Dialog Inicio */}
            <Dialog
              open={openConfirmInicio}
              onOpenChange={setOpenConfirmInicio}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Confirmar inicio de caja
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Se registrará el saldo inicial y se asociarán los
                    movimientos a este turno.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setOpenConfirmInicio(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                    disabled={openCajaMutation.isPending}
                    onClick={() => handleSubmitInicio()}
                  >
                    {openCajaMutation.isPending && (
                      <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
                    )}
                    Confirmar inicio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </Card>
    </div>
  );
}
