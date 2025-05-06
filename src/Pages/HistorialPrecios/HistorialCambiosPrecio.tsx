import { useState, useEffect } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Tag,
  Calendar,
  User,
  Eye,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
  Percent,
  Building,
  MapPin,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Tipos
type Sucursal = {
  nombre: string;
  id: number;
  direccion: string;
};

type Usuario = {
  nombre: string;
  id: number;
  rol: string;
  sucursal: Sucursal;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  precioCostoActual: number;
};

type CambioPrecio = {
  id: number;
  productoId: number;
  precioCostoAnterior: number;
  precioCostoNuevo: number;
  fechaCambio: string;
  modificadoPorId: number;
  modificadoPor: Usuario;
  producto: Producto;
};

const API_URL = import.meta.env.VITE_API_URL;

export default function HistorialCambiosPrecio() {
  const [cambios, setCambios] = useState<CambioPrecio[]>([]);
  const [selectedCambio, setSelectedCambio] = useState<CambioPrecio | null>(
    null
  );

  useEffect(() => {
    // Simular la obtención de datos
    const fetchData = async () => {
      // Aquí normalmente harías una llamada a tu API
      const response = await fetch(`${API_URL}/products/historial-price`);
      const data = await response.json();
      setCambios(data);
    };

    fetchData();
  }, []);

  // Función para formatear la fecha
  const formatDate = (date: string) => {
    return format(new Date(date), "dd 'de' MMMM 'de' yyyy, HH:mm", {
      locale: es,
    });
  };

  // Función para calcular el porcentaje de cambio
  const calcularPorcentajeCambio = (anterior: number, nuevo: number) => {
    const porcentaje = ((nuevo - anterior) / anterior) * 100;
    return porcentaje.toFixed(2);
  };

  console.log("LOS CAMBIOS SON: ", cambios);

  // Componente para mostrar los detalles del cambio de precio
  function CambioDetails({ cambio }: { cambio: CambioPrecio }) {
    return (
      <ScrollArea className="h-[400px] w-full pr-4 [&>div]:!block">
        <div className="space-y-6">
          <div className="rounded-lg p-4 border border-border">
            <h3 className="mb-3 flex items-center text-lg font-semibold text-primary/80 dark:text-primary/70 dark:text-white">
              <Package className="mr-2" size={20} />
              Información del Producto
            </h3>
            <div className="grid gap-2">
              <p className="flex items-center">
                <span className="font-medium">Nombre:</span>
                <span className="ml-2">{cambio.producto.nombre}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium">Código:</span>
                <span className="ml-2">{cambio.producto.codigoProducto}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium">Descripción:</span>
                <span className="ml-2">{cambio.producto.descripcion}</span>
              </p>
            </div>
          </div>

          <div className="rounded-lg p-4 border border-border">
            <h3 className="mb-3 flex items-center text-lg font-semibold text-primary/80 dark:text-primary/70 dark:text-white">
              <Calendar className="mr-2" size={20} />
              Detalles del Cambio
            </h3>
            <div className="grid gap-2">
              <p className="flex items-center">
                <span className="font-medium">Fecha del Cambio:</span>
                <span className="ml-2">{formatDate(cambio.fechaCambio)}</span>
              </p>
              <p className="flex items-center">
                <DollarSign className="mr-1" size={16} />
                <span className="font-medium">Precio Costo Anterior:</span>
                <span className="ml-2">
                  {new Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(cambio.precioCostoAnterior)}
                </span>
              </p>
              <p className="flex items-center">
                <DollarSign className="mr-1" size={16} />
                <span className="font-medium">Precio Costo Nuevo:</span>
                <span className="ml-2">
                  {new Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(cambio.precioCostoNuevo)}
                </span>
              </p>
              <p className="flex items-center">
                <Percent className="mr-1" size={16} />
                <span className="font-medium">Porcentaje de Cambio:</span>
                <span className="ml-2">
                  {calcularPorcentajeCambio(
                    cambio.precioCostoAnterior,
                    cambio.precioCostoNuevo
                  )}
                  %
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-lg p-4 border border-border">
            <h3 className="mb-3 flex items-center text-lg font-semibold text-primary/80 dark:text-primary/70">
              <User className="mr-2" size={20} />
              Modificado Por
            </h3>
            <div className="grid gap-2">
              <p className="flex items-center">
                <span className="font-medium">Nombre:</span>
                <span className="ml-2">{cambio.modificadoPor.nombre}</span>
              </p>
              <p className="flex items-center">
                <span className="font-medium">Rol:</span>
                <span className="ml-2">{cambio.modificadoPor.rol}</span>
              </p>
              <p className="flex items-center">
                <Building className="mr-1" size={16} />
                <span className="font-medium">Sucursal:</span>
                <span className="ml-2">
                  {cambio.modificadoPor.sucursal.nombre}
                </span>
              </p>
              <p className="flex items-center">
                <MapPin className="mr-1" size={16} />
                <span className="font-medium">Dirección de Sucursal:</span>
                <span className="ml-2">
                  {cambio.modificadoPor.sucursal.direccion}
                </span>
              </p>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(cambios.length / itemsPerPage);

  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = cambios.slice(indexOfFirstItem, indexOfLastItem);

  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Historial de Cambios de Precio</CardTitle>
          <CardDescription>
            Estos son registros de cambios de precio que han tenido los
            productos{" "}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Fecha de Cambio</TableHead>
                <TableHead>Precio Anterior</TableHead>
                <TableHead>Precio Nuevo</TableHead>
                {/* <TableHead>% Cambio</TableHead> */}
                <TableHead>Modificado Por</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((cambio) => (
                <TableRow key={cambio.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <Tag className="mr-2" size={16} />
                      {cambio.producto.nombre}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-2" size={16} />
                      {formatDate(cambio.fechaCambio)}
                    </div>
                  </TableCell>
                  <TableCell>
                    Q{cambio.precioCostoAnterior.toFixed(2)}
                  </TableCell>
                  <TableCell>Q{cambio.precioCostoNuevo.toFixed(2)}</TableCell>
                  {/* <TableCell>
              
                <Badge
                  className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    cambio.precioCostoNuevo > cambio.precioCostoAnterior
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <ArrowUpDown className="mr-1" size={14} />
                  {calcularPorcentajeCambio(
                    cambio.precioCostoAnterior,
                    cambio.precioCostoNuevo
                  )}
                  %
                </Badge>
              </TableCell> */}
                  <TableCell>
                    <div className="flex items-center">
                      <User className="mr-2" size={16} />
                      {cambio.modificadoPor.nombre} ({cambio.modificadoPor.rol})
                    </div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedCambio(cambio)}
                        >
                          <Eye className="mr-2" size={16} />
                          Ver Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>
                            Detalles del Cambio de Precio
                          </DialogTitle>
                        </DialogHeader>
                        {selectedCambio && (
                          <CambioDetails cambio={selectedCambio} />
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <CardFooter className="flex justify-center items-center">
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
                        <PaginationLink
                          onClick={() => onPageChange(totalPages)}
                        >
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
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
}
