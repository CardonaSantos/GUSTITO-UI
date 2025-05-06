import { useEffect, useState } from "react";
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
  Barcode,
  Box,
  ChevronLeft,
  ChevronRight,
  Coins,
  Edit,
  Eye,
  FileText,
  List,
  Tag,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useStore } from "@/components/Context/ContextSucursal";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_URL = import.meta.env.VITE_API_URL;

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs.utc(fecha).format("DD/MM/YYYY");
};

interface ProductCreate {
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  precioVenta: number | null;
  creadoPorId: number | null;
  precioCosto: number | null;
}

interface Categorias {
  id: number;
  nombre: string;
}

type ProductoEmpaque = {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  precioCosto: number | null;
  precioVenta: number | null;
  stock: {
    id: number;
    cantidad: number;
    fechaIngreso: string;
    sucursal: {
      id: number;
      nombre: string;
    };
  }[];
};

export default function InventarioEmpaques() {
  const userId = useStore((state) => state.userId);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [empaquesInventary, setEmpaquesInventary] = useState<ProductoEmpaque[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const getEmpaquesInventario = async () => {
    try {
      const response = await axios.get(`${API_URL}/empaque`);
      if (response.status === 200) {
        setEmpaquesInventary(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener los empaques");
    }
  };

  useEffect(() => {
    getEmpaquesInventario();
  }, []);

  const filteredEmpaques = empaquesInventary.filter((empaque) => {
    return (
      empaque.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empaque.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedEmpaques = [...filteredEmpaques].sort((a, b) => {
    if (sortBy === "quantity") {
      return sortOrder === "asc"
        ? (a.stock[0]?.cantidad || 0) - (b.stock[0]?.cantidad || 0)
        : (b.stock[0]?.cantidad || 0) - (a.stock[0]?.cantidad || 0);
    }
    if (sortBy === "price") {
      return sortOrder === "asc"
        ? (a.precioVenta ?? 0) - (b.precioVenta ?? 0)
        : (b.precioVenta ?? 0) - (a.precioVenta ?? 0);
    }
    return 0;
  });

  const totalPages = Math.ceil(sortedEmpaques.length / itemsPerPage);
  const currentItems = sortedEmpaques.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalInventoryCount = filteredEmpaques.reduce((sum, empaque) => {
    const totalStock = empaque.stock.reduce(
      (acc, s) => acc + (s.cantidad || 0),
      0
    );
    return sum + totalStock;
  }, 0);

  const [productCreate, setProductCreate] = useState<ProductCreate>({
    precioCosto: null,
    codigoProducto: "",
    descripcion: "",
    nombre: "",
    precioVenta: 0,
    creadoPorId: userId,
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // CREAR NUEVO PRODUCTO
  const handleAddProduct = async () => {
    console.log("Enviando...");

    if (
      !productCreate.nombre ||
      !productCreate.codigoProducto ||
      !productCreate.precioVenta
    ) {
      toast.info("Algunos campos son obligatorios");
      return;
    }

    if (!userId) {
      toast.warning("Falta informacion del usuario");
    }

    try {
      const response = await axios.post(`${API_URL}/empaque`, {
        ...productCreate,
      });

      if (response.status === 201) {
        toast.success("Producto creado");
        setProductCreate({
          codigoProducto: "",
          descripcion: "",
          nombre: "",
          precioCosto: null,
          precioVenta: null,
          creadoPorId: userId,
        });
        getEmpaquesInventario();
        setOpenCreateEmpaque(false);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al crear producto");
    }
  };

  const [openCreateEmpaque, setOpenCreateEmpaque] = useState(false);

  const [categorias, setCategorias] = useState<Categorias[]>([]);
  const [proveedores, setProveedores] = useState<SimpleProvider[]>([]);

  useEffect(() => {
    const getCategories = async () => {
      try {
        const response = await axios.get(`${API_URL}/categoria/`);
        if (response.status === 200) {
          setCategorias(response.data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al pedir categorias");
      }
    };
    getCategories();
  }, []);

  useEffect(() => {
    const getProveedores = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/proveedor/simple-proveedor`
        );
        if (response.status === 200) {
          setProveedores(response.data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al pedir categorias");
      }
    };
    getProveedores();
  }, []);

  const [productsInventary, setProductsInventary] = useState<
    ProductsInventary[]
  >([]);

  const getProductosInventario = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/products/for-inventary`
      );
      if (response.status === 200) {
        setProductsInventary(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al pedir categorias");
    }
  };

  useEffect(() => {
    getProductosInventario();
  }, []);

  //FILTER =====>

  console.log("Los productos del inventario son: ", productsInventary);
  console.log("El producto a crear es: ", productCreate);
  console.log("las categorias son: ", categorias);
  console.log("Los proveedores son: ", proveedores);
  console.log("Los precios de venta son: ", productCreate.precioVenta);

  // PAGINACIÓN

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ABRIR DIALOG DE EDICION
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmpaque, setSelectedEmpaque] =
    useState<ProductoEmpaque | null>(null);
  const [editData, setEditData] = useState({
    nombre: "",
    descripcion: "",
    codigoProducto: "",
    precioCosto: null as number | null,
    precioVenta: null as number | null,
  });

  const openEditDialog = (empaque: ProductoEmpaque) => {
    setSelectedEmpaque(empaque);
    setEditData({
      nombre: empaque.nombre,
      descripcion: empaque.descripcion,
      codigoProducto: empaque.codigoProducto,
      precioCosto: empaque.precioCosto,
      precioVenta: empaque.precioVenta,
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedEmpaque) return;
    try {
      const response = await axios.patch(
        `${API_URL}/empaque/${selectedEmpaque.id}`,
        editData
      );
      if (response.status === 200) {
        toast.success("Empaque actualizado");
        setEditDialogOpen(false);
        getEmpaquesInventario();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el empaque");
    }
  };

  return (
    <div className="container mx-auto p-4 shadow-xl">
      <h1 className="text-lg font-bold mb-4">
        Administrador de inventario de empaques
      </h1>

      <div className="bg-muted p-4 rounded-lg mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            Inventario Total: {totalInventoryCount} items
          </div>

          <Input
            type="text"
            placeholder="Buscar por nombre o código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/2 mt-2 md:mt-0"
          />
          <Barcode className="h-6 w-6 text-gray-500" />

          <div className="flex space-x-2">
            <Dialog
              open={openCreateEmpaque}
              onOpenChange={setOpenCreateEmpaque}
            >
              <Button
                onClick={() => {
                  setOpenCreateEmpaque(true);
                }}
              >
                Añadir nuevo empaque
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Añadir nuevo producto
                  </DialogTitle>
                </DialogHeader>

                <form
                  onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                    e.preventDefault();
                    handleAddProduct();
                  }}
                >
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="nombre" className="text-right">
                        Producto
                      </Label>
                      <div className="col-span-3 relative">
                        <Box className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          onChange={(e) =>
                            setProductCreate({
                              ...productCreate,
                              nombre: e.target.value,
                            })
                          }
                          value={productCreate.nombre}
                          id="nombre"
                          name="nombre"
                          placeholder="Nombre del producto"
                          className="pl-10 shadow-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="code" className="text-right">
                        Código Empaque
                      </Label>
                      <div className="col-span-3 relative">
                        <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.codigoProducto}
                          onChange={(e) =>
                            setProductCreate({
                              ...productCreate,
                              codigoProducto: e.target.value,
                            })
                          }
                          id="code"
                          name="code"
                          placeholder="Código único producto"
                          className="pl-10 shadow-sm rounded-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="desc" className="text-right">
                        Descripción
                      </Label>
                      <div className="col-span-3 relative">
                        <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Textarea
                          value={productCreate.descripcion}
                          onChange={(e) =>
                            setProductCreate({
                              ...productCreate,
                              descripcion: e.target.value,
                            })
                          }
                          placeholder="Breve descripción..."
                          id="desc"
                          name="desc"
                          className="pl-10 shadow-sm rounded-md"
                        />
                      </div>
                    </div>

                    {/* NUEVO CAMPO PARA PRECIO COSTO */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="precioCosto" className="text-right">
                        Precio Costo
                      </Label>
                      <div className="col-span-3 relative">
                        {/* Icono de dólar */}
                        <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.precioCosto ?? ""}
                          onChange={(e) =>
                            setProductCreate({
                              ...productCreate,
                              precioCosto: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          id="precioCosto"
                          name="precioCosto"
                          type="number"
                          step="1"
                          placeholder="Precio costo del producto"
                          className="pl-10 shadow-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Input for Price 1 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="precioVenta" className="text-right">
                        Precio Venta
                      </Label>
                      <div className="col-span-3 relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.precioVenta || ""} // If no value exists, show empty string
                          onChange={(e) =>
                            setProductCreate((previaData) => ({
                              ...previaData,
                              precioVenta: parseInt(e.target.value),
                            }))
                          } // Update the first price
                          id="precioVenta"
                          name="precioVenta"
                          type="number"
                          step="1"
                          placeholder="0.00"
                          className="pl-10 shadow-sm rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Añadir Producto</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Empaque</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                Cantidad en Stock
              </TableHead>

              <TableHead
                className="cursor-pointer"
                // onClick={() => handleSort("quantity")}
              >
                Fecha ingreso
              </TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Precio por unidad
              </TableHead>
              <TableHead>Info</TableHead>
              <TableHead>En sucursales</TableHead>
              <TableHead>Acciónes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((empaque) => (
              <TableRow key={empaque.id}>
                <TableCell>{empaque.nombre}</TableCell>
                <TableCell>
                  {empaque.stock.length > 0 ? (
                    empaque.stock.map((s) => (
                      <span key={s.id} className="font-bold ml-2">
                        {s.cantidad}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Sin stock</p>
                  )}
                </TableCell>

                <TableCell>
                  {empaque.stock.map((stock) => {
                    return (
                      <div className="text-xs hover:text-blue-600 cursor-pointer">
                        <Link to={`/stock-empaque-edicion/${stock.id}`}>
                          <span>{formatearFecha(stock.fechaIngreso)}</span>
                        </Link>
                      </div>
                    );
                  })}
                </TableCell>

                <TableCell>
                  {empaque.precioVenta != null
                    ? new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(empaque.precioVenta)
                    : "N/A"}
                </TableCell>
                <TableCell>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye size={16} />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-4">
                      <p className="text-sm text-muted-foreground mt-2">
                        {empaque.descripcion || "No hay descripción disponible"}
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>

                <TableCell>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline" size="sm">
                        <List size={16} />
                      </Button>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-4">
                      <h4 className="text-sm font-semibold">
                        Stocks en sucursales
                      </h4>
                      <div className="mt-2 space-y-2">
                        {Object.values(
                          empaque.stock.reduce((acc, stock) => {
                            const sucursalNombre = stock?.sucursal?.nombre;

                            if (!acc[sucursalNombre]) {
                              acc[sucursalNombre] = {
                                nombre: sucursalNombre,
                                cantidad: 0,
                              };
                            }

                            acc[sucursalNombre].cantidad += stock.cantidad;
                            return acc;
                          }, {} as Record<string, { nombre: string; cantidad: number }>)
                        ).map((sucursal) => (
                          <div
                            key={sucursal?.nombre}
                            className="flex justify-between border rounded px-3 py-1 shadow-sm bg-gray-100 dark:bg-transparent"
                          >
                            <p className="font-medium">{sucursal.nombre}</p>
                            <p className="text-right">
                              {sucursal?.cantidad} uds
                            </p>
                          </div>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </TableCell>

                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => openEditDialog(empaque)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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

      {/* DIALOG DE EDICION DE EMPQUE */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Editar empaque</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditSubmit();
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="nombre" className="text-right">
                  Nombre
                </Label>
                <div className="col-span-3">
                  <Input
                    value={editData.nombre}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        nombre: e.target.value,
                      }))
                    }
                    id="nombre"
                    placeholder="Nombre del producto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="codigoProducto" className="text-right">
                  Código
                </Label>
                <div className="col-span-3">
                  <Input
                    value={editData.codigoProducto}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        codigoProducto: e.target.value,
                      }))
                    }
                    id="codigoProducto"
                    placeholder="Código del producto"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="descripcion" className="text-right">
                  Descripción
                </Label>
                <div className="col-span-3">
                  <Input
                    value={editData.descripcion}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        descripcion: e.target.value,
                      }))
                    }
                    id="descripcion"
                    placeholder="Descripción"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="precioCosto" className="text-right">
                  Precio Costo
                </Label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={editData.precioCosto ?? ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        precioCosto: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    id="precioCosto"
                    placeholder="Precio de costo"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="precioVenta" className="text-right">
                  Precio Venta
                </Label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={editData.precioVenta ?? ""}
                    onChange={(e) =>
                      setEditData((prev) => ({
                        ...prev,
                        precioVenta: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    id="precioVenta"
                    placeholder="Precio de venta"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Guardar cambios</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
