import { useEffect, useState } from "react";
import {
  Package,
  Calendar,
  Eye,
  Building,
  Coins,
  User2Icon,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  MapPinIcon,
  PackageIcon,
} from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "axios";
import { useStore } from "@/components/Context/ContextSucursal";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale("es");

// Tipos

type Producto = {
  nombre: string;
  codigoProducto: string;
};

type Empaque = {
  nombre: string;
  codigoProducto: string;
};

type Sucursal = {
  id: number;
  nombre: string;
  direccion: string;
};

type Usuario = {
  id: number;
  nombre: string;
  rol: string;
};

type Proveedor = {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
};

type StockEntregado = {
  id: number;
  productoId: number | null;
  empaqueId: number | null;
  cantidadInicial: number;
  cantidad: number;
  costoTotal: number;
  creadoEn: string;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  precioCosto: number;
  entregaStockId: number;
  sucursalId: number;
  producto: Producto | null;
  empaque: Empaque | null;
  sucursal: Sucursal;
};

type EntregaStock = {
  id: number;
  proveedorId: number;
  montoTotal: number;
  fechaEntrega: string;
  recibidoPorId: number;
  sucursalId: number;
  proveedor: Proveedor;
  usuarioRecibido: Usuario;
  stockEntregado: StockEntregado[];
  sucursal: Sucursal;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function EntregasStock() {
  const sucursalID = useStore((state) => state.sucursalId);
  const [entregas, setEntregas] = useState<EntregaStock[]>([]);
  const [selectedEntrega, setSelectedEntrega] = useState<EntregaStock | null>(
    null
  );

  const formatDate = (date: string) => {
    return dayjs(date).format("DD/MM/YYYY h:mm A");
  };

  const getEntregasRegist = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/entrega-stock/get-my-delivery-stock/${sucursalID}`
      );
      if (response.status === 200) {
        setEntregas(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir los registros de entregas");
    }
  };

  useEffect(() => {
    if (sucursalID) getEntregasRegist();
  }, [sucursalID]);

  const EntregaDetails = ({ entrega }: { entrega: EntregaStock }) => (
    <ScrollArea className="h-[calc(100vh-180px)] w-full">
      <div className="p-6 space-y-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              Información General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm font-medium">ID de Entrega</p>
                <p className="text-2xl font-bold">#{entrega.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Monto Total</p>
                <p className="text-2xl font-bold">
                  {Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(entrega.montoTotal)}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium">Fecha de Entrega</p>
                <p className="text-lg flex items-center">
                  <CalendarIcon className="mr-2" size={16} />
                  {formatDate(entrega.fechaEntrega)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <UserIcon className="mr-2" size={20} /> Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{entrega.proveedor.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Correo: {entrega.proveedor.correo}
              </p>
              <p className="text-sm text-muted-foreground flex items-center mt-1">
                <PhoneIcon className="mr-2" size={14} />
                {entrega.proveedor.telefono}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg font-semibold">
                <MapPinIcon className="mr-2" size={20} /> Sucursal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{entrega.sucursal.nombre}</p>
              <p className="text-sm text-muted-foreground">
                {entrega.sucursal.direccion}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <UserIcon className="mr-2" size={20} /> Recibido Por
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{entrega.usuarioRecibido.nombre}</p>
            <Badge variant="secondary" className="mt-1">
              {entrega.usuarioRecibido.rol}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg font-semibold">
              <PackageIcon className="mr-2" size={20} />
              Stock Entregado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {entrega.stockEntregado.map((stock) => (
                <div key={stock.id} className="bg-muted p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">
                    {stock.producto?.nombre || stock.empaque?.nombre || "N/A"}
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold">
                    <p>
                      <span className="font-medium">Cantidad Registrada:</span>{" "}
                      {stock.cantidadInicial ?? "N/A"}
                    </p>
                    <p>
                      <span className="font-medium">Código:</span>{" "}
                      {stock.producto?.codigoProducto ||
                        stock.empaque?.codigoProducto ||
                        "N/A"}
                    </p>

                    <p>
                      <span className="font-medium">Cantidad Actual:</span>{" "}
                      {stock.cantidad}
                    </p>
                    <p>
                      <span className="font-medium">Costo Total:</span> Q
                      {stock.costoTotal.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium">Precio Costo:</span> Q
                      {stock.precioCosto.toFixed(2)}
                    </p>
                    <p className="col-span-2">
                      <span className="font-medium">Fecha de Ingreso:</span>{" "}
                      {formatDate(stock.fechaIngreso)}
                    </p>
                    <p className="col-span-2">
                      <span className="font-medium">Fecha de Vencimiento:</span>{" "}
                      {stock.fechaVencimiento
                        ? formatDate(stock.fechaVencimiento)
                        : "N/A"}
                    </p>
                    <p>
                      <Badge variant="outline">
                        {stock.producto ? "Producto" : "Empaque"}
                      </Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(entregas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = entregas.slice(indexOfFirstItem, indexOfLastItem);
  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Registros de entrada de Stocks</CardTitle>
          <CardDescription>Historial de entrada </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entrega</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha de Entrega</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead>Total Items</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto Total</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((entrega) => {
                const tipo = entrega.stockEntregado.every(
                  (item) => item.producto
                )
                  ? "Producto"
                  : entrega.stockEntregado.every((item) => item.empaque)
                  ? "Empaque"
                  : "Mixto";
                return (
                  <TableRow key={entrega.id}>
                    <TableCell>#{entrega.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User2Icon className="mr-2" size={16} />
                        {entrega.proveedor.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2" size={16} />
                        {formatDate(entrega.fechaEntrega)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="mr-2" size={16} />
                        {entrega.sucursal.nombre}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Package className="mr-2" size={16} />
                        {entrega.stockEntregado.reduce(
                          (total, prod) => total + prod.cantidadInicial,
                          0
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Coins className="mr-2" size={16} />
                        {new Intl.NumberFormat("es-GT", {
                          style: "currency",
                          currency: "GTQ",
                        }).format(entrega.montoTotal)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedEntrega(entrega)}
                          >
                            <Eye className="mr-2" size={16} /> Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-0">
                          <DialogHeader className="p-6 pb-0">
                            <DialogTitle>
                              Detalles de la Entrega #{entrega.id}
                            </DialogTitle>
                          </DialogHeader>
                          {selectedEntrega && (
                            <EntregaDetails entrega={selectedEntrega} />
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
                    onClick={() => onPageChange(totalPages)}
                  >
                    Último
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
