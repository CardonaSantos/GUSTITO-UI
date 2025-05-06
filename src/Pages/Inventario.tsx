import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SelectM, { MultiValue } from "react-select"; // Importación correcta de react-select
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  ArrowDownUp,
  Barcode,
  Box,
  ChevronLeft,
  ChevronRight,
  Coins,
  Edit,
  Eye,
  FileText,
  Tag,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { toast } from "sonner";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Link } from "react-router-dom";
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

const API_URL = import.meta.env.VITE_API_URL;

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";

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
  categorias: number[];
  codigoProducto: string;
  precioVenta: number[];
  creadoPorId: number | null;
  precioCostoActual: number | null;
}

interface Categorias {
  id: number;
  nombre: string;
}

export default function Inventario() {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const userId = useStore((state) => state.userId);

  const [productCreate, setProductCreate] = useState<ProductCreate>({
    precioCostoActual: null,
    codigoProducto: "",
    categorias: [],
    descripcion: "",
    nombre: "",
    precioVenta: [],
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
      productCreate.categorias.length <= 0 ||
      !productCreate.codigoProducto ||
      !productCreate.precioVenta ||
      productCreate.precioVenta.length <= 0 ||
      !productCreate.precioCostoActual ||
      productCreate.precioCostoActual <= 0
    ) {
      toast.info("Algunos campos son obligatorios");
      return;
    }

    if (!userId) {
      toast.warning("Falta informacion del usuario");
    }

    try {
      const response = await axios.post(`${API_URL}/products`, {
        ...productCreate,
      });

      if (response.status === 201) {
        toast.success("Producto creado");
        setProductCreate({
          codigoProducto: "",
          categorias: [],
          descripcion: "",
          nombre: "",
          precioCostoActual: null,
          precioVenta: [],
          creadoPorId: userId,
        });
        getProductosInventario();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al crear producto");
    }
  };

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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // Filtrar productos antes de la paginación
  const filteredProducts = productsInventary
    .filter((product) => {
      const hasStock = product.stock.length > 0;
      const firstStock = hasStock ? product.stock : null;

      // Filtrado por nombre de producto o código de producto
      const matchesSearchTerm =
        product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtrado por categoría
      const matchesCategory =
        categoryFilter === "all" ||
        (product.categorias.length > 0 &&
          product.categorias.some((cat) => cat.nombre === categoryFilter));

      // Filtrado por proveedor
      const matchesSupplier =
        supplierFilter === "all" ||
        (firstStock &&
          firstStock.some(
            (stock) =>
              stock.entregaStock.proveedor.nombre.trim().toLocaleLowerCase() ===
              supplierFilter.trim().toLocaleLowerCase()
          ));

      // Se filtra por el término de búsqueda y luego por los demás filtros
      return matchesSearchTerm && matchesCategory && matchesSupplier;
    })
    .sort((a, b) => {
      const stockA = a.stock.length > 0 ? a.stock[0] : null;
      const stockB = b.stock.length > 0 ? b.stock[0] : null;

      // Ordenar por cantidad
      if (sortBy === "quantity") {
        return sortOrder === "asc"
          ? (stockA?.cantidad || 0) - (stockB?.cantidad || 0)
          : (stockB?.cantidad || 0) - (stockA?.cantidad || 0);
      }

      // Ordenar por precio
      if (sortBy === "price") {
        return sortOrder === "asc"
          ? a.precioVenta - b.precioVenta
          : b.precioVenta - a.precioVenta;
      }

      // Ordenar por fecha de vencimiento
      if (sortBy === "expiration") {
        const expirationA = stockA?.fechaVencimiento
          ? new Date(stockA.fechaVencimiento).getTime()
          : null;
        const expirationB = stockB?.fechaVencimiento
          ? new Date(stockB.fechaVencimiento).getTime()
          : null;

        if (!expirationA) return sortOrder === "asc" ? 1 : -1;
        if (!expirationB) return sortOrder === "asc" ? -1 : 1;

        return sortOrder === "asc"
          ? expirationA - expirationB
          : expirationB - expirationA;
      }

      return 0;
    });

  // PAGINACIÓN
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calcular el total del inventario
  const totalInventoryCount = filteredProducts.reduce((sum, product) => {
    const stockQuantity =
      product.stock.length > 0 ? product.stock[0].cantidad : 0;
    return sum + stockQuantity;
  }, 0);

  // Function to handle changes in each input dynamically
  const handlePriceChange = (index: number, value: string) => {
    const updatedPrecios = [...productCreate.precioVenta]; // Create a copy of the existing array
    updatedPrecios[index] = Number(value); // Update the price at the specific index
    setProductCreate({
      ...productCreate,
      precioVenta: updatedPrecios, // Update the state with the modified array
    });
  };

  return (
    <div className="container mx-auto p-4 shadow-xl">
      <h1 className="text-lg font-bold mb-4">Administrador de inventario</h1>
      <div className="bg-muted p-4 rounded-lg mb-4 ">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <div className="text-lg font-semibold">
            Inventario Total: {totalInventoryCount} items
          </div>
          <div className="flex space-x-2">
            <Dialog>
              <DialogTrigger>
                <Button>Añadir Producto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Añadir nuevo producto
                  </DialogTitle>
                </DialogHeader>
                {/* LA RAZÓN POR LA QUE AL USAR EL E DENTRO DE LOS SET NO DA ERROR, ES PORQUE EN EL ONSUBMIT YA LO HEMOS TIPADO */}
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

                    {/* Dropdown de categorías con selección múltiple */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="categorias" className="text-right">
                        Categoría
                      </Label>
                      <div className="col-span-3">
                        <SelectM
                          placeholder="Seleccionar categoría..."
                          isMulti
                          name="categorias"
                          options={categorias.map((categoria) => ({
                            value: categoria.id,
                            label: categoria.nombre,
                          }))}
                          className="basic-multi-select text-black"
                          classNamePrefix="select"
                          onChange={(
                            selectedOptions: MultiValue<{
                              value: number;
                              label: string;
                            }>
                          ) => {
                            const selectedIds = selectedOptions.map(
                              (option) => option.value
                            );
                            setProductCreate({
                              ...productCreate,
                              categorias: selectedIds,
                            });
                          }}
                          value={categorias
                            .filter((categoria) =>
                              productCreate.categorias.includes(categoria.id)
                            )
                            .map((categoria) => ({
                              value: categoria.id,
                              label: categoria.nombre,
                            }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="code" className="text-right">
                        Código Producto
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
                      <Label htmlFor="price1" className="text-right">
                        Precio Costo
                      </Label>
                      <div className="col-span-3 relative">
                        {/* Icono de dólar */}
                        <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.precioCostoActual ?? ""} // Si es null, asigna una cadena vacía
                          onChange={(e) =>
                            setProductCreate({
                              ...productCreate,
                              precioCostoActual: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                          id="price1"
                          name="price1"
                          type="number"
                          step="1"
                          placeholder="Precio costo del producto"
                          className="pl-10 shadow-sm rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Input for Price 1 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price1" className="text-right">
                        Precio Venta 1
                      </Label>
                      <div className="col-span-3 relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.precioVenta[0] || ""} // If no value exists, show empty string
                          onChange={(e) => handlePriceChange(0, e.target.value)} // Update the first price
                          id="price1"
                          name="price1"
                          type="number"
                          step="1"
                          placeholder="0.00"
                          className="pl-10 shadow-sm rounded-md"
                        />
                      </div>
                    </div>

                    {/* Input for Price 2 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price2" className="text-right">
                        Precio Venta 2
                      </Label>
                      <div className="col-span-3 relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.precioVenta[1] || ""} // If no value exists, show empty string
                          onChange={(e) => handlePriceChange(1, e.target.value)} // Update the second price
                          id="price2"
                          name="price2"
                          type="number"
                          step="1"
                          placeholder="0.00"
                          className="pl-10 shadow-sm rounded-md"
                        />
                      </div>
                    </div>

                    {/* Input for Price 3 */}
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="price3" className="text-right">
                        Precio Venta 3
                      </Label>
                      <div className="col-span-3 relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <Input
                          value={productCreate.precioVenta[2] || ""} // If no value exists, show empty string
                          onChange={(e) => handlePriceChange(2, e.target.value)} // Update the third price
                          id="price3"
                          name="price3"
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
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
          {/* Input de búsqueda */}
          <div className="flex items-center w-full md:w-1/3 space-x-2">
            <Input
              type="text"
              placeholder="Buscar producto por nombre, código"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <Barcode className="h-6 w-6 text-gray-500" />
          </div>

          {/* Filtro de categoría */}
          <div className="w-full md:w-1/3">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {categorias &&
                  categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.nombre}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de proveedores */}
          <div className="w-full md:w-1/3">
            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Proveedores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {proveedores &&
                  proveedores.map((prov) => (
                    <SelectItem key={prov.id} value={prov.nombre}>
                      {prov.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {/* MAPEO DE PRODUCTOS EN LA TABLA */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                Cantidad en Stock
                {sortBy === "quantity" && (
                  <ArrowDownUp className="inline ml-1" size={16} />
                )}
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Precio por unidad
                {sortBy === "price" && (
                  <ArrowDownUp className="inline ml-1" size={16} />
                )}
              </TableHead>
              <TableHead>Día de entrada</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("expiration")}
              >
                Fecha de expiración
                {sortBy === "expiration" && (
                  <ArrowDownUp className="inline ml-1" size={16} />
                )}
              </TableHead>
              <TableHead>Distribución de Stock por Sucursal</TableHead>

              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.nombre}</TableCell>
                <TableCell>
                  <p className="text-xs ">
                    {product.categorias.map((cat) => cat.nombre).join(", ")}
                  </p>
                </TableCell>

                <TableCell>
                  {product.stock.length === 0 ? (
                    <p className="text-gray-500 font-bold">No disponible</p>
                  ) : (
                    product.stock.map((stock) => (
                      <span className="ml-2 font-extrabold" key={stock.id}>
                        {stock.cantidad}
                      </span> // Muestra la cantidad
                    ))
                  )}
                </TableCell>

                <TableCell>
                  {product.precios
                    .map((precio) =>
                      new Intl.NumberFormat("es-GT", {
                        style: "currency",
                        currency: "GTQ",
                      }).format(Number(precio.precio))
                    )
                    .join(", ")}
                </TableCell>

                <TableCell>
                  {product.stock.length === 0 ? (
                    <p className="text-orange-500 font-bold">
                      Sin stock asignado
                    </p>
                  ) : (
                    product.stock.map((stock) => (
                      <Link key={stock.id} to={`/stock-edicion/${stock.id}`}>
                        <p>{formatearFecha(stock.fechaIngreso)}</p>
                      </Link>
                    ))
                  )}
                </TableCell>

                <TableCell className="">
                  {product.stock.length > 0 ? (
                    product.stock.map((stock, index) => {
                      const fechaVencimiento = new Date(stock.fechaVencimiento);
                      const hoy = new Date();
                      const estaVencido =
                        stock.fechaVencimiento &&
                        fechaVencimiento.setHours(23, 59, 59, 999) <=
                          hoy.getTime();

                      return (
                        <div
                          key={index}
                          className="flex justify-center items-center "
                        >
                          {/* Si hay fecha de vencimiento */}
                          {stock.fechaVencimiento ? (
                            estaVencido ? (
                              <p className="text-rose-500 font-bold">
                                Expirado-
                                {formatearFecha(stock.fechaVencimiento)}
                              </p>
                            ) : (
                              <p className="font-semibold">
                                {formatearFecha(stock.fechaVencimiento)}
                              </p>
                            )
                          ) : (
                            /* Si no hay fecha de vencimiento */
                            <p className="text-purple-500 font-bold">N/A</p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex justify-center items-center mt-2 mb-2">
                      <p className="text-gray-500 font-bold">
                        Sin stock asignado
                      </p>
                    </div>
                  )}
                </TableCell>

                <TableCell>
                  {product && product.stock && product.stock.length > 0 ? (
                    <Popover>
                      <PopoverTrigger>
                        <Button variant="link">Ver</Button>{" "}
                        {/* Botón que activa el popover */}
                      </PopoverTrigger>
                      <PopoverContent>
                        <div className="p-4 space-y-2">
                          {product.stock
                            .reduce(
                              (
                                acc: {
                                  sucursal: { nombre: string };
                                  cantidad: number;
                                }[],
                                stock: {
                                  sucursal: { nombre: string };
                                  cantidad: number;
                                }
                              ) => {
                                const existingStock = acc.find(
                                  (s) =>
                                    s.sucursal.nombre === stock.sucursal.nombre
                                );
                                if (existingStock) {
                                  existingStock.cantidad += stock.cantidad;
                                } else {
                                  acc.push({ ...stock });
                                }
                                return acc;
                              },
                              []
                            )
                            .map((stock) => (
                              <div
                                key={stock.sucursal.nombre} // Usar nombre como key temporal si no tienes un id
                                className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg shadow-sm"
                              >
                                <p className="font-semibold text-gray-700">
                                  {stock.sucursal.nombre}:
                                </p>
                                <p className="text-gray-600">
                                  {stock.cantidad} Uds
                                </p>
                              </div>
                            ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    "No asignado"
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex space-x-2">
                    {/* Enlace para editar el producto */}

                    {/* Botón de HoverCard para mostrar la descripción */}
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye size={16} />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-4">
                        <h4 className="text-sm font-semibold">
                          Descripción del producto
                        </h4>
                        <p className="text-sm text-muted-foreground mt-2">
                          {product.descripcion
                            ? product.descripcion
                            : "No hay descripción disponible"}
                        </p>
                      </HoverCardContent>
                    </HoverCard>

                    <Link
                      to={`/editar-producto/${product.id}`} // Cambia a la ruta correcta que maneje la edición del producto
                      className="flex items-center text-blue-500 hover:underline"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="ml-1">Editar</span>
                    </Link>

                    {/* Botón para eliminar el producto */}
                    {/* <Dialog>
                      <DialogTrigger>
                        <Button variant="destructive" size="sm">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Eliminación de Producto
                          </DialogTitle>
                          <DialogDescription>
                            Al eliminar el producto, se eliminarán sus
                            referencias tanto a stocks como a registros de
                            ventas en todas las sucursales donde haya sido
                            referenciado. Esto podría causar huecos de
                            información. ¿Continuar?
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-2 mt-4 justify-center items-center">
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            Confirmar Eliminación
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog> */}
                  </div>
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
    </div>
  );
}
