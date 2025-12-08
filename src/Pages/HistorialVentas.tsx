import React, { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Trash2,
  Search,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import type {
  Venta,
  ProductoVenta,
} from "../Types/SalesHistory/HistorialVentas";

import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { useStore } from "@/components/Context/ContextSucursal";
import { Textarea } from "@/components/ui/textarea";

import {
  useGetSucursalSalesHistory,
  type SucursalSalesFilters,
} from "@/hooks/useHooks/useVentaQueries";
import {
  useDeleteVenta,
  type DeleteVentaPayload,
} from "@/hooks/useHooks/useVentaMutations";

registerLocale("es", es);

type VentaToDelete = Omit<DeleteVentaPayload, "adminPassword">;

const formatearFecha = (fecha: string) => {
  return format(new Date(fecha), "dd/MM/yyyy", { locale: es });
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(amount);

// ────────────────────────────────────────────────────────────
// Detalle de venta
// ────────────────────────────────────────────────────────────

const DetallesVenta = ({ venta }: { venta: Venta }) => (
  <Card className="w-full shadow-xl">
    <CardHeader>
      <CardTitle>Detalles de la Venta #{venta?.id || "N/A"}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold">Información de la Venta</h3>
          <p>
            Fecha:{" "}
            {venta?.fechaVenta ? formatearFecha(venta.fechaVenta) : "N/A"}
          </p>
          <p>
            Hora:{" "}
            {venta?.horaVenta
              ? new Date(venta.horaVenta).toLocaleTimeString()
              : "N/A"}
          </p>
          <p>
            Cantidad:{" "}
            {venta?.productos
              ? venta.productos.reduce(
                  (total, producto) => total + producto.cantidad,
                  0
                )
              : "N/A"}{" "}
            unidades de {venta?.productos?.length || "0"} productos
          </p>
        </div>
        <div>
          <h3 className="font-semibold">Cliente</h3>
          {venta?.cliente ? (
            <>
              <p>Nombre: {venta.cliente.nombre || "N/A"}</p>
              <p>Teléfono: {venta.cliente.telefono || "N/A"}</p>
              <p>DPI: {venta.cliente.dpi || "N/A"}</p>
              <p>Dirección: {venta.cliente.direccion || "N/A"}</p>
            </>
          ) : (
            <>
              <p>Nombre: {venta?.nombreClienteFinal || "CF"}</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Productos</h3>
        <div className="max-h-60 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta?.productos?.length > 0 ? (
                venta.productos.map((producto: ProductoVenta) => (
                  <TableRow key={producto.id}>
                    <TableCell>{producto.producto?.nombre || "N/A"}</TableCell>
                    <TableCell>{producto.cantidad ?? "N/A"}</TableCell>
                    <TableCell>
                      {producto.precioVenta !== undefined
                        ? formatCurrency(producto.precioVenta)
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {producto.cantidad !== undefined &&
                      producto.precioVenta !== undefined
                        ? formatCurrency(
                            producto.cantidad * producto.precioVenta
                          )
                        : "N/A"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No hay productos disponibles
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-semibold">Método de Pago</h3>
        <p>Tipo: {venta?.metodoPago?.metodoPago || "N/A"}</p>
        <p>
          Monto total pagado:{" "}
          {venta?.totalVenta !== undefined
            ? formatCurrency(venta.totalVenta)
            : "N/A"}
        </p>
      </div>
    </CardContent>
  </Card>
);

// ────────────────────────────────────────────────────────────
// Page principal
// ────────────────────────────────────────────────────────────

export default function HistorialVentas() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const userRol = useStore((state) => state.userRol) ?? "VENDEDOR";
  const userId = useStore((state) => state.userId) ?? 0;

  // Filtros locales que viajan al server
  const [filtroVenta, setFiltroVenta] = useState("");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [showSummary, setShowSummary] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const [startDate, endDate] = dateRange;

  // Construimos filtros para el hook
  const filters: SucursalSalesFilters = useMemo(() => {
    const from =
      startDate != null
        ? format(startDate, "yyyy-MM-dd") // el server espera ISO simple
        : undefined;
    const to = endDate != null ? format(endDate, "yyyy-MM-dd") : undefined;

    return {
      page: currentPage,
      pageSize,
      search: filtroVenta || undefined,
      from,
      to,
    };
  }, [currentPage, pageSize, filtroVenta, startDate, endDate]);

  // Query principal
  const {
    data,
    isLoading: isLoadingVentas,
    isFetching: isFetchingVentas,
  } = useGetSucursalSalesHistory(sucursalId, filters);

  const ventas = data?.items ?? [];
  const totalItems = data?.totalItems ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const summary = data?.summary ?? null;

  // Eliminar venta
  const { mutateAsync: deleteVenta, isPending: isDeleting } = useDeleteVenta();

  const [ventaEliminar, setVentaEliminar] = useState<VentaToDelete>({
    usuarioId: 0,
    motivo: "",
    totalVenta: 0,
    clienteId: 0,
    productos: [],
    ventaId: 0,
    sucursalId,
  });

  const [isOpenDelete, setIsOpenDelete] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");

  const handleDeleteSale = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!adminPassword || adminPassword.trim().length === 0) {
      toast.info("Contraseña no ingresada");
      return;
    }

    if (!ventaEliminar.motivo || ventaEliminar.motivo.trim().length === 0) {
      toast.info("Debe ingresar un motivo para la eliminación");
      return;
    }

    if (!ventaEliminar || ventaEliminar.productos.length === 0) {
      toast.info("No se ha seleccionado una venta para eliminar");
      return;
    }

    try {
      await deleteVenta({
        ...ventaEliminar,
        adminPassword,
      });

      toast.success("Venta eliminada exitosamente");

      setIsOpenDelete(false);
      setVentaEliminar({
        usuarioId: userId,
        motivo: "",
        totalVenta: 0,
        clienteId: 0,
        productos: [],
        ventaId: 0,
        sucursalId,
      });
      setAdminPassword("");
    } catch {
      toast.error("Ocurrió un error al eliminar la venta");
    }
  };

  const handleChangeTextAreaMotivo = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const texto = e.target.value;
    setVentaEliminar((datosPrevios) => ({
      ...datosPrevios,
      motivo: texto,
    }));
  };

  const handleChangePage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto space-y-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Historial de Ventas
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta, filtra y administra las ventas de esta sucursal.
          </p>
          {isFetchingVentas && !isLoadingVentas && (
            <p className="mt-1 text-xs text-muted-foreground">
              Actualizando ventas...
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="toggle-summary"
            checked={showSummary}
            onCheckedChange={setShowSummary}
          />
          <Label
            htmlFor="toggle-summary"
            className="text-xs sm:text-sm text-muted-foreground"
          >
            Mostrar resumen del rango
          </Label>
        </div>
      </div>

      {/* Card Resumen */}
      {showSummary && (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
          <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Resumen del rango seleccionado
              </p>
              <p className="text-sm">
                {startDate && endDate
                  ? `${format(startDate, "dd/MM/yyyy")} - ${format(
                      endDate,
                      "dd/MM/yyyy"
                    )}`
                  : "Selecciona un rango de fechas para ver el resumen"}
              </p>
            </div>

            {summary && startDate && endDate ? (
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="font-semibold">{summary.countInRange}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold">
                    {formatCurrency(summary.totalInRange)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No hay datos suficientes para el resumen.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card className="shadow-sm">
        <CardContent className="space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="filtro-texto" className="text-xs">
                Buscar
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  id="filtro-texto"
                  placeholder="Filtrar por número de venta, nombre, teléfono, DPI, dirección..."
                  value={filtroVenta}
                  onChange={(e) => {
                    setFiltroVenta(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Rango de fechas</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <DatePicker
                  locale="es"
                  selectsRange
                  startDate={startDate || undefined}
                  endDate={endDate || undefined}
                  onChange={(update) => {
                    setDateRange(update as [Date | null, Date | null]);
                    setCurrentPage(1);
                  }}
                  isClearable
                  placeholderText="Seleccionar rango de fechas"
                  className="w-full rounded-md border bg-white px-9 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-muted-foreground">
            <span>
              {totalItems > 0
                ? `Mostrando ${ventas.length} de ${totalItems} ventas filtradas`
                : "No hay ventas para los filtros seleccionados"}
            </span>
            {(filtroVenta || startDate || endDate) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFiltroVenta("");
                  setDateRange([null, null]);
                  setCurrentPage(1);
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="shadow-xl">
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh] w-full">
            <div className="min-w-[720px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Acciones</TableHead>
                    <TableHead>Impresiones</TableHead>
                    <TableHead>Eliminar</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoadingVentas ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center">
                        Cargando ventas...
                      </TableCell>
                    </TableRow>
                  ) : ventas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center">
                        No se encontraron ventas con los filtros actuales
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell>#{venta.id}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {venta.cliente
                            ? venta.cliente.nombre
                            : venta.nombreClienteFinal
                            ? venta.nombreClienteFinal
                            : "CF"}
                        </TableCell>
                        <TableCell>
                          {formatearFecha(venta.fechaVenta)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(venta.totalVenta)}
                        </TableCell>

                        {/* Acciones */}
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  aria-label="Ver detalles de venta"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="flex max-w-2xl justify-center">
                                <DetallesVenta venta={venta} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>

                        {/* Impresiones */}
                        <TableCell>
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={`/venta/generar-factura/${venta.id}`}
                                  >
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      aria-label="Imprimir Comprobante"
                                    >
                                      <FileText className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Imprimir Comprobante</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>

                        {/* Eliminar */}
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  disabled={
                                    ["CREDITO", "OTRO"].includes(
                                      venta?.metodoPago?.metodoPago ?? ""
                                    ) || userRol !== "ADMIN"
                                  }
                                  onClick={() => {
                                    setVentaEliminar((datosPrevios) => ({
                                      ...datosPrevios,
                                      usuarioId: userId,
                                      ventaId: venta.id,
                                      clienteId: Number(
                                        venta?.cliente?.id ?? 0
                                      ),
                                      productos:
                                        venta?.productos?.map((prod) => ({
                                          cantidad: prod.cantidad,
                                          precioVenta: prod.precioVenta,
                                          productoId: prod.productoId,
                                        })) || [],
                                      totalVenta: venta.totalVenta,
                                    }));
                                    setIsOpenDelete(true);
                                  }}
                                  variant="outline"
                                  size="icon"
                                  aria-label="Eliminar Venta"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Eliminar registro</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>

        {/* Modal eliminar */}
        <Dialog onOpenChange={setIsOpenDelete} open={isOpenDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-center">
                ¿Estás seguro de eliminar este registro de venta?
              </DialogTitle>
              <DialogDescription className="text-center">
                Esto eliminará por completo el registro, y se restará de las
                ganancias de la sucursal.
              </DialogDescription>
              <DialogDescription className="text-center">
                ¿Continuar?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Textarea
                placeholder="Escriba el motivo de la eliminación del registro"
                className="mb-2"
                value={ventaEliminar.motivo}
                onChange={handleChangeTextAreaMotivo}
              />

              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Ingrese su contraseña como administrador para confirmar"
              />
            </div>
            <div className="flex gap-2">
              <Button
                className="w-full"
                onClick={() => setIsOpenDelete(false)}
                variant={"destructive"}
                disabled={isDeleting}
              >
                Cancelar
              </Button>

              <Button
                className="w-full"
                variant={"default"}
                onClick={handleDeleteSale}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, continúa y elimina"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Paginación server-side */}
        {totalItems > 0 && (
          <div className="flex items-center justify-center py-4">
            <Pagination>
              <PaginationContent className="flex flex-wrap items-center gap-1">
                <PaginationItem>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChangePage(1)}
                    disabled={currentPage === 1}
                  >
                    Primero
                  </Button>
                </PaginationItem>

                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      handleChangePage(Math.max(1, currentPage - 1))
                    }
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </PaginationPrevious>
                </PaginationItem>

                {currentPage > 3 && (
                  <>
                    <PaginationItem>
                      <PaginationLink onClick={() => handleChangePage(1)}>
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
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handleChangePage(page)}
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
                      <PaginationLink
                        onClick={() => handleChangePage(totalPages)}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  </>
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      handleChangePage(Math.min(totalPages, currentPage + 1))
                    }
                  >
                    <ChevronRight className="h-4 w-4" />
                  </PaginationNext>
                </PaginationItem>

                <PaginationItem>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleChangePage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Último
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </Card>
    </div>
  );
}
