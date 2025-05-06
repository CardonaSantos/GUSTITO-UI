import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  User,
  Package,
  Trash2,
  AlertCircle,
  Tag,
  FileText,
  Building,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
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

dayjs.extend(localizedFormat);
dayjs.locale("es");

function formatearFechaUTC(fecha: string) {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
}

type Item = {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
};

type Usuario = {
  id: number;
  nombre: string;
  rol: string;
};

type Sucursal = {
  id: number;
  nombre: string;
};

type EliminacionStock = {
  id: number;
  fechaHora: string;
  motivo: string;
  tipo: "producto" | "empaque";
  item: Item;
  usuario: Usuario;
  sucursal: Sucursal;
};

const API_URL = import.meta.env.VITE_API_URL;

const InfoField = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="flex items-start space-x-2 p-2">
    <div className="w-5 h-5 flex-shrink-0">{icon}</div>
    <div className="flex flex-col">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  </div>
);

export default function StockEliminaciones() {
  const [selectedItem, setSelectedItem] = useState<EliminacionStock | null>(
    null
  );
  const [stockEliminaciones, setStockEliminaciones] = useState<
    EliminacionStock[]
  >([]);

  useEffect(() => {
    const getRegists = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/stock-remove/get-stock-remove-regists`
        );
        if (response.status === 200) {
          setStockEliminaciones(response.data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al conseguir los registros");
      }
    };
    getRegists();
  }, []);

  console.log("Los registros son: ", stockEliminaciones);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(stockEliminaciones.length / itemsPerPage);

  const currentItems = stockEliminaciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const onPageChange = (page: number) => setCurrentPage(page);

  return (
    <div className="container mx-auto py-10">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle>Registros de eliminaciones de Stock</CardTitle>
          <CardDescription>Incluye productos y empaques</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Sucursal</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>#{item.id}</TableCell>
                  <TableCell>{item?.item?.nombre}</TableCell>
                  <TableCell>
                    {item.tipo === "producto" ? (
                      <Package className="w-4 h-4 inline mr-1" />
                    ) : (
                      <Boxes className="w-4 h-4 inline mr-1" />
                    )}
                    {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                  </TableCell>
                  <TableCell>{formatearFechaUTC(item.fechaHora)}</TableCell>
                  <TableCell>{item.usuario.nombre}</TableCell>
                  <TableCell>{item.sucursal.nombre}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedItem(item)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Detalles
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[550px]">
                        <DialogHeader className="text-center">
                          <DialogTitle className="text-2xl font-bold">
                            Detalles de Eliminación
                          </DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                          <ScrollArea className="max-h-[27rem]">
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                  icon={<Package className="w-5 h-5" />}
                                  label="Nombre"
                                  value={selectedItem.item.nombre}
                                />
                                <InfoField
                                  icon={<Tag className="w-5 h-5" />}
                                  label="Código"
                                  value={selectedItem.item.codigoProducto}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                  icon={<FileText className="w-5 h-5" />}
                                  label="Descripción"
                                  value={selectedItem.item.descripcion}
                                />
                                <InfoField
                                  icon={<Calendar className="w-5 h-5" />}
                                  label="Fecha"
                                  value={formatearFechaUTC(
                                    selectedItem.fechaHora
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <InfoField
                                  icon={<User className="w-5 h-5" />}
                                  label="Usuario"
                                  value={`${selectedItem.usuario.nombre} (${selectedItem.usuario.rol})`}
                                />
                                <InfoField
                                  icon={<Building className="w-5 h-5" />}
                                  label="Sucursal"
                                  value={selectedItem.sucursal.nombre}
                                />
                              </div>
                              <InfoField
                                icon={<AlertCircle className="w-5 h-5" />}
                                label="Motivo"
                                value={selectedItem.motivo || "No especificado"}
                              />
                            </div>
                          </ScrollArea>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
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
                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(currentPage - page) <= 1
                  )
                  .map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={page === currentPage}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
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
