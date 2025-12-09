import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";

import { useStore } from "@/components/Context/ContextSucursal";

import { CashRegisterShift } from "./CashRegisterTypes";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Coins,
  Trash2,
  CalendarClock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/es";
import { getApiErrorMessageAxios } from "../Utils/apiAxiosError";

const API_URL = import.meta.env.VITE_API_URL;

dayjs.extend(localizedFormat);
dayjs.extend(customParseFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) => {
  if (!fecha) return "Sin fecha";
  return dayjs(fecha).format("DD MMMM YYYY hh:mm A");
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(amount ?? 0);
};

export default function CashRegisters() {
  const sucursalId = useStore((state) => state.sucursalId);
  const [shifts, setShifts] = useState<CashRegisterShift[]>([]);

  // Para controlar si se muestra el botón de eliminar
  const isAdminDeleteable = true; // luego tú calculas esto como quieras

  // ========== Fetch registros ==========
  useEffect(() => {
    const getCashRegists = async () => {
      if (!sucursalId) return;

      try {
        const response = await axios.get(
          `${API_URL}/caja/get-all-cash-register-sucursal/${sucursalId}`
        );

        if (response.status === 200) {
          setShifts(response.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al conseguir registros de caja");
      }
    };

    getCashRegists();
  }, [sucursalId]);

  // ========== Paginación ==========
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.max(1, Math.ceil(shifts.length / itemsPerPage));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = shifts.slice(indexOfFirstItem, indexOfLastItem);

  const onPageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // ========== Delete turno ==========
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<CashRegisterShift | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const openDeleteDialog = (shift: CashRegisterShift) => {
    if (!isAdminDeleteable) return;
    setShiftToDelete(shift);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;

    const idToDelete = shiftToDelete.id;
    setIsDeleting(true);

    try {
      await toast.promise(
        axios.delete(`${API_URL}/caja/delete-cash-register/${idToDelete}`),
        {
          loading: "Eliminando turno de caja...",
          success: () => {
            // Actualizar la lista en memoria
            setShifts((prev) => prev.filter((s) => s.id !== idToDelete));

            // Cerrar diálogo y limpiar selección
            setDeleteDialogOpen(false);
            setShiftToDelete(null);

            return "Turno de caja eliminado correctamente.";
          },
          error: (error) => getApiErrorMessageAxios(error),
        }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      {currentItems.length === 0 ? (
        <Card className="border border-[#e2b7b8] dark:border-[#7b2c7d] rounded-2xl">
          <CardHeader className="bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60">
            <CardTitle className="text-sm text-center text-muted-foreground">
              No hay turnos de caja registrados.
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        currentItems.map((shift) => {
          const tieneComentario =
            !!shift.comentario && shift.comentario.trim().length > 0;

          return (
            <Card
              key={shift.id}
              className="border border-[#e2b7b8] dark:border-[#7b2c7d] rounded-2xl shadow-sm"
            >
              <CardHeader className="border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-[#7b2c7d]" />
                    <div>
                      <CardTitle className="flex items-center gap-2 text-[#7b2c7d] text-base">
                        Turno de Caja #{shift?.id ?? "N/A"}
                        <Badge
                          className="ml-1"
                          variant={
                            shift?.estado === "CERRADO"
                              ? "destructive"
                              : "default"
                          }
                        >
                          {shift?.estado || "SIN ESTADO"}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {shift?.usuario?.nombre || "Usuario no disponible"} ·{" "}
                        {shift?.sucursal?.nombre || "Sucursal no disponible"}
                      </p>
                    </div>
                  </div>

                  {isAdminDeleteable && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="border-[#e2b7b8] text-red-600 hover:bg-red-50"
                      onClick={() => openDeleteDialog(shift)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3 w-3 text-[#7b2c7d]" />
                    <span>
                      <span className="font-medium">Inicio:</span>{" "}
                      {formatearFecha(shift?.fechaInicio)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3 w-3 text-[#7b2c7d]" />
                    <span>
                      <span className="font-medium">Cierre:</span>{" "}
                      {shift?.fechaCierre
                        ? formatearFecha(shift.fechaCierre)
                        : "Sin cierre"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                {/* Resumen rápido */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-[#7b2c7d]" />
                      Saldo inicial
                    </p>
                    <p className="text-sm font-semibold">
                      {shift?.saldoInicial !== undefined &&
                      shift?.saldoInicial !== null
                        ? formatCurrency(shift.saldoInicial)
                        : "No disponible"}
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3 text-[#7b2c7d]" />
                      Saldo final
                    </p>
                    <p className="text-sm font-semibold">
                      {shift?.saldoFinal !== undefined &&
                      shift?.saldoFinal !== null
                        ? formatCurrency(shift.saldoFinal)
                        : "No disponible"}
                    </p>
                  </div>

                  <div className="border rounded-xl p-3 bg-[#fff9fb] dark:bg-transparent">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <ClipboardList className="h-3 w-3 text-[#7b2c7d]" />
                      Movimientos
                    </p>
                    <p className="text-xs">
                      Depósitos:{" "}
                      <span className="font-semibold">
                        {shift.depositos.length}
                      </span>{" "}
                      · Egresos:{" "}
                      <span className="font-semibold">
                        {shift.egresos.length}
                      </span>{" "}
                      · Ventas:{" "}
                      <span className="font-semibold">
                        {shift.ventas.length}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Detalle por acordeón */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="depositos">
                    <AccordionTrigger className="text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Banknote className="h-4 w-4 text-[#7b2c7d]" />
                        Depósitos ({shift.depositos.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Banco</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Usado para cierre</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shift?.depositos?.length ? (
                            shift.depositos.map((deposito) => (
                              <TableRow key={deposito.id}>
                                <TableCell>{deposito.banco || "N/A"}</TableCell>
                                <TableCell>
                                  {formatCurrency(deposito.monto || 0)}
                                </TableCell>
                                <TableCell>
                                  {formatearFecha(deposito.fechaDeposito) ||
                                    "N/A"}
                                </TableCell>
                                <TableCell>
                                  {deposito?.usuario?.nombre || "No disponible"}
                                </TableCell>
                                <TableCell>
                                  {deposito.descripcion || "Sin descripción"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      deposito.usadoParaCierre
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {deposito.usadoParaCierre ? "Sí" : "No"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center">
                                No hay depósitos registrados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="egresos">
                    <AccordionTrigger className="text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <Coins className="h-4 w-4 text-[#7b2c7d]" />
                        Egresos ({shift.egresos.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Usuario</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shift?.egresos?.length ? (
                            shift.egresos.map((egreso) => (
                              <TableRow key={egreso.id}>
                                <TableCell>
                                  {egreso.descripcion || "Sin descripción"}
                                </TableCell>
                                <TableCell>
                                  {formatCurrency(egreso.monto || 0)}
                                </TableCell>
                                <TableCell>
                                  {formatearFecha(egreso.fechaEgreso) || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {egreso?.usuario?.nombre || "No disponible"}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center">
                                No hay egresos registrados
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="ventas">
                    <AccordionTrigger className="text-sm font-semibold">
                      <div className="flex items-center gap-2">
                        <ClipboardList className="h-4 w-4 text-[#7b2c7d]" />
                        Ventas ({shift.ventas.length})
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>No. Venta</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Código Producto</TableHead>
                            <TableHead>Fecha</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shift?.ventas?.length ? (
                            shift.ventas.map((venta) =>
                              venta.productos.map((producto, index) => (
                                <TableRow key={`${venta.id}-${index}`}>
                                  <TableCell>{venta.id || "N/A"}</TableCell>
                                  <TableCell>
                                    {producto?.producto?.nombre || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {producto.cantidad || 0}
                                  </TableCell>
                                  <TableCell>
                                    {producto?.producto?.codigoProducto ||
                                      "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    {formatearFecha(venta.fechaVenta) || "N/A"}
                                  </TableCell>
                                </TableRow>
                              ))
                            )
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                No hay ventas registradas
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="comentario">
                    <AccordionTrigger className="text-sm font-semibold">
                      Comentario ({tieneComentario ? "Sí" : "No"})
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="whitespace-pre-wrap text-sm">
                        {shift?.comentario || "Sin comentarios"}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => onPageChange(1)}
                  className="text-xs"
                >
                  Primero
                </Button>
              </PaginationItem>

              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationPrevious>
              </PaginationItem>

              {/* Truncado */}
              {currentPage > 3 && (
                <>
                  <PaginationItem>
                    <PaginationLink onClick={() => onPageChange(1)}>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-muted-foreground">...</span>
                  </PaginationItem>
                </>
              )}

              {Array.from({ length: totalPages }, (_, index) => {
                const page = index + 1;
                if (
                  page === currentPage ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <PaginationItem key={index}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return null;
              })}

              {currentPage < totalPages - 2 && (
                <>
                  <PaginationItem>
                    <span className="text-muted-foreground">...</span>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink onClick={() => onPageChange(totalPages)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    onPageChange(Math.min(totalPages, currentPage + 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </PaginationNext>
              </PaginationItem>

              <PaginationItem>
                <Button
                  variant="destructive"
                  className="text-xs"
                  onClick={() => onPageChange(totalPages)}
                >
                  Último
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Diálogo de eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">
              Eliminar turno de caja
            </DialogTitle>
            <DialogDescription className="text-center">
              ¿Seguro que quieres eliminar el turno de caja #{shiftToDelete?.id}
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
              disabled={isDeleting || !shiftToDelete}
              onClick={handleConfirmDelete}
            >
              {isDeleting && (
                <span className="mr-2 h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              )}
              Eliminar turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
