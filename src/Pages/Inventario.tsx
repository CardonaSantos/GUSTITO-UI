"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SelectM, { MultiValue } from "react-select";

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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

import { useStore } from "@/components/Context/ContextSucursal";
import { SimpleProvider } from "@/Types/Proveedor/SimpleProveedor";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";
import { Link } from "react-router-dom";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const API_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 25;

const formatearFecha = (fecha: string) => {
  return dayjs.utc(fecha).format("DD/MM/YYYY");
};

// =======================
// Types
// =======================
// Cada precio tiene un valor y un orden
export interface PrecioVentaItem {
  precio: number | null;
  orden: number | null;
}

export interface ProductCreate {
  nombre: string;
  descripcion: string;
  categorias: number[];
  codigoProducto: string;
  precioVenta: PrecioVentaItem[]; // 👈 ahora es array de objetos
  creadoPorId: number | null;
  precioCostoActual: number | null;
}

// Payload que enviamos al backend (ya filtrado/limpio)
export interface CreateProductoPayload {
  nombre: string;
  descripcion: string;
  categorias: number[];
  codigoProducto: string;
  precioCostoActual: number;
  creadoPorId: number | null;
  precioVenta: {
    precio: number;
    orden: number;
  }[];
}

interface Categoria {
  id: number;
  nombre: string;
}

// =======================
// Query Keys
// =======================
const inventarioKeys = {
  root: ["inventario"] as const,
  productos: ["inventario", "productos"] as const,
  categorias: ["inventario", "categorias"] as const,
  proveedores: ["inventario", "proveedores"] as const,
};

// =======================
// Hooks (React Query)
// =======================
function useCategorias() {
  return useQuery<Categoria[]>({
    queryKey: inventarioKeys.categorias,
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/categoria/`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
}

function useProveedores() {
  return useQuery<SimpleProvider[]>({
    queryKey: inventarioKeys.proveedores,
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/proveedor/simple-proveedor`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
}

function useProductosInventario() {
  return useQuery<ProductsInventary[]>({
    queryKey: inventarioKeys.productos,
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_URL}/products/products/for-inventary`
      );
      return data;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
}

function useCreateProducto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProductCreate) => {
      const { data } = await axios.post(`${API_URL}/products`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.productos,
      });
    },
  });
}

// =======================
// Subcomponentes
// =======================

interface AddProductDialogProps {
  categorias: Categoria[];
  userId: number | null;
  createProductoMutation: ReturnType<typeof useCreateProducto>;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  categorias,
  userId,
  createProductoMutation,
}) => {
  const [productCreate, setProductCreate] = useState<ProductCreate>({
    precioCostoActual: null,
    codigoProducto: "",
    categorias: [],
    descripcion: "",
    nombre: "",
    // inicializamos 3 niveles con orden por defecto 1,2,3
    precioVenta: [
      { precio: null, orden: 1 },
      { precio: null, orden: 2 },
      { precio: null, orden: 3 },
    ],
    creadoPorId: userId,
  });

  const handlePriceValueChange = (index: number, value: string) => {
    const updated = [...productCreate.precioVenta];
    const numeric = value ? Number(value) : null;
    updated[index] = {
      ...updated[index],
      precio: Number.isNaN(numeric) ? null : numeric,
    };
    setProductCreate((prev) => ({ ...prev, precioVenta: updated }));
  };

  const handlePriceOrderChange = (index: number, value: string) => {
    const updated = [...productCreate.precioVenta];
    const numeric = value ? Number.parseInt(value, 10) : null;
    updated[index] = {
      ...updated[index],
      orden: Number.isNaN(numeric) ? null : numeric,
    };
    setProductCreate((prev) => ({ ...prev, precioVenta: updated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filtrar precios válidos antes de validar/enviar
    const preciosValidos = productCreate.precioVenta
      .filter(
        (p) =>
          p.precio !== null && p.precio > 0 && p.orden !== null && p.orden > 0
      )
      .map((p) => ({
        precio: p.precio as number,
        orden: p.orden as number,
      }));

    if (
      !productCreate.nombre ||
      productCreate.categorias.length <= 0 ||
      !productCreate.codigoProducto ||
      preciosValidos.length === 0 || // 👈 al menos un precio válido
      !productCreate.precioCostoActual ||
      productCreate.precioCostoActual <= 0
    ) {
      toast.warning("Algunos campos obligatorios están incompletos");
      return;
    }

    if (!userId) {
      toast.warning("Falta información del usuario");
    }

    try {
      await toast.promise(
        createProductoMutation.mutateAsync({
          nombre: productCreate.nombre,
          descripcion: productCreate.descripcion,
          categorias: productCreate.categorias,
          codigoProducto: productCreate.codigoProducto,
          precioCostoActual: productCreate.precioCostoActual,
          creadoPorId: userId,
          // 👇 Enviamos solo los precios limpios (precio + orden)
          precioVenta: preciosValidos,
        } as CreateProductoPayload),
        {
          loading: "Creando producto...",
          success: "Producto creado correctamente",
          error: "Error al crear producto",
        }
      );

      setProductCreate({
        precioCostoActual: null,
        codigoProducto: "",
        categorias: [],
        descripcion: "",
        nombre: "",
        precioVenta: [
          { precio: null, orden: 1 },
          { precio: null, orden: 2 },
          { precio: null, orden: 3 },
        ],
        creadoPorId: userId,
      });
    } catch {
      // el toast.promise ya maneja el mensaje
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white shadow-md">
          Añadir producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-[#7b2c7d]">
            Añadir nuevo producto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Producto
              </Label>
              <div className="col-span-3 relative">
                <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="nombre"
                  placeholder="Nombre del producto"
                  className="pl-10"
                  value={productCreate.nombre}
                  onChange={(e) =>
                    setProductCreate((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Categorías (multi-select) */}
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
                  value={categorias
                    .filter((categoria) =>
                      productCreate.categorias.includes(categoria.id)
                    )
                    .map((categoria) => ({
                      value: categoria.id,
                      label: categoria.nombre,
                    }))}
                  onChange={(
                    selectedOptions: MultiValue<{
                      value: number;
                      label: string;
                    }>
                  ) => {
                    const ids = selectedOptions.map((o) => o.value);
                    setProductCreate((prev) => ({
                      ...prev,
                      categorias: ids,
                    }));
                  }}
                />
              </div>
            </div>

            {/* Código */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigoProducto" className="text-right">
                Código producto
              </Label>
              <div className="col-span-3 relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="codigoProducto"
                  placeholder="Código único"
                  className="pl-10"
                  value={productCreate.codigoProducto}
                  onChange={(e) =>
                    setProductCreate((prev) => ({
                      ...prev,
                      codigoProducto: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="desc" className="text-right">
                Descripción
              </Label>
              <div className="col-span-3 relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Textarea
                  id="desc"
                  placeholder="Breve descripción..."
                  className="pl-10"
                  value={productCreate.descripcion}
                  onChange={(e) =>
                    setProductCreate((prev) => ({
                      ...prev,
                      descripcion: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Precio costo */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="precioCosto" className="text-right">
                Precio costo
              </Label>
              <div className="col-span-3 relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="precioCosto"
                  type="number"
                  step="1"
                  placeholder="0.00"
                  className="pl-10"
                  value={productCreate.precioCostoActual ?? ""}
                  onChange={(e) =>
                    setProductCreate((prev) => ({
                      ...prev,
                      precioCostoActual: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                />
              </div>
            </div>

            {/* Precio venta 1 + orden */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price1" className="text-right">
                Precio venta 1
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="price1"
                    type="number"
                    step="1"
                    placeholder="0.00"
                    className="pl-10"
                    value={productCreate.precioVenta[0]?.precio ?? ""}
                    onChange={(e) => handlePriceValueChange(0, e.target.value)}
                  />
                </div>
                <Input
                  type="number"
                  step="1"
                  min={1}
                  placeholder="Orden"
                  value={productCreate.precioVenta[0]?.orden ?? ""}
                  onChange={(e) => handlePriceOrderChange(0, e.target.value)}
                />
              </div>
            </div>

            {/* Precio venta 2 + orden */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price2" className="text-right">
                Precio venta 2
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="price2"
                    type="number"
                    step="1"
                    placeholder="0.00"
                    className="pl-10"
                    value={productCreate.precioVenta[1]?.precio ?? ""}
                    onChange={(e) => handlePriceValueChange(1, e.target.value)}
                  />
                </div>
                <Input
                  type="number"
                  step="1"
                  min={1}
                  placeholder="Orden"
                  value={productCreate.precioVenta[1]?.orden ?? ""}
                  onChange={(e) => handlePriceOrderChange(1, e.target.value)}
                />
              </div>
            </div>

            {/* Precio venta 3 + orden */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price3" className="text-right">
                Precio venta 3
              </Label>
              <div className="col-span-3 grid grid-cols-2 gap-2">
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="price3"
                    type="number"
                    step="1"
                    placeholder="0.00"
                    className="pl-10"
                    value={productCreate.precioVenta[2]?.precio ?? ""}
                    onChange={(e) => handlePriceValueChange(2, e.target.value)}
                  />
                </div>
                <Input
                  type="number"
                  step="1"
                  min={1}
                  placeholder="Orden"
                  value={productCreate.precioVenta[2]?.orden ?? ""}
                  onChange={(e) => handlePriceOrderChange(2, e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
              disabled={createProductoMutation.isPending}
            >
              {createProductoMutation.isPending
                ? "Guardando..."
                : "Añadir producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface FiltersBarProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  supplierFilter: string;
  setSupplierFilter: (v: string) => void;
  categorias: Categoria[];
  proveedores: SimpleProvider[];
}

const FiltersBar: React.FC<FiltersBarProps> = ({
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  supplierFilter,
  setSupplierFilter,
  categorias,
  proveedores,
}) => {
  return (
    <div className="border border-[#e2b7b8] dark:border-[#7b2c7d]/60 bg-[#fff9fb] dark:bg-[#7b2c7d]/10 rounded-2xl p-4 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-sm font-semibold text-[#7b2c7d]">
          Filtros de inventario
        </p>
      </div>

      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
        {/* Búsqueda */}
        <div className="flex items-center w-full md:w-1/3 space-x-2">
          <Input
            type="text"
            placeholder="Buscar por nombre o código"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          <Barcode className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Categoría */}
        <div className="w-full md:w-1/3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.id} value={cat.nombre}>
                  {cat.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Proveedor */}
        <div className="w-full md:w-1/3">
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {proveedores.map((prov) => (
                <SelectItem key={prov.id} value={prov.nombre}>
                  {prov.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

interface InventoryTableProps {
  items: ProductsInventary[];
  sortBy: string;
  sortOrder: "asc" | "desc";
  handleSort: (column: string) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  sortBy,
  // sortOrder,
  handleSort,
}) => {
  return (
    <Card className="border border-[#e2b7b8] dark:border-[#7b2c7d]/60 rounded-2xl">
      <CardHeader className="border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
        <CardTitle className="flex items-center gap-2 text-[#7b2c7d]">
          <Box className="h-5 w-5" />
          Productos en inventario
        </CardTitle>
        <CardDescription className="text-xs">
          Listado de productos, stock, precios y distribución por sucursal.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("quantity")}
                >
                  Cantidad en stock
                  {sortBy === "quantity" && (
                    <ArrowDownUp className="inline ml-1 h-3 w-3" />
                  )}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("price")}
                >
                  Precio por unidad
                  {sortBy === "price" && (
                    <ArrowDownUp className="inline ml-1 h-3 w-3" />
                  )}
                </TableHead>
                <TableHead>Día de entrada</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("expiration")}
                >
                  Fecha de expiración
                  {sortBy === "expiration" && (
                    <ArrowDownUp className="inline ml-1 h-3 w-3" />
                  )}
                </TableHead>
                <TableHead>Distribución por sucursal</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((product) => (
                <TableRow key={product.id}>
                  {/* Nombre */}
                  <TableCell className="font-medium">
                    {product.nombre}
                  </TableCell>

                  {/* Categorías */}
                  <TableCell>
                    <p className="text-xs">
                      {product.categorias.map((c) => c.nombre).join(", ")}
                    </p>
                  </TableCell>

                  {/* Cantidad */}
                  <TableCell>
                    {product.stock.length === 0 ? (
                      <p className="text-xs font-semibold text-muted-foreground">
                        No disponible
                      </p>
                    ) : (
                      product.stock.map((stock) => (
                        <span
                          key={stock.id}
                          className="ml-2 font-semibold text-[#7b2c7d]"
                        >
                          {stock.cantidad}
                        </span>
                      ))
                    )}
                  </TableCell>

                  {/* Precios */}
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

                  {/* Día de entrada */}
                  {/* Día de entrada */}
                  <TableCell>
                    {product.stock.length === 0 ? (
                      <p className="text-xs font-semibold text-orange-500">
                        Sin stock asignado
                      </p>
                    ) : (
                      product.stock
                        .slice() // copiamos para no mutar el original
                        .sort(
                          (a, b) =>
                            new Date(a.fechaIngreso).getTime() -
                            new Date(b.fechaIngreso).getTime()
                        )
                        .map((stock) => (
                          <Link
                            key={stock.id}
                            to={`/stock-edicion/${stock.id}`}
                            className="block text-xs underline-offset-2 hover:underline text-[#7b2c7d]"
                          >
                            {formatearFecha(stock.fechaIngreso)}
                          </Link>
                        ))
                    )}
                  </TableCell>

                  {/* Fecha de expiración */}
                  <TableCell>
                    {product.stock.length > 0 ? (
                      product.stock.map((stock) => {
                        const fechaVencimiento = stock.fechaVencimiento
                          ? new Date(stock.fechaVencimiento)
                          : null;
                        const hoy = new Date();
                        const estaVencido =
                          fechaVencimiento &&
                          fechaVencimiento.setHours(23, 59, 59, 999) <=
                            hoy.getTime();

                        if (!stock.fechaVencimiento) {
                          return (
                            <p
                              key={stock.id}
                              className="text-xs font-semibold text-purple-500"
                            >
                              N/A
                            </p>
                          );
                        }

                        if (estaVencido) {
                          return (
                            <p
                              key={stock.id}
                              className="text-xs font-semibold text-rose-500"
                            >
                              Expirado -{" "}
                              {formatearFecha(stock.fechaVencimiento)}
                            </p>
                          );
                        }

                        return (
                          <p
                            key={stock.id}
                            className="text-xs font-semibold text-foreground"
                          >
                            {formatearFecha(stock.fechaVencimiento)}
                          </p>
                        );
                      })
                    ) : (
                      <p className="text-xs font-semibold text-muted-foreground">
                        Sin stock asignado
                      </p>
                    )}
                  </TableCell>

                  {/* Distribución por sucursal */}
                  <TableCell>
                    {product.stock && product.stock.length > 0 ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            Ver
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <div className="p-2 space-y-2">
                            {product.stock
                              .reduce(
                                (
                                  acc: {
                                    sucursal: { nombre: string };
                                    cantidad: number;
                                  }[],
                                  stockItem: {
                                    sucursal: { nombre: string };
                                    cantidad: number;
                                  }
                                ) => {
                                  const existente = acc.find(
                                    (s) =>
                                      s.sucursal.nombre ===
                                      stockItem.sucursal.nombre
                                  );
                                  if (existente) {
                                    existente.cantidad += stockItem.cantidad;
                                  } else {
                                    acc.push({ ...stockItem });
                                  }
                                  return acc;
                                },
                                []
                              )
                              .map((s) => (
                                <div
                                  key={s.sucursal.nombre}
                                  className="flex justify-between rounded-lg border px-3 py-1 text-xs bg-[#fff5f7] dark:bg-[#7b2c7d]/10"
                                >
                                  <span className="font-medium">
                                    {s.sucursal.nombre}
                                  </span>
                                  <span>{s.cantidad} uds</span>
                                </div>
                              ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No asignado
                      </span>
                    )}
                  </TableCell>

                  {/* Acciones */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Descripción */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-4">
                          <h4 className="text-sm font-semibold">
                            Descripción del producto
                          </h4>
                          <p className="text-xs text-muted-foreground mt-2">
                            {product.descripcion ||
                              "No hay descripción disponible"}
                          </p>
                        </HoverCardContent>
                      </HoverCard>

                      {/* Editar producto */}
                      <Link
                        to={`/editar-producto/${product.id}`}
                        className="inline-flex items-center text-xs text-[#7b2c7d] hover:underline"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6">
                    <p className="text-sm text-muted-foreground">
                      No hay productos que coincidan con los filtros actuales.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

interface InventoryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const InventoryPagination: React.FC<InventoryPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center py-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="outline"
              className="border-[#e2b7b8]"
              onClick={() => onPageChange(1)}
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

          {/* Truncado izquierda */}
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

          {/* Páginas cercanas */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(
              (page) =>
                page === currentPage ||
                (page >= currentPage - 1 && page <= currentPage + 1)
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

          {/* Truncado derecha */}
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
              className="bg-[#f97373] hover:bg-[#ef4444]"
              onClick={() => onPageChange(totalPages)}
            >
              Último
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

// =======================
// Componente principal
// =======================

export default function Inventario() {
  const userId = useStore((state) => state.userId) ?? null;

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  const { data: categorias = [] } = useCategorias();
  const { data: proveedores = [] } = useProveedores();
  const { data: productsInventary = [], isLoading: isLoadingProductos } =
    useProductosInventario();

  const createProductoMutation = useCreateProducto();

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Filtro + ordenamiento
  const filteredProducts = useMemo(() => {
    return productsInventary
      .filter((product) => {
        const hasStock = product.stock.length > 0;
        const firstStock = hasStock ? product.stock : null;

        const matchesSearchTerm =
          product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.codigoProducto
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesCategory =
          categoryFilter === "all" ||
          (product.categorias.length > 0 &&
            product.categorias.some((cat) => cat.nombre === categoryFilter));

        const matchesSupplier =
          supplierFilter === "all" ||
          (firstStock &&
            firstStock.some(
              (stock) =>
                stock.entregaStock.proveedor.nombre
                  .trim()
                  .toLocaleLowerCase() ===
                supplierFilter.trim().toLocaleLowerCase()
            ));

        return matchesSearchTerm && matchesCategory && matchesSupplier;
      })
      .sort((a, b) => {
        const stockA = a.stock.length > 0 ? a.stock[0] : null;
        const stockB = b.stock.length > 0 ? b.stock[0] : null;

        if (sortBy === "quantity") {
          return sortOrder === "asc"
            ? (stockA?.cantidad || 0) - (stockB?.cantidad || 0)
            : (stockB?.cantidad || 0) - (stockA?.cantidad || 0);
        }

        if (sortBy === "price") {
          return sortOrder === "asc"
            ? a.precioVenta - b.precioVenta
            : b.precioVenta - a.precioVenta;
        }

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
  }, [
    productsInventary,
    searchTerm,
    categoryFilter,
    supplierFilter,
    sortBy,
    sortOrder,
  ]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredProducts.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const totalInventoryCount = useMemo(
    () =>
      filteredProducts.reduce((sum, product) => {
        const stockQuantity =
          product.stock.length > 0 ? product.stock[0].cantidad : 0;
        return sum + stockQuantity;
      }, 0),
    [filteredProducts]
  );

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoadingProductos && productsInventary.length === 0) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <p className="text-sm text-muted-foreground">
          Cargando inventario de productos...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header / resumen */}
      <Card className="border border-[#e2b7b8] dark:border-[#7b2c7d]/60 rounded-2xl">
        <CardHeader className="border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-[#7b2c7d]">
                <Box className="h-5 w-5" />
                Administrador de inventario
              </CardTitle>
              <CardDescription className="text-xs">
                Control de productos, stock y precios por sucursal.
              </CardDescription>
            </div>
            <div className="text-sm font-semibold text-[#7b2c7d]">
              Inventario total: {totalInventoryCount} items
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 flex flex-col gap-4">
          <div className="flex justify-end">
            <AddProductDialog
              categorias={categorias}
              userId={userId}
              createProductoMutation={createProductoMutation}
            />
          </div>

          <FiltersBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            supplierFilter={supplierFilter}
            setSupplierFilter={setSupplierFilter}
            categorias={categorias}
            proveedores={proveedores}
          />
        </CardContent>
      </Card>

      {/* Tabla */}
      <InventoryTable
        items={currentItems}
        sortBy={sortBy}
        sortOrder={sortOrder}
        handleSort={handleSort}
      />

      {/* Paginación */}
      <InventoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
