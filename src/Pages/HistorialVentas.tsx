import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  // FileSpreadsheet,
  FileText,
  // Ticket,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Importa los tipos
import type {
  VentasHistorial,
  Venta,
  ProductoVenta,
} from "../Types/SalesHistory/HistorialVentas";
import axios from "axios";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  // PaginationEllipsis,
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
const API_URL = import.meta.env.VITE_API_URL;

import DatePicker, { registerLocale } from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import { useStore } from "@/components/Context/ContextSucursal";
import { Textarea } from "@/components/ui/textarea";
registerLocale("es", es);

interface Producto {
  productoId: number;
  cantidad: number;
  precioVenta: number;
}

interface VentaToDelete {
  sucursalId: number;
  ventaId: number;
  usuarioId: number;
  motivo: string;
  totalVenta: number;
  clienteId: number;
  productos: Producto[];
}

export default function HistorialVentas() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const userRol = useStore((state) => state.userRol) ?? "VENDEDOR";
  const [ventaEliminar, setVentaEliminar] = useState<VentaToDelete>({
    usuarioId: 0,
    motivo: "",
    totalVenta: 0,
    clienteId: 0,
    productos: [],
    ventaId: 0,
    sucursalId: sucursalId,
  });

  const [startDate, setStartDate] = useState<Date | undefined>(undefined);

  const [filtroVenta, setFiltroVenta] = useState("");
  const [ventas, setVentas] = useState<VentasHistorial>([]);
  const formatearFecha = (fecha: string) => {
    return format(new Date(fecha), "dd/MM/yyyy", { locale: es });
  };

  const getVentas = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/venta/find-my-sucursal-sales/${sucursalId}`
      );
      if (response.status === 200) {
        setVentas(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("No hay ventas disponibles");
    }
  };

  useEffect(() => {
    if (sucursalId) {
      getVentas();
    }
  }, [sucursalId]);

  console.log("Las ventas en el historial ventas son: ", ventas);

  const DetallesVenta = ({ venta }: { venta: Venta }) => (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle>Detalles de la Venta #{venta?.id || "N/A"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
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
              unidades de {venta?.productos?.length || "0"} Productos
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Cliente</h3>
            {venta?.cliente ? (
              <>
                <p>Nombre: {venta.cliente.nombre || "N/A"}</p>
                {/* <p>Correo: {venta.cliente.correo || "N/A"}</p> */}
                <p>Teléfono: {venta.cliente.telefono || "N/A"}</p>
                <p>DPI: {venta.cliente.dpi || "N/A"}</p>
                <p>Direccion: {venta.cliente.direccion || "N/A"}</p>
              </>
            ) : (
              <>
                <p>Nombre: {venta?.nombreClienteFinal || "CF"}</p>
                {/* <p>Teléfono: {venta?.telefonoClienteFinal || "N/A"}</p> */}
                {/* <p>Dirección: {venta?.direccionClienteFinal || "N/A"}</p> */}
              </>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h3 className="font-semibold">Productos</h3>
          {/* Aquí limito la altura de la tabla y agrego scroll */}
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
                      <TableCell>
                        {producto.producto?.nombre || "N/A"}
                      </TableCell>
                      <TableCell>{producto.cantidad || "N/A"}</TableCell>
                      <TableCell>
                        {producto.precioVenta !== undefined
                          ? new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(producto.precioVenta)
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {producto.cantidad !== undefined &&
                        producto.precioVenta !== undefined
                          ? new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(producto.cantidad * producto.precioVenta)
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
              ? new Intl.NumberFormat("es-GT", {
                  style: "currency",
                  currency: "GTQ",
                }).format(venta.totalVenta)
              : "N/A"}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  console.log(
    "Las fechas de las ventas son: ",
    ventas.map((venta) => venta.fechaVenta)
  );

  const filter = ventas
    .filter((venta) => {
      // Convertir la fecha de la venta a formato sin hora
      const ventaFecha = new Date(venta.fechaVenta);
      // Eliminar la hora de la fecha seleccionada
      const fechaSeleccionada =
        startDate && new Date(startDate).setHours(0, 0, 0, 0); // Solo la fecha sin la hora
      const ventaFechaSinHora = ventaFecha.setHours(0, 0, 0, 0); // Solo la fecha sin la hora

      // Compara solo las fechas sin tener en cuenta la hora
      const fechaCoincide = fechaSeleccionada
        ? fechaSeleccionada === ventaFechaSinHora
        : true; // Si no hay fecha seleccionada, no se aplica filtro

      // Filtra por nombre, teléfono, dpi, dirección o id, y también por fecha si se selecciona
      return (
        (venta.cliente?.nombre
          .trim()
          .toLowerCase()
          .includes(filtroVenta.trim().toLowerCase()) ||
          venta.cliente?.telefono
            .trim()
            .toLowerCase()
            .includes(filtroVenta.trim().toLowerCase()) ||
          venta.cliente?.dpi
            .trim()
            .toLowerCase()
            .includes(filtroVenta.trim().toLowerCase()) ||
          venta.cliente?.direccion
            .trim()
            .toLowerCase()
            .includes(filtroVenta.trim().toLowerCase()) ||
          venta.cliente?.id
            .toString()
            .trim()
            .toLowerCase()
            .includes(filtroVenta.trim().toLowerCase()) ||
          venta.id
            .toString()
            .trim()
            .toLowerCase()
            .includes(filtroVenta.trim().toLowerCase())) &&
        fechaCoincide
      );
    })
    .sort((a, b) => {
      const fechaA = new Date(a.fechaVenta).getTime();
      const fechaB = new Date(b.fechaVenta).getTime();
      return fechaB - fechaA;
    });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(filter.length / itemsPerPage);

  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = filter.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  console.log("LA FECHA SELECCIONADA ES: ", startDate);
  const userId = useStore((state) => state.userId) ?? 0;

  console.log("La venta para eliminar seleccionada es: ", ventaEliminar);

  const [isOpenDelete, setIsOpenDelete] = useState(false); // Estado del modal
  const [isDeleting, setIsDeleting] = useState(false); // Estado para deshabilitar el botón

  const handleDeleteSale = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validaciones básicas
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

    setIsDeleting(true); // Deshabilitar el botón mientras se procesa la solicitud
    try {
      const response = await axios.post(`${API_URL}/sale-deleted`, {
        ...ventaEliminar,
        adminPassword, // Enviar la contraseña junto con los datos
      });

      if (response.status === 201) {
        console.log("Lo que devuele el servidor es: ", response.data);

        toast.success("Venta eliminada exitosamente");
        setIsOpenDelete(false); // Cerrar el modal después de eliminar
        setVentaEliminar({
          usuarioId: userId,
          motivo: "",
          totalVenta: 0,
          clienteId: 0,
          productos: [],
          ventaId: 0,
          sucursalId,
        }); // Reiniciar el estado de la venta
        setAdminPassword(""); // Limpiar la contraseña
        getVentas();
        setTimeout(() => {
          setIsDeleting(false); // Habilitar el botón nuevamente
        }, 1000);
      }
    } catch (error) {
      toast.error("Ocurrió un error al eliminar la venta");
      setIsDeleting(false); // Habilitar el botón nuevamente
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

  const [adminPassword, setAdminPassword] = useState("");
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Historial de Ventas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Input
          placeholder="Filtrar por número de venta, nombre, teléfono, dpi, dirección"
          value={filtroVenta}
          onChange={(e) => setFiltroVenta(e.target.value)}
        />
        <div className="w-full md:w-1/2">
          <DatePicker
            locale="es"
            selected={startDate}
            onChange={(date) => {
              setStartDate(date || undefined);
            }}
            className="w-full px-4 py-2 border rounded-md bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500"
            isClearable
            placeholderText="Seleccionar una fecha"
          />
        </div>
      </div>
      <Card className="shadow-xl">
        <CardContent>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Venta</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Acciones</TableHead>
                  <TableHead>Impresiones</TableHead>
                  {/* <TableHead>Ticket</TableHead> */}

                  <TableHead>Eliminar</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {currentItems.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell>#{venta.id}</TableCell>
                    <TableCell>
                      {venta.cliente
                        ? venta.cliente.nombre
                        : venta.nombreClienteFinal
                        ? venta.nombreClienteFinal
                        : "CF"}
                    </TableCell>
                    <TableCell>{formatearFecha(venta.fechaVenta)}</TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(venta.totalVenta)}
                    </TableCell>

                    {/* Acciones de venta */}
                    <TableCell>
                      <div className="flex space-x-2">
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
                          <DialogContent className="w-full justify-center items-center max-w-2xl">
                            <DetallesVenta venta={venta} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>

                    {/* Botones de impresión */}
                    <TableCell>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link to={`/venta/generar-factura/${venta.id}`}>
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

                        {/* <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Link
                                to={`/garantía/generar-garantía/${venta.id}`}
                              >
                                <Button
                                  variant="outline"
                                  size="icon"
                                  aria-label="Imprimir Garantía"
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Imprimir Garantía</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider> */}

                        {/* GENERAR EL TICKET */}
                      </div>
                    </TableCell>

                    {/* <TableCell className="flex justify-center items-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Link to={`/ticket/generar-ticket/${venta.id}`}>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label="Imprimir Garantía"
                              >
                                <Ticket className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Generar Ticket</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell> */}

                    {/* GENERAR EL TICKER */}

                    {/* Eliminar registro */}
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
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
                                  ventaId: venta?.id,
                                  clienteId: Number(venta?.cliente?.id),
                                  productos:
                                    venta?.productos?.map((prod) => ({
                                      cantidad: prod.cantidad,
                                      precioVenta: prod.precioVenta,
                                      productoId: prod.productoId,
                                    })) || [],
                                  totalVenta: venta?.totalVenta,
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
                            <p>Eliminar Registro</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>

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
            <div className="">
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
              ></Input>
            </div>
            <div className="flex gap-2">
              {/* Botón para cancelar */}
              <Button
                className="w-full"
                onClick={() => setIsOpenDelete(false)}
                variant={"destructive"}
                disabled={isDeleting} // Deshabilitar si está eliminando
              >
                Cancelar
              </Button>

              {/* Botón para confirmar eliminación */}
              <Button
                className="w-full"
                variant={"default"}
                onClick={handleDeleteSale}
                disabled={isDeleting} // Deshabilitar mientras se procesa la solicitud
              >
                {isDeleting ? "Eliminando..." : "Sí, continúa y elimina"}{" "}
                {/* Texto dinámico */}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button onClick={() => onPageChange(1)}>Primero</Button>
              </PaginationItem>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </PaginationPrevious>
              </PaginationItem>

              {/* Sistema de truncado */}
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
                  variant={"destructive"}
                  onClick={() => onPageChange(totalPages)}
                >
                  Último
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </Card>
    </div>
  );
}
