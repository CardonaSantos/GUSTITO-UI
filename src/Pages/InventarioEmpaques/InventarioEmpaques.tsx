"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  AlertTriangle,
  Barcode,
  Box,
  ChevronLeft,
  ChevronRight,
  Coins,
  Edit,
  Eye,
  List,
  Loader2,
  Power,
  Tag,
  X,
} from "lucide-react";
import { toast } from "sonner";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

import dayjs from "dayjs";
import "dayjs/locale/es";
import utc from "dayjs/plugin/utc";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(utc);
dayjs.extend(localizedFormat);
dayjs.locale("es");

const API_URL = import.meta.env.VITE_API_URL;

const formatearFecha = (fecha: string) => {
  return dayjs.utc(fecha).format("DD/MM/YYYY");
};

// =======================
// Tipos
// =======================

interface ProductCreate {
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  precioVenta: number | null;
  creadoPorId: number | null;
  precioCosto: number | null;
}

type EmpaqueStock = {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  sucursal: {
    id: number;
    nombre: string;
  };
};

type ProductoEmpaque = {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  precioCosto: number | null;
  precioVenta: number | null;
  activo: boolean; // 👈 para desactivar/activar
  stock: EmpaqueStock[];
};

interface UpdateEmpaquePayload {
  id: number;
  body: {
    nombre: string;
    descripcion: string;
    codigoProducto: string;
    precioCosto: number | null;
    precioVenta: number | null;
  };
}

interface ToggleActivoPayload {
  id: number;
}

interface MarkDeletedPayload {
  id: number;
}

// =======================
// Query Keys
// =======================

const empaqueKeys = {
  root: ["empaques"] as const,
  list: ["empaques", "list"] as const,
};

// =======================
// Custom Hooks
// =======================

function useEmpaquesInventario() {
  return useQuery<ProductoEmpaque[]>({
    queryKey: empaqueKeys.list,
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/empaque/inventario`);
      return data;
    },
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: "always",
  });
}

function useCreateEmpaque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ProductCreate) => {
      const { data } = await axios.post(`${API_URL}/empaque`, payload);
      return data as ProductoEmpaque;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empaqueKeys.list });
    },
  });
}

function useUpdateEmpaque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, body }: UpdateEmpaquePayload) => {
      const { data } = await axios.patch(`${API_URL}/empaque/${id}`, body);
      return data as ProductoEmpaque;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empaqueKeys.list });
    },
  });
}

function useMarkDeletedEmpaque() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: MarkDeletedPayload) => {
      const { data } = await axios.delete(
        `${API_URL}/empaque/mark-deleted/${id}`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empaqueKeys.list });
    },
  });
}

function useToggleActivoEmpaque() {
  const queryClient = useQueryClient();

  return useMutation({
    // ⚠️ Ajusta la ruta cuando crees el endpoint en backend
    mutationFn: async ({ id }: ToggleActivoPayload) => {
      const { data } = await axios.patch(
        `${API_URL}/empaque/toggle-active/${id}`
      );
      return data as ProductoEmpaque;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: empaqueKeys.list });
    },
  });
}

// =======================
// Componente principal
// =======================

export default function InventarioEmpaques() {
  const userId = useStore((state) => state.userId);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"" | "quantity" | "price">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  // React Query: listado de empaques
  const {
    data: empaquesInventary = [],
    isLoading,
    isFetching,
  } = useEmpaquesInventario();

  // Mutations
  const createEmpaqueMutation = useCreateEmpaque();
  const updateEmpaqueMutation = useUpdateEmpaque();
  const markDeletedEmpaqueMutation = useMarkDeletedEmpaque();
  const toggleActivoEmpaqueMutation = useToggleActivoEmpaque();

  // Crear nuevo empaque
  const [productCreate, setProductCreate] = useState<ProductCreate>({
    precioCosto: null,
    codigoProducto: "",
    descripcion: "",
    nombre: "",
    precioVenta: 0,
    creadoPorId: userId,
  });

  const handleSort = (column: "quantity" | "price") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const filteredEmpaques = empaquesInventary.filter((empaque) => {
    return (
      empaque.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      empaque.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const sortedEmpaques = [...filteredEmpaques].sort((a, b) => {
    if (sortBy === "quantity") {
      const qa = a.stock.reduce((acc, s) => acc + (s.cantidad || 0), 0);
      const qb = b.stock.reduce((acc, s) => acc + (s.cantidad || 0), 0);
      return sortOrder === "asc" ? qa - qb : qb - qa;
    }
    if (sortBy === "price") {
      const pa = a.precioVenta ?? 0;
      const pb = b.precioVenta ?? 0;
      return sortOrder === "asc" ? pa - pb : pb - pa;
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

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Crear empaque
  const [openCreateEmpaque, setOpenCreateEmpaque] = useState(false);

  const handleAddProduct = async () => {
    if (
      !productCreate.nombre ||
      !productCreate.codigoProducto ||
      !productCreate.precioVenta
    ) {
      toast.info("Nombre, código y precio de venta son obligatorios");
      return;
    }

    if (!userId) {
      toast.warning("Falta información del usuario");
      return;
    }

    try {
      await toast.promise(createEmpaqueMutation.mutateAsync(productCreate), {
        loading: "Creando empaque...",
        success: "Empaque creado correctamente.",
        error: "Error al crear el empaque.",
      });

      setProductCreate({
        codigoProducto: "",
        descripcion: "",
        nombre: "",
        precioCosto: null,
        precioVenta: 0,
        creadoPorId: userId,
      });
      setOpenCreateEmpaque(false);
    } catch {
      // error ya manejado por toast.promise
    }
  };

  // Edición
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
      await toast.promise(
        updateEmpaqueMutation.mutateAsync({
          id: selectedEmpaque.id,
          body: editData,
        }),
        {
          loading: "Actualizando empaque...",
          success: "Empaque actualizado correctamente.",
          error: "Error al actualizar el empaque.",
        }
      );

      setEditDialogOpen(false);
    } catch {
      // manejado por toast.promise
    }
  };

  // Marcar eliminado
  const [openDelete, setOpenDelete] = useState(false);

  const handleMarkDeletedEmpaque = async () => {
    if (!selectedEmpaque) return;

    try {
      await toast.promise(
        markDeletedEmpaqueMutation.mutateAsync({
          id: selectedEmpaque.id,
        }),
        {
          loading: "Eliminando empaque...",
          success: "Empaque eliminado correctamente.",
          error: "Error al eliminar el empaque.",
        }
      );

      setOpenDelete(false);
      setSelectedEmpaque(null);
    } catch {
      // manejado por toast.promise
    }
  };

  // Desactivar / activar empaque
  const [openToggleActive, setOpenToggleActive] = useState(false);
  const isAdminDeactivable = true; // 👈 tú luego calculas esto como gustes

  const handleToggleActivoEmpaque = async () => {
    if (!selectedEmpaque) return;

    try {
      await toast.promise(
        toggleActivoEmpaqueMutation.mutateAsync({
          id: selectedEmpaque.id,
        }),
        {
          loading: selectedEmpaque.activo
            ? "Desactivando empaque..."
            : "Reactivando empaque...",
          success: selectedEmpaque.activo
            ? "Empaque desactivado. Ya no se podrá usar en ventas."
            : "Empaque reactivado correctamente.",
          error: "No se pudo cambiar el estado del empaque.",
        }
      );

      setOpenToggleActive(false);
      setSelectedEmpaque(null);
    } catch {
      // manejado por toast.promise
    }
  };

  // Loading general
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-16 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-[#7b2c7d]" />
        <p className="text-sm text-muted-foreground">
          Cargando inventario de empaques...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2 text-[#7b2c7d]">
            <Box className="h-5 w-5" />
            Administrador de inventario de empaques
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gestiona empaques, precios y stock por sucursal.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[#e2b7b8]/80 bg-[#fff5f7]/80 px-3 py-1 text-xs">
            <Tag className="h-3 w-3 text-[#7b2c7d]" />
            <span className="font-medium">
              Inventario total: {totalInventoryCount} unidades
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nombre o código"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>

          <Dialog open={openCreateEmpaque} onOpenChange={setOpenCreateEmpaque}>
            <Button
              type="button"
              className="bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white whitespace-nowrap"
              onClick={() => setOpenCreateEmpaque(true)}
            >
              + Añadir empaque
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Añadir nuevo empaque
                </DialogTitle>
                <DialogDescription className="text-center">
                  Crea un empaque con su código único y precios base.
                </DialogDescription>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddProduct();
                }}
              >
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="nombre" className="text-right">
                      Empaque
                    </Label>
                    <div className="col-span-3 relative">
                      <Box className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        onChange={(e) =>
                          setProductCreate((prev) => ({
                            ...prev,
                            nombre: e.target.value,
                          }))
                        }
                        value={productCreate.nombre}
                        id="nombre"
                        name="nombre"
                        placeholder="Nombre del empaque"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="code" className="text-right">
                      Código
                    </Label>
                    <div className="col-span-3 relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={productCreate.codigoProducto}
                        onChange={(e) =>
                          setProductCreate((prev) => ({
                            ...prev,
                            codigoProducto: e.target.value,
                          }))
                        }
                        id="code"
                        name="code"
                        placeholder="Código único de empaque"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="desc" className="text-right">
                      Descripción
                    </Label>
                    <div className="col-span-3 relative">
                      <Textarea
                        value={productCreate.descripcion}
                        onChange={(e) =>
                          setProductCreate((prev) => ({
                            ...prev,
                            descripcion: e.target.value,
                          }))
                        }
                        placeholder="Breve descripción..."
                        id="desc"
                        name="desc"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="precioCosto" className="text-right">
                      Precio costo
                    </Label>
                    <div className="col-span-3 relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={productCreate.precioCosto ?? ""}
                        onChange={(e) =>
                          setProductCreate((prev) => ({
                            ...prev,
                            precioCosto: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        id="precioCosto"
                        name="precioCosto"
                        type="number"
                        step="1"
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="precioVenta" className="text-right">
                      Precio venta
                    </Label>
                    <div className="col-span-3 relative">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={productCreate.precioVenta ?? ""}
                        onChange={(e) =>
                          setProductCreate((prev) => ({
                            ...prev,
                            precioVenta: e.target.value
                              ? Number(e.target.value)
                              : null,
                          }))
                        }
                        id="precioVenta"
                        name="precioVenta"
                        type="number"
                        step="1"
                        placeholder="0.00"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                    disabled={createEmpaqueMutation.isPending}
                  >
                    {createEmpaqueMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Añadir empaque
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border border-[#e2b7b8]/80 dark:border-[#7b2c7d]/60 rounded-2xl bg-[#fff9fb]/60 dark:bg-[#020817]">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#fff5f7]/80 dark:bg-[#7b2c7d]/20">
              <TableHead>Empaque</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("quantity")}
              >
                Cantidad total
              </TableHead>
              <TableHead>Fecha ingreso</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("price")}
              >
                Precio por unidad
              </TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>En sucursales</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((empaque) => {
              const cantidadTotal = empaque.stock.reduce(
                (acc, s) => acc + (s.cantidad || 0),
                0
              );

              return (
                <TableRow key={empaque.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{empaque.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {empaque.codigoProducto}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      className="text-xs"
                      variant={empaque.activo ? "default" : "secondary"}
                    >
                      {empaque.activo ? "Desactivado" : "Activo"}
                    </Badge>
                  </TableCell>

                  <TableCell className="font-semibold">
                    {cantidadTotal > 0 ? (
                      cantidadTotal
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sin stock
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    {empaque.stock.length > 0 ? (
                      empaque.stock.map((stock) => (
                        <div
                          key={stock.id}
                          className="text-xs hover:text-[#7b2c7d] cursor-pointer"
                        >
                          <Link to={`/stock-empaque-edicion/${stock.id}`}>
                            {formatearFecha(stock.fechaIngreso)}
                          </Link>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Sin movimientos
                      </span>
                    )}
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
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-[#e2b7b8]/80"
                        >
                          <Eye size={16} />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80 p-4">
                        <p className="text-sm text-muted-foreground mt-2">
                          {empaque.descripcion ||
                            "No hay descripción disponible"}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </TableCell>

                  <TableCell>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-[#e2b7b8]/80"
                        >
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
                              const sucursalNombre =
                                stock?.sucursal?.nombre ?? "Sin nombre";

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
                              key={sucursal.nombre}
                              className="flex justify-between border rounded px-3 py-1 shadow-sm bg-[#fff5f7]/60 dark:bg-transparent text-xs"
                            >
                              <p className="font-medium">{sucursal.nombre}</p>
                              <p className="text-right">
                                {sucursal.cantidad} uds
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
                      className="border-[#e2b7b8]/80"
                      onClick={() => openEditDialog(empaque)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {currentItems.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-sm text-muted-foreground"
                >
                  No se encontraron empaques con ese criterio.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {isFetching && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Actualizando inventario...
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  size="sm"
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
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* DIALOG EDICIÓN EMPAQUE */}
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
                    placeholder="Nombre del empaque"
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
                    placeholder="Código del empaque"
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
                  Precio costo
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
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="precioVenta" className="text-right">
                  Precio venta
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
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              {isAdminDeactivable && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto border-[#e2b7b8] text-[#7b2c7d]"
                  onClick={() => {
                    setOpenToggleActive(true);
                  }}
                >
                  <Power className="mr-2 h-4 w-4" />
                  {selectedEmpaque?.activo ? "Reactivar" : "Desactivar"}
                </Button>
              )}

              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={() => {
                  setOpenDelete(true);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Eliminar
              </Button>

              <Button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
                disabled={updateEmpaqueMutation.isPending}
              >
                {updateEmpaqueMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: MARCAR COMO ELIMINADO */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">
              Confirmar eliminación
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-center">
              ¿Estás seguro de que quieres eliminar el empaque{" "}
              <span className="font-semibold text-foreground">
                "{selectedEmpaque?.nombre}"
              </span>
              ?
              <br />
              <span className="text-sm text-muted-foreground mt-2 block text-center">
                Esta acción no se puede deshacer.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDelete(false)}
              disabled={markDeletedEmpaqueMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleMarkDeletedEmpaque}
              disabled={markDeletedEmpaqueMutation.isPending}
              className="w-full sm:w-auto"
            >
              {markDeletedEmpaqueMutation.isPending ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Eliminando...
                </>
              ) : (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: DESACTIVAR / REACTIVAR */}
      <Dialog open={openToggleActive} onOpenChange={setOpenToggleActive}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Power className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl font-semibold text-center">
              {selectedEmpaque?.activo
                ? "Reactivar empaque"
                : "Desactivar empaque"}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed text-center">
              {selectedEmpaque?.activo ? (
                <>
                  El empaque{" "}
                  <span className="font-semibold text-foreground">
                    "{selectedEmpaque?.nombre}"
                  </span>{" "}
                  será marcado como{" "}
                  <span className="font-semibold">activo</span> y volverá a
                  estar disponible para ventas.
                </>
              ) : (
                <>
                  El empaque{" "}
                  <span className="font-semibold text-foreground">
                    "{selectedEmpaque?.nombre}"
                  </span>{" "}
                  será marcado como{" "}
                  <span className="font-semibold">inactivo</span> y ya no podrás
                  usarlo en nuevas ventas.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenToggleActive(false)}
              disabled={toggleActivoEmpaqueMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white"
              onClick={handleToggleActivoEmpaque}
              disabled={toggleActivoEmpaqueMutation.isPending}
            >
              {toggleActivoEmpaqueMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : selectedEmpaque?.activo ? (
                "Reactivar"
              ) : (
                "Desctivar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
