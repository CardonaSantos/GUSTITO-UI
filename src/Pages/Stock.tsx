import { useEffect, useMemo, useState, WheelEventHandler } from "react";
import {
  Truck,
  User,
  Plus,
  X,
  Edit,
  SendIcon,
  PackagePlus,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import axios from "axios";
import { ProductsInventary } from "@/Types/Inventary/ProductsInventary";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
import SelectM from "react-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL;
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
  }).format(value);

const calculateTotalCost = (cantidad: number, precioCosto: number): number => {
  const cantidadNum = Number(cantidad);
  const precioCostoNum = Number(precioCosto);

  if (!isNaN(cantidadNum) && !isNaN(precioCostoNum)) {
    return cantidadNum * precioCostoNum;
  }
  return 0;
};

// evitar que la ruedita cambie los inputs numéricos
const preventWheelChange: WheelEventHandler<HTMLInputElement> = (event) => {
  event.currentTarget.blur();
};

// ================================
//  TIPOS
// ================================
type Provider = {
  id: number;
  nombre: string;
};

type StockEntry = {
  productoId: number;
  cantidad: number;
  costoTotal: number;
  fechaIngreso: string;
  fechaVencimiento?: string;
  precioCosto: number;
  proveedorId: number;
};

interface GroupedStock {
  nombre: string;
  cantidad: number;
}

interface EmpaqueStockEntry {
  empaqueId: number;
  cantidad: number;
  precioCosto: number;
  costoTotal: number;
  fechaIngreso: string;
  fechaVencimiento: string | undefined;
  proveedorId: number;
}

export interface Empaque {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  precioCosto: number | null;
  precioVenta: number | null;
  stock: StockEmpaque[];
}

export interface StockEmpaque {
  id?: number;
  cantidad?: number;
}

interface SucursalProductSelect {
  id: number;
  nombre: string;
}

interface StockProductoSelect {
  cantidad: number;
  id: number;
  sucursal: SucursalProductSelect;
}
interface ProductoSelect {
  id: number;
  nombreProducto: string;
  precioCostoActual: number;
  stock: StockProductoSelect[];
}

// ================================
//  REACT QUERY KEYS + HOOKS
// ================================
const inventarioKeys = {
  root: ["inventario"] as const,
  productos: () => [...inventarioKeys.root, "productos"] as const,
  proveedores: () => [...inventarioKeys.root, "proveedores"] as const,
  empaques: () => [...inventarioKeys.root, "empaques"] as const,
};

const useProductosInventario = () =>
  useQuery({
    queryKey: inventarioKeys.productos(),
    queryFn: async () => {
      const { data } = await axios.get<ProductsInventary[]>(
        `${API_URL}/products/products/for-inventary`
      );
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

const useProveedores = () =>
  useQuery({
    queryKey: inventarioKeys.proveedores(),
    queryFn: async () => {
      const { data } = await axios.get<Provider[]>(`${API_URL}/proveedor/`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

const useEmpaquesInventario = () =>
  useQuery({
    queryKey: inventarioKeys.empaques(),
    queryFn: async () => {
      const { data } = await axios.get<Empaque[]>(`${API_URL}/empaque`);
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

type CreateStockProductosPayload = {
  stockEntries: StockEntry[];
  proveedorId: number;
  sucursalId: number | null;
  recibidoPorId: number | null;
};

const useCreateStockProductos = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStockProductosPayload) => {
      const { data } = await axios.post(`${API_URL}/stock`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.productos(),
      });
    },
  });
};

type CreateStockEmpaquesPayload = {
  proveedorId: number;
  sucursalId: number;
  recibidoPorId: number;
  stockEntries: EmpaqueStockEntry[];
};

const useCreateStockEmpaques = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateStockEmpaquesPayload) => {
      const { data } = await axios.post(`${API_URL}/stock/empaques`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: inventarioKeys.empaques(),
      });
    },
  });
};

// ================================
//  MAIN PAGE
// ================================
export default function Stock() {
  const sucursalId = useStore((state) => state.sucursalId);
  const recibidoPorId = useStore((state) => state.userId);
  const usuarioNombre = useStore((state) => state.userNombre);

  const {
    data: productsInventary = [],
    isLoading: loadingProducts,
    isError: errorProducts,
  } = useProductosInventario();

  const {
    data: proveedores = [],
    isLoading: loadingProviders,
    isError: errorProviders,
  } = useProveedores();

  const {
    data: empaquesInventario = [],
    isLoading: loadingEmpaques,
    isError: errorEmpaques,
  } = useEmpaquesInventario();

  useEffect(() => {
    if (errorProducts) toast.error("Error al conseguir los productos");
    if (errorProviders) toast.error("Error al conseguir los proveedores");
    if (errorEmpaques) toast.error("Error al conseguir los empaques");
  }, [errorProducts, errorProviders, errorEmpaques]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8">
      {/* STOCK PRODUCTOS */}
      <Card className="w-full border border-border shadow-none bg-gradient-to-b from-[#fdf3f7] to-background dark:from-[#3d193f] dark:to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-[color:#7b2c7d] dark:text-[color:#e2b7b8]">
            Agregar stock de producto
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Registra nuevas entradas de productos a la sucursal actual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProducts || loadingProviders ? (
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          ) : (
            <ProductStockSection
              productsInventary={productsInventary}
              proveedores={proveedores}
              sucursalId={sucursalId ?? null}
              recibidoPorId={recibidoPorId ?? null}
              usuarioNombre={usuarioNombre}
            />
          )}
        </CardContent>
      </Card>

      {/* STOCK EMPAQUES */}
      <Card className="w-full border border-border shadow-none bg-gradient-to-b from-[#fdf3f7] to-background dark:from-[#3d193f] dark:to-background">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-[color:#7b2c7d] dark:text-[color:#e2b7b8]">
            Agregar stock de empaque
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Registra empaques usados o comprados para esta sucursal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEmpaques || loadingProviders ? (
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          ) : (
            <EmpaqueStockSection
              empaquesInventario={empaquesInventario}
              proveedores={proveedores}
              sucursalId={sucursalId ?? 0}
              recibidoPorId={recibidoPorId ?? 0}
              usuarioNombre={usuarioNombre}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===================================================
//  SUBCOMPONENTE: STOCK PRODUCTOS
// ===================================================
interface ProductStockSectionProps {
  productsInventary: ProductsInventary[];
  proveedores: Provider[];
  sucursalId: number | null;
  recibidoPorId: number | null;
  usuarioNombre: string | null;
}

function ProductStockSection({
  productsInventary,
  proveedores,
  sucursalId,
  recibidoPorId,
  usuarioNombre,
}: ProductStockSectionProps) {
  const [cantidad, setCantidad] = useState<string>("");
  const [precioCosto, setPrecioCosto] = useState<number>(0);
  const [costoTotal, setCostoTotal] = useState<number>(0);
  const [fechaIngreso, setFechaIngreso] = useState<Date>(new Date());
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [productToShow, setProductToShow] = useState<ProductoSelect | null>(
    null
  );
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { mutateAsync: createStockProductos, isPending: isSubmitting } =
    useCreateStockProductos();

  // actualizar costo total
  useEffect(() => {
    const cantidadNum = parseFloat(cantidad);
    if (!isNaN(cantidadNum) && !isNaN(precioCosto)) {
      setCostoTotal(cantidadNum * precioCosto);
    } else {
      setCostoTotal(0);
    }
  }, [cantidad, precioCosto]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!cantidad) newErrors.cantidad = "La cantidad es requerida";
    if (!precioCosto) newErrors.precioCosto = "El precio de costo es requerido";
    if (!fechaIngreso)
      newErrors.fechaIngreso = "La fecha de ingreso es requerida";
    if (!selectedProductId) newErrors.product = "Debe seleccionar un producto";
    if (!selectedProviderId)
      newErrors.provider = "Debe seleccionar un proveedor";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setSelectedProductId("");
    setCantidad("");
    setPrecioCosto(0);
    setFechaIngreso(new Date());
    setFechaVencimiento(null);
    setErrors({});
    setProductToShow(null);
  };

  const handleAddEntry = () => {
    if (!validateForm()) return;

    const cantidadNum = parseInt(cantidad, 10);
    const precioNum = Number(precioCosto);

    if (cantidadNum <= 0 || precioNum <= 0) {
      toast.warning("No se permiten valores negativos o iguales a cero");
      return;
    }

    if (isNaN(cantidadNum) || isNaN(precioNum)) {
      toast.warning("Cantidad y precio deben ser números válidos");
      return;
    }

    const newEntry: StockEntry = {
      productoId: parseInt(selectedProductId, 10),
      cantidad: cantidadNum,
      costoTotal: calculateTotalCost(cantidadNum, precioNum),
      fechaIngreso: fechaIngreso.toISOString(),
      fechaVencimiento: fechaVencimiento?.toISOString(),
      precioCosto: precioNum,
      proveedorId: parseInt(selectedProviderId, 10),
    };

    if (stockEntries.some((p) => p.productoId === newEntry.productoId)) {
      toast.info("El producto ya está en la lista. Añade uno nuevo.");
      return;
    }

    setStockEntries((prev) => [...prev, newEntry]);
    resetForm();
    toast.success("Producto añadido a la lista");
  };

  const totalStock = useMemo(
    () =>
      stockEntries.reduce(
        (total, producto) => total + producto.cantidad * producto.precioCosto,
        0
      ),
    [stockEntries]
  );

  const handleConfirmSubmit = async () => {
    if (stockEntries.length === 0) {
      toast.error("No hay productos en la lista");
      return;
    }

    if (!sucursalId || !recibidoPorId || !selectedProviderId) {
      toast.error("Faltan datos obligatorios (sucursal / proveedor / usuario)");
      return;
    }

    const payload: CreateStockProductosPayload = {
      stockEntries,
      proveedorId: Number(selectedProviderId),
      sucursalId,
      recibidoPorId,
    };

    try {
      await toast.promise(createStockProductos(payload), {
        loading: "Registrando stock de productos...",
        success: "Stocks añadidos exitosamente.",
        error: "Error al registrar los stocks.",
      });

      setStockEntries([]);
      setSelectedProviderId("");
      setIsConfirmDialogOpen(false);
    } catch {
      // el toast.promise ya muestra el error
    }
  };

  const removeEntry = (index: number) => {
    setStockEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const openEditEntry = (entry: StockEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const updateEntry = () => {
    if (!editingEntry) return;

    if (editingEntry.cantidad <= 0 || editingEntry.precioCosto <= 0) {
      toast.warning(
        "La cantidad y el precio deben ser números válidos mayores a cero."
      );
      return;
    }

    const updated = {
      ...editingEntry,
      costoTotal: editingEntry.cantidad * editingEntry.precioCosto,
    };

    setStockEntries((prev) =>
      prev.map((entry) =>
        entry.productoId === updated.productoId ? updated : entry
      )
    );

    setIsEditDialogOpen(false);
    setEditingEntry(null);
    toast.success("Entrada actualizada");
  };

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4 text-sm md:text-base"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PRODUCTO */}
          <div className="space-y-2">
            <Label htmlFor="product">Producto</Label>
            <SelectM
              placeholder="Seleccionar producto"
              options={productsInventary.map((product) => ({
                value: product.id.toString(),
                label: `${product.nombre} (${product.codigoProducto})`,
              }))}
              className="basic-select text-black"
              classNamePrefix="select"
              onChange={(selectedOption) => {
                if (selectedOption) {
                  const id = selectedOption.value.toString();
                  setSelectedProductId(id);

                  const selectedProduct = productsInventary.find(
                    (product) => product.id.toString() === id
                  );

                  if (selectedProduct) {
                    setProductToShow({
                      id: selectedProduct.id,
                      nombreProducto: selectedProduct.nombre,
                      precioCostoActual: selectedProduct.precioCostoActual,
                      stock: selectedProduct.stock.map((s) => ({
                        cantidad: s.cantidad,
                        id: s.id,
                        sucursal: {
                          id: s.sucursal.id,
                          nombre: s.sucursal.nombre,
                        },
                      })),
                    });
                    setPrecioCosto(selectedProduct.precioCostoActual);
                  }
                } else {
                  setSelectedProductId("");
                  setProductToShow(null);
                }
              }}
              value={
                selectedProductId
                  ? productsInventary
                      .filter(
                        (product) => product.id.toString() === selectedProductId
                      )
                      .map((product) => ({
                        value: product.id.toString(),
                        label: `${product.nombre} (${product.codigoProducto})`,
                      }))[0]
                  : null
              }
            />
            {errors.product && (
              <p className="text-xs text-red-500">{errors.product}</p>
            )}
          </div>

          {/* PROVEEDOR */}
          <div className="space-y-2">
            <Label htmlFor="provider">Proveedor</Label>
            <Select
              onValueChange={setSelectedProviderId}
              value={selectedProviderId}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    <span className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      {provider.nombre}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provider && (
              <p className="text-xs text-red-500">{errors.provider}</p>
            )}
          </div>

          {/* CANTIDAD */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              id="cantidad"
              type="number"
              min={1}
              inputMode="numeric"
              onWheel={preventWheelChange}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ingrese la cantidad"
            />
            {errors.cantidad && (
              <p className="text-xs text-red-500">{errors.cantidad}</p>
            )}
          </div>

          {/* PRECIO COSTO */}
          <div className="space-y-2">
            <Label htmlFor="precioCosto">Precio de costo producto</Label>
            <Input
              id="precioCosto"
              type="number"
              min={0}
              readOnly
              inputMode="decimal"
              onWheel={preventWheelChange}
              value={precioCosto || ""}
              onChange={(e) => setPrecioCosto(Number(e.target.value))}
              placeholder="Ingrese el precio de costo"
            />
            {errors.precioCosto && (
              <p className="text-xs text-red-500">{errors.precioCosto}</p>
            )}
          </div>

          {/* COSTO TOTAL */}
          <div className="space-y-2">
            <Label htmlFor="costoTotal">Costo total</Label>
            <Input
              id="costoTotal"
              type="text"
              value={formatCurrency(costoTotal)}
              readOnly
            />
          </div>

          {/* FECHAS */}
          <div className="space-y-2">
            <Label className="block">Fecha de ingreso</Label>
            <input
              className="block w-full bg-transparent border rounded-md px-3 py-2 text-sm"
              type="date"
              value={fechaIngreso.toISOString().split("T")[0]}
              onChange={(e) => setFechaIngreso(new Date(e.target.value))}
            />
            {errors.fechaIngreso && (
              <p className="text-xs text-red-500">{errors.fechaIngreso}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="block">Fecha de vencimiento (opcional)</Label>
            <input
              value={
                fechaVencimiento
                  ? fechaVencimiento.toISOString().split("T")[0]
                  : ""
              }
              className="block w-full bg-transparent border rounded-md px-3 py-2 text-sm"
              type="date"
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  const localDate = new Date(`${value}T00:00:00`);
                  setFechaVencimiento(localDate);
                } else {
                  setFechaVencimiento(null);
                }
              }}
            />
          </div>

          {/* RESUMEN PRODUCTO SELECCIONADO */}
          <div className="md:col-span-2">
            {productToShow && (
              <Card className="border border-dashed shadow-none">
                <CardContent className="pt-2 space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {productToShow.nombreProducto}
                    </span>
                    <span>
                      Costo actual:{" "}
                      {formatCurrency(productToShow.precioCostoActual)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <p className="font-semibold text-[color:#7b2c7d]">
                      Stock por sucursal
                    </p>
                    <div className="mt-1 space-y-1">
                      {Object.entries(
                        productToShow.stock.reduce<
                          Record<string, GroupedStock>
                        >((acc, stock) => {
                          const sucursalName = stock.sucursal.nombre;
                          if (!acc[sucursalName]) {
                            acc[sucursalName] = {
                              nombre: sucursalName,
                              cantidad: 0,
                            };
                          }
                          acc[sucursalName].cantidad += stock.cantidad;
                          return acc;
                        }, {})
                      ).map(([sucursalName, { cantidad }]) => (
                        <div
                          key={sucursalName}
                          className="flex justify-between text-xs"
                        >
                          <span>{sucursalName}</span>
                          <span>{cantidad} uds</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Usuario */}
        <div className="flex items-center space-x-2 mt-2 text-xs md:text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Registrado por: {usuarioNombre}
          </span>
        </div>

        {/* BOTONES PRINCIPALES */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            type="button"
            onClick={handleAddEntry}
            className="w-full bg-[color:#7b2c7d] hover:bg-[#8d3390] text-white"
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Agregar a la lista
          </Button>

          <Dialog
            open={isConfirmDialogOpen}
            onOpenChange={setIsConfirmDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-[color:#e2b7b8] text-[color:#7b2c7d]"
                type="button"
                disabled={stockEntries.length === 0}
              >
                <SendIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                Revisar y confirmar lista
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-[850px]">
              <DialogHeader>
                <DialogTitle className="text-center">
                  Confirmar registro de stock
                </DialogTitle>
                <DialogDescription className="text-center text-xs md:text-sm">
                  Revisa los productos, cantidades y totales antes de confirmar.
                  Este movimiento afectará el inventario de la sucursal.
                </DialogDescription>
              </DialogHeader>

              {stockEntries.length > 0 ? (
                <>
                  <div className="mt-4 max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio costo</TableHead>
                          <TableHead>Costo total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockEntries.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {
                                productsInventary.find(
                                  (p) => p.id === entry.productoId
                                )?.nombre
                              }
                            </TableCell>
                            <TableCell>{entry.cantidad}</TableCell>
                            <TableCell>
                              {formatCurrency(entry.precioCosto)}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(entry.costoTotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button
                      variant="secondary"
                      type="button"
                      className="w-full"
                    >
                      Total: {formatCurrency(totalStock)}
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      className="w-full bg-[color:#7b2c7d] hover:bg-[#8d3390] text-white"
                      onClick={handleConfirmSubmit}
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Confirmar registro
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center">No hay productos en la lista.</p>
              )}

              <DialogFooter />
            </DialogContent>
          </Dialog>
        </div>
      </form>

      {/* LISTA DE ENTRADAS */}
      <div className="w-full border border-dashed p-4 rounded-md mt-4">
        <div>
          <h3 className="text-sm md:text-md font-semibold mb-2 text-center">
            Lista de productos por registrar
          </h3>
        </div>

        {stockEntries.length > 0 ? (
          <>
            <div className="mt-4 max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio costo</TableHead>
                    <TableHead>Costo total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockEntries.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {
                          productsInventary.find(
                            (p) => p.id === entry.productoId
                          )?.nombre
                        }
                      </TableCell>
                      <TableCell>{entry.cantidad}</TableCell>
                      <TableCell>{formatCurrency(entry.precioCosto)}</TableCell>
                      <TableCell>{formatCurrency(entry.costoTotal)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Editar entrada"
                          onClick={() => openEditEntry(entry)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="Quitar entrada"
                          onClick={() => removeEntry(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <Button
                variant="secondary"
                type="button"
                className="w-full text-xs md:text-sm"
              >
                Total: {formatCurrency(totalStock)}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-sm">
            Aún no hay productos en la lista.
          </p>
        )}
      </div>

      {/* DIALOG EDITAR ENTRADA PRODUCTO */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              Editar entrada de producto
            </DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cantidad" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="edit-cantidad"
                  type="number"
                  min={1}
                  onWheel={preventWheelChange}
                  value={editingEntry.cantidad}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      cantidad: Number(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-precioCosto" className="text-right">
                  Precio costo
                </Label>
                <Input
                  id="edit-precioCosto"
                  type="number"
                  min={0}
                  onWheel={preventWheelChange}
                  value={editingEntry.precioCosto}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      precioCosto: Number(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={updateEntry}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ===================================================
//  SUBCOMPONENTE: STOCK EMPAQUES
// ===================================================
interface EmpaqueStockSectionProps {
  empaquesInventario: Empaque[];
  proveedores: Provider[];
  sucursalId: number;
  recibidoPorId: number;
  usuarioNombre: string | null;
}

function EmpaqueStockSection({
  empaquesInventario,
  proveedores,
  sucursalId,
  recibidoPorId,
  usuarioNombre,
}: EmpaqueStockSectionProps) {
  const [cantidad, setCantidad] = useState<string>("");
  const [precioCosto, setPrecioCosto] = useState<number>(0);
  const [selectedEmpaqueId, setSelectedEmpaqueId] = useState<string>("");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [stockEntriesEmpaques, setStockEntriesEmpaques] = useState<
    EmpaqueStockEntry[]
  >([]);
  const [editingEmpaqueEntry, setEditingEmpaqueEntry] =
    useState<EmpaqueStockEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [openConfirSendEmpaque, setOpenConfirmSendEmpaque] = useState(false);

  const { mutateAsync: createStockEmpaques, isPending: isSubmitting } =
    useCreateStockEmpaques();

  const totalStockEmpaques = useMemo(
    () =>
      stockEntriesEmpaques.reduce(
        (total, producto) => total + producto.cantidad * producto.precioCosto,
        0
      ),
    [stockEntriesEmpaques]
  );

  const handleAddEmpaqueEntry = () => {
    const cantidadNum = parseInt(cantidad, 10);

    if (!selectedEmpaqueId || !cantidad || isNaN(cantidadNum)) {
      toast.warning(
        "Debe seleccionar un empaque y asignar una cantidad válida."
      );
      return;
    }

    if (cantidadNum <= 0) {
      toast.warning("La cantidad debe ser mayor a cero.");
      return;
    }

    if (precioCosto <= 0 || isNaN(precioCosto)) {
      toast.warning("Debe asignar un precio de costo válido.");
      return;
    }

    const newEntry: EmpaqueStockEntry = {
      empaqueId: parseInt(selectedEmpaqueId, 10),
      cantidad: cantidadNum,
      precioCosto: precioCosto,
      costoTotal: calculateTotalCost(cantidadNum, precioCosto),
      fechaIngreso: new Date().toISOString(),
      fechaVencimiento: undefined,
      proveedorId: parseInt(selectedProviderId, 10),
    };

    if (
      stockEntriesEmpaques.some(
        (entry) => entry.empaqueId === newEntry.empaqueId
      )
    ) {
      toast.warning("Este empaque ya está en la lista.");
      return;
    }

    setStockEntriesEmpaques((prev) => [...prev, newEntry]);
    setCantidad("");
    setPrecioCosto(0);
    setSelectedEmpaqueId("");
    toast.success("Empaque añadido");
  };

  const handleSubmitEmpaques = async () => {
    if (stockEntriesEmpaques.length === 0) {
      toast.error("No hay empaques para registrar.");
      return;
    }

    const proveedorIdNum = Number(selectedProviderId);
    const sucursalIdNum = Number(sucursalId);
    const recibidoPorIdNum = Number(recibidoPorId);

    if (
      isNaN(proveedorIdNum) ||
      isNaN(sucursalIdNum) ||
      isNaN(recibidoPorIdNum) ||
      proveedorIdNum <= 0 ||
      sucursalIdNum <= 0 ||
      recibidoPorIdNum <= 0
    ) {
      toast.error("Faltan datos obligatorios.");
      return;
    }

    for (const entry of stockEntriesEmpaques) {
      if (
        !entry.empaqueId ||
        entry.cantidad <= 0 ||
        entry.precioCosto <= 0 ||
        !entry.fechaIngreso ||
        isNaN(new Date(entry.fechaIngreso).getTime())
      ) {
        toast.error("Verifica los campos de cada empaque.");
        return;
      }
    }

    const payload: CreateStockEmpaquesPayload = {
      proveedorId: proveedorIdNum,
      sucursalId: sucursalIdNum,
      recibidoPorId: recibidoPorIdNum,
      stockEntries: stockEntriesEmpaques.map((entry) => ({
        ...entry,
        fechaVencimiento: entry.fechaVencimiento ?? undefined,
      })),
    };

    try {
      await toast.promise(createStockEmpaques(payload), {
        loading: "Registrando stock de empaques...",
        success: "Stock de empaques registrado con éxito.",
        error: "Error al registrar stock de empaques.",
      });

      setOpenConfirmSendEmpaque(false);
      setSelectedProviderId("");
      setStockEntriesEmpaques([]);
    } catch {
      // toast.promise ya maneja error
    }
  };

  const updateEmpaqueEntry = () => {
    if (!editingEmpaqueEntry) return;

    const { cantidad, precioCosto } = editingEmpaqueEntry;

    if (
      isNaN(cantidad) ||
      cantidad <= 0 ||
      isNaN(precioCosto) ||
      precioCosto <= 0
    ) {
      toast.warning(
        "La cantidad y el precio deben ser números válidos mayores a cero."
      );
      return;
    }

    const updated = {
      ...editingEmpaqueEntry,
      costoTotal: cantidad * precioCosto,
    };

    const updatedEntries = stockEntriesEmpaques.map((entry) =>
      entry.empaqueId === updated.empaqueId ? updated : entry
    );

    setStockEntriesEmpaques(updatedEntries);
    setIsEditDialogOpen(false);
    setEditingEmpaqueEntry(null);
    toast.success("Entrada editada");
  };

  const removeEntryEmpaque = (index: number) => {
    setStockEntriesEmpaques((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Empaque */}
          <div className="space-y-2">
            <Label htmlFor="empaque">Empaque</Label>
            <SelectM
              isClearable
              placeholder="Seleccionar empaque"
              options={empaquesInventario.map((empaque) => ({
                value: empaque.id.toString(),
                label: `${empaque.nombre} (${empaque.codigoProducto})`,
              }))}
              className="basic-select text-black"
              classNamePrefix="select"
              onChange={(selectedOption) => {
                if (selectedOption) {
                  setSelectedEmpaqueId(selectedOption.value);
                  const selected = empaquesInventario.find(
                    (e) => e.id.toString() === selectedOption.value
                  );
                  if (selected) {
                    setPrecioCosto(selected.precioCosto ?? 0);
                  }
                } else {
                  setSelectedEmpaqueId("");
                  setPrecioCosto(0);
                }
              }}
              value={
                selectedEmpaqueId
                  ? empaquesInventario
                      .filter((e) => e.id.toString() === selectedEmpaqueId)
                      .map((e) => ({
                        value: e.id.toString(),
                        label: `${e.nombre} (${e.codigoProducto})`,
                      }))[0]
                  : null
              }
            />
          </div>

          {/* Proveedor */}
          <div className="space-y-2">
            <Label htmlFor="provider-empaque">Proveedor</Label>
            <Select
              onValueChange={setSelectedProviderId}
              value={selectedProviderId}
            >
              <SelectTrigger id="provider-empaque">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id.toString()}>
                    <span className="flex items-center">
                      <Truck className="mr-2 h-4 w-4" />
                      {provider.nombre}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad-empaque">Cantidad</Label>
            <Input
              id="cantidad-empaque"
              type="number"
              min={1}
              inputMode="numeric"
              onWheel={preventWheelChange}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ingrese la cantidad"
            />
          </div>

          {/* Precio costo */}
          <div className="space-y-2">
            <Label htmlFor="precioCosto-empaque">Precio de costo empaque</Label>
            <Input
              id="precioCosto-empaque"
              type="number"
              min={0}
              onWheel={preventWheelChange}
              value={precioCosto || ""}
              onChange={(e) => setPrecioCosto(Number(e.target.value))}
              placeholder="Ingrese el precio de costo"
            />
          </div>

          {/* Costo total */}
          <div className="space-y-2">
            <Label htmlFor="costoTotal-empaque">Costo total</Label>
            <Input
              id="costoTotal-empaque"
              type="text"
              readOnly
              value={formatCurrency(
                calculateTotalCost(Number(cantidad || "0"), precioCosto)
              )}
            />
          </div>
        </div>

        {/* Usuario */}
        <div className="flex items-center space-x-2 mt-2 text-xs md:text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Registrado por: {usuarioNombre}
          </span>
        </div>

        <div className="mt-4 flex flex-col md:flex-row gap-3">
          <Button
            type="button"
            onClick={handleAddEmpaqueEntry}
            className="w-full bg-[color:#7b2c7d] hover:bg-[#8d3390] text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar a la lista
          </Button>

          <Dialog
            open={openConfirSendEmpaque}
            onOpenChange={setOpenConfirmSendEmpaque}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full border-[color:#e2b7b8] text-[color:#7b2c7d]"
                type="button"
                disabled={stockEntriesEmpaques.length === 0}
              >
                <SendIcon className="mr-2 h-4 w-4" />
                Revisar y confirmar lista
              </Button>
            </DialogTrigger>

            <DialogContent className="w-full max-w-[800px]">
              <DialogHeader>
                <DialogTitle className="text-center">
                  Confirmar stock de empaques
                </DialogTitle>
                <DialogDescription className="text-center text-xs md:text-sm">
                  Revisa los empaques antes de confirmar el movimiento.
                </DialogDescription>
              </DialogHeader>

              {stockEntriesEmpaques.length > 0 ? (
                <>
                  <div className="mt-4 max-h-72 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empaque</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio costo</TableHead>
                          <TableHead>Costo total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockEntriesEmpaques.map((entry, index) => {
                          const empaque = empaquesInventario.find(
                            (e) => e.id === entry.empaqueId
                          );

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {empaque?.nombre ?? "Empaque desconocido"}
                              </TableCell>
                              <TableCell>{entry.cantidad}</TableCell>
                              <TableCell>
                                {formatCurrency(entry.precioCosto)}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(entry.costoTotal)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Button
                      variant="secondary"
                      type="button"
                      className="w-full"
                    >
                      Total: {formatCurrency(totalStockEmpaques)}
                    </Button>
                    <Button
                      disabled={isSubmitting}
                      className="w-full bg-[color:#7b2c7d] hover:bg-[#8d3390] text-white"
                      onClick={handleSubmitEmpaques}
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          Registrando...
                        </>
                      ) : (
                        <>
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Confirmar registro
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-center text-muted-foreground">
                  No hay empaques seleccionados.
                </p>
              )}

              <DialogFooter />
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabla de revisión */}
        {stockEntriesEmpaques.length > 0 ? (
          <>
            <div className="mt-6 max-h-72 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empaque</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio costo</TableHead>
                    <TableHead>Costo total</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockEntriesEmpaques.map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {
                          empaquesInventario.find(
                            (e) => e.id === entry.empaqueId
                          )?.nombre
                        }
                      </TableCell>
                      <TableCell>{entry.cantidad}</TableCell>
                      <TableCell>{formatCurrency(entry.precioCosto)}</TableCell>
                      <TableCell>{formatCurrency(entry.costoTotal)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingEmpaqueEntry(entry);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEntryEmpaque(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <Button variant="secondary" type="button" className="w-full">
                Total: {formatCurrency(totalStockEmpaques)}
              </Button>
            </div>
          </>
        ) : (
          <p className="text-center text-sm">
            Seleccione empaques para añadir stock.
          </p>
        )}
      </form>

      {/* Dialog editar empaque */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-center">
              Editar entrada de empaque
            </DialogTitle>
          </DialogHeader>
          {editingEmpaqueEntry && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-cantidad-emp" className="text-right">
                  Cantidad
                </Label>
                <Input
                  id="edit-cantidad-emp"
                  type="number"
                  min={1}
                  onWheel={preventWheelChange}
                  value={editingEmpaqueEntry.cantidad}
                  onChange={(e) =>
                    setEditingEmpaqueEntry({
                      ...editingEmpaqueEntry,
                      cantidad: Number(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-precioCosto-emp" className="text-right">
                  Precio costo
                </Label>
                <Input
                  id="edit-precioCosto-emp"
                  type="number"
                  min={0}
                  onWheel={preventWheelChange}
                  value={editingEmpaqueEntry.precioCosto}
                  onChange={(e) =>
                    setEditingEmpaqueEntry({
                      ...editingEmpaqueEntry,
                      precioCosto: Number(e.target.value),
                    })
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={updateEmpaqueEntry}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
