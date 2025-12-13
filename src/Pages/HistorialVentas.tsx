"use client";

import type React from "react";
import { useMemo, useState } from "react";
import {
  Eye,
  FileText,
  Trash2,
  Search,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  Venta,
  ProductoVenta,
} from "../Types/SalesHistory/HistorialVentas";
import { toast } from "sonner";
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
  <Card className="w-full border-0 sm:border">
    <CardHeader className="pb-3">
      <CardTitle className="text-[#7B4397]">
        Detalles de la Venta #{venta?.id || "N/A"}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="font-semibold mb-1">Información de la Venta</h3>
          <p className="text-sm">
            Fecha:{" "}
            {venta?.fechaVenta ? formatearFecha(venta.fechaVenta) : "N/A"}
          </p>
          <p className="text-sm">
            Hora:{" "}
            {venta?.horaVenta
              ? new Date(venta.horaVenta).toLocaleTimeString()
              : "N/A"}
          </p>
          <p className="text-sm">
            Cantidad:{" "}
            {venta?.productos
              ? venta.productos.reduce(
                  (total, producto) => total + producto.cantidad,
                  0
                )
              : "N/A"}{" "}
            unidades
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-1">Cliente</h3>
          {venta?.cliente ? (
            <div className="text-sm">
              <p>Nombre: {venta.cliente.nombre || "N/A"}</p>
              <p>Teléfono: {venta.cliente.telefono || "N/A"}</p>
            </div>
          ) : (
            <div className="text-sm">
              <p>Nombre: {venta?.nombreClienteFinal || "CF"}</p>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Productos</h3>
        <div className="max-h-60 overflow-y-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Prod.</TableHead>
                <TableHead className="text-xs text-right">Cant.</TableHead>
                <TableHead className="text-xs text-right">Sub.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {venta?.productos?.length > 0 ? (
                venta.productos.map((producto: ProductoVenta) => (
                  <TableRow key={producto.id}>
                    <TableCell className="text-xs">
                      {producto.producto?.nombre || "N/A"}
                    </TableCell>
                    <TableCell className="text-xs text-right">
                      {producto.cantidad ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-xs text-right">
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
                  <TableCell colSpan={3} className="text-center text-xs">
                    Sin productos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="mt-4">
        <p className="font-bold text-lg text-right text-[#7B4397]">
          Total:{" "}
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

  const filters: SucursalSalesFilters = useMemo(() => {
    const from =
      startDate != null ? format(startDate, "yyyy-MM-dd") : undefined;
    const to =
      endDate != null ? format(addDays(endDate, 1), "yyyy-MM-dd") : undefined;
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

  const prepareDelete = (venta: Venta) => {
    setVentaEliminar({
      usuarioId: userId,
      ventaId: venta.id,
      sucursalId: sucursalId,
      clienteId: Number(venta?.cliente?.id ?? 0),
      productos:
        venta?.productos?.map((prod) => ({
          cantidad: prod.cantidad,
          precioVenta: prod.precioVenta,
          productoId: prod.productoId,
        })) || [],
      totalVenta: venta.totalVenta,
      motivo: "",
    });
    setIsOpenDelete(true);
  };

  const isDeleteDisabled = (venta: Venta) => {
    return (
      ["CREDITO", "OTRO"].includes(venta?.metodoPago?.metodoPago ?? "") ||
      userRol !== "ADMIN"
    );
  };

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="container mx-auto space-y-3 p-2 sm:p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#7B4397]">
            Historial de Ventas
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Consulta, filtra y administra las ventas
            {isFetchingVentas && !isLoadingVentas && " • Actualizando..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="toggle-summary"
            checked={showSummary}
            onCheckedChange={setShowSummary}
          />
          <Label
            htmlFor="toggle-summary"
            className="text-xs sm:text-sm text-muted-foreground cursor-pointer"
          >
            Mostrar Resumen
          </Label>
        </div>
      </div>

      {showSummary && (
        <Card className="border-[#7B4397]/30 bg-[#7B4397]/5">
          <CardContent className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                Rango seleccionado
              </p>
              <p className="text-sm font-medium text-[#7B4397]">
                {startDate && endDate
                  ? `${format(startDate, "dd/MM/yyyy")} - ${format(
                      endDate,
                      "dd/MM/yyyy"
                    )}`
                  : "Todo el historial"}
              </p>
            </div>
            {summary && startDate && endDate ? (
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Ventas</p>
                  <p className="font-semibold text-[#7B4397]">
                    {summary.countInRange}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-semibold text-[#7B4397]">
                    {formatCurrency(summary.totalInRange)}
                  </p>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="filtro-texto" className="text-xs text-[#7B4397]">
                Buscar venta
              </Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </span>
                <Input
                  id="filtro-texto"
                  placeholder="Nº venta, cliente, DPI..."
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
              <Label className="text-xs text-[#7B4397]">Rango de fechas</Label>
              <div className="relative z-50">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
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
                  placeholderText="Seleccionar fechas"
                  className="w-full rounded-md border bg-background px-9 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-input h-9"
                  wrapperClassName="w-full"
                  popperClassName="z-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ────────────────────────────────────────────────
          VISTA DE DATOS (Híbrida: Mobile Cards / Desktop Table)
          ────────────────────────────────────────────────
      */}
      {isLoadingVentas ? (
        <div className="text-center py-10 text-muted-foreground">
          Cargando ventas...
        </div>
      ) : ventas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground border rounded-lg bg-muted/10">
          No se encontraron ventas con los filtros actuales
        </div>
      ) : (
        <>
          {/* --- VISTA MÓVIL (Cards) --- */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {ventas.map((venta) => (
              <Card key={venta.id} className="overflow-hidden">
                <CardHeader className="bg-[#7B4397]/10 p-3 pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-bold text-[#7B4397]">
                      Venta #{venta.id}
                    </CardTitle>
                    <span className="text-xs text-muted-foreground font-medium bg-background px-2 py-1 rounded border">
                      {formatearFecha(venta.fechaVenta)}
                    </span>
                  </div>
                  <CardDescription className="text-xs truncate">
                    {venta.cliente?.nombre ||
                      venta.nombreClienteFinal ||
                      "Consumidor Final"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <div className="flex justify-between items-baseline mb-3 mt-2">
                    <span className="text-sm text-muted-foreground">
                      Total:
                    </span>
                    <span className="text-xl font-bold text-[#7B4397]">
                      {formatCurrency(venta.totalVenta)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* Botón Ver Detalles */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full bg-transparent"
                        >
                          <Eye className="h-4 w-4 mr-1" /> Ver
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-2xl rounded-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <ScrollArea className="flex-1 pr-2">
                          <DetallesVenta venta={venta} />
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                    {/* Botón Imprimir */}
                    <Link
                      to={`/venta/generar-factura/${venta.id}`}
                      className="w-full"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                      >
                        <FileText className="h-4 w-4 mr-1" /> PDF
                      </Button>
                    </Link>
                    {/* Botón Eliminar */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full"
                      disabled={isDeleteDisabled(venta)}
                      onClick={() => prepareDelete(venta)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* --- VISTA DESKTOP (Table) --- */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <ScrollArea className="h-[60vh] w-full">
                <div className="min-w-[720px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#7B4397]">ID</TableHead>
                        <TableHead className="text-[#7B4397]">
                          Cliente
                        </TableHead>
                        <TableHead className="text-[#7B4397]">Fecha</TableHead>
                        <TableHead className="text-[#7B4397]">Total</TableHead>
                        <TableHead className="text-center text-[#7B4397]">
                          Detalles
                        </TableHead>
                        <TableHead className="text-center text-[#7B4397]">
                          Imprimir
                        </TableHead>
                        <TableHead className="text-center text-[#7B4397]">
                          Eliminar
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventas.map((venta) => (
                        <TableRow key={venta.id}>
                          <TableCell className="font-medium text-[#7B4397]">
                            #{venta.id}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {venta.cliente
                              ? venta.cliente.nombre
                              : venta.nombreClienteFinal || "CF"}
                          </TableCell>
                          <TableCell>
                            {formatearFecha(venta.fechaVenta)}
                          </TableCell>
                          <TableCell className="font-semibold text-[#7B4397]">
                            {formatCurrency(venta.totalVenta)}
                          </TableCell>
                          {/* Acciones Desktop */}
                          <TableCell className="text-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Eye className="h-4 w-4 text-[#7B4397]" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DetallesVenta venta={venta} />
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    to={`/venta/generar-factura/${venta.id}`}
                                  >
                                    <Button variant="ghost" size="icon">
                                      <FileText className="h-4 w-4 text-[#7B4397]" />
                                    </Button>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Imprimir</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-center">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isDeleteDisabled(venta)}
                                    onClick={() => prepareDelete(venta)}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Eliminar</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal eliminar (Compartido) */}
      <Dialog onOpenChange={setIsOpenDelete} open={isOpenDelete}>
        <DialogContent className="max-w-[90vw] sm:max-w-lg rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-[#7B4397]">
              Eliminar Venta
            </DialogTitle>
            <DialogDescription className="text-center">
              Esta acción es irreversible y afectará el balance de la sucursal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs">Motivo de eliminación</Label>
              <Textarea
                placeholder="Ej. Error de facturación..."
                value={ventaEliminar.motivo}
                onChange={handleChangeTextAreaMotivo}
                className="resize-none"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Contraseña de administrador</Label>
              <Input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="********"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              className="w-full"
              onClick={() => setIsOpenDelete(false)}
              variant={"outline"}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              className="w-full"
              variant={"destructive"}
              onClick={handleDeleteSale}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {totalItems > 0 && (
        <div className="flex items-center justify-center py-2">
          <div className="flex items-center gap-1 flex-wrap justify-center">
            {/* First Page */}
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleChangePage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>

            {/* Previous Page */}
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleChangePage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {generatePageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    className={`h-8 w-8 ${
                      currentPage === page
                        ? "bg-[#7B4397] hover:bg-[#7B4397]/90"
                        : ""
                    }`}
                    onClick={() => handleChangePage(page as number)}
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            {/* Mobile page indicator */}
            <div className="sm:hidden flex items-center px-3 text-sm font-medium">
              {currentPage} / {totalPages}
            </div>

            {/* Next Page */}
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleChangePage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Last Page */}
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-transparent"
              onClick={() => handleChangePage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
