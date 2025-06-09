import { useState, useEffect } from "react";
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
import SelectM from "react-select"; // Importación correcta de react-select

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
  nombre: string; // Name of the branch
  cantidad: number; // Total quantity of stock
}
interface EmpaqueStockEntry {
  empaqueId: number;
  cantidad: number;
  precioCosto: number;
  costoTotal: number;
  fechaIngreso: string;
  fechaVencimiento?: string;
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
  id?: number; // Opcional, depende de si llenas el stock
  cantidad?: number; // Opcional
  // Puedes agregar más propiedades si necesitas detalles de la sucursal o del stock
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

export default function Stock() {
  const [cantidad, setCantidad] = useState<string>("");
  const [precioCosto, setPrecioCosto] = useState<number>(0);
  // const [precioCosto, setPrecioCosto] = useState<number | "">(""); // Permite un estado vacío inicial o un número
  const [costoTotal, setCostoTotal] = useState<number>(0);
  const [fechaIngreso, setFechaIngreso] = useState<Date>(new Date());
  const [fechaVencimiento, setFechaVencimiento] = useState<Date | null>();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedProviderId, setSelectedProviderId] = useState<string>("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<StockEntry | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const [isDialogInspect, setIsDialogInspect] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const sucursalId = useStore((state) => state.sucursalId);
  const recibidoPorId = useStore((state) => state.userId);
  const usuarioNombre = useStore((state) => state.userNombre);
  console.log("Lo que vamos a enviar es: ", stockEntries);

  const calculateTotalCost = (
    cantidad: number,
    precioCosto: number
  ): number => {
    const cantidadNum = parseFloat(cantidad.toString());
    const precioCostoNum = parseFloat(precioCosto.toString());

    if (!isNaN(cantidadNum) && !isNaN(precioCostoNum)) {
      return cantidadNum * precioCostoNum;
    } else {
      return 0;
    }
  };

  useEffect(() => {
    const cantidadNum = parseFloat(cantidad);
    const precioCostoNum = precioCosto;

    if (!isNaN(cantidadNum) && !isNaN(precioCostoNum)) {
      setCostoTotal(cantidadNum * precioCostoNum);
    } else {
      setCostoTotal(0);
    }
  }, [cantidad, precioCosto, editingEntry]);

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

  const handleAddEntry = () => {
    if (validateForm()) {
      const newEntry: StockEntry = {
        productoId: parseInt(selectedProductId),
        cantidad: parseInt(cantidad),
        costoTotal: calculateTotalCost(parseInt(cantidad), precioCosto), // Usa la nueva función
        fechaIngreso: fechaIngreso.toISOString(),
        fechaVencimiento: fechaVencimiento?.toISOString(),
        precioCosto: precioCosto,
        proveedorId: parseInt(selectedProviderId),
      };

      if (
        stockEntries.some((prod) => prod.productoId === newEntry.productoId)
      ) {
        toast.info("El producto ya está en la lista. Añade uno nuevo");
        return;
      }

      if (newEntry.cantidad <= 0 || newEntry.precioCosto <= 0) {
        toast.warning("No se permiten valores negativo o menores a cero");
        return;
      }

      if (isNaN(newEntry.cantidad) || isNaN(newEntry.precioCosto)) {
        // Manejar el caso donde los valores no son números válidos
        console.error("Valores no numéricos ingresados.");
        return;
      }
      setStockEntries([...stockEntries, newEntry]);
      resetForm();
      toast.success("Producto añadido");
      setProductToShow(null);
    }
  };

  const resetForm = () => {
    setSelectedProductId(""); // Reseteamos el valor del select a un valor vacío
    setCantidad(""); // Reseteamos la cantidad
    setPrecioCosto(0); // Reseteamos el precio de costo
    setFechaIngreso(new Date()); // Reseteamos la fecha de ingreso
    setFechaVencimiento(null); // Reseteamos la fecha de vencimiento
    setErrors({});
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting || isDisableSubmit) return;

    setIsDisableSubmit(true);
    setIsSubmitting(true);

    if (stockEntries.some((stock) => stock.cantidad <= 0)) {
      toast.warning("Las adiciones no deben ser negativas");
      setIsSubmitting(false);
      setIsDisableSubmit(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/stock`, {
        stockEntries,
        proveedorId: Number(selectedProviderId),
        sucursalId,
        recibidoPorId,
      });

      if (response.status === 201) {
        toast.success("Stocks añadidos exitosamente");

        setStockEntries([]);
        setIsDialogInspect(false);
        setSelectedProviderId("");
      }
    } catch (error) {
      console.error("Error al registrar los stocks:", error);
      toast.error("Error al registrar los stocks");
    } finally {
      setIsSubmitting(false);
      setIsDisableSubmit(false);
    }
  };

  const removeEntry = (index: number) => {
    setStockEntries(stockEntries.filter((_, i) => i !== index));
  };

  const editEntry = (entry: StockEntry) => {
    setEditingEntry(entry);
    setIsEditDialogOpen(true);
  };

  const [productsInventary, setProductsInventary] = useState<
    ProductsInventary[]
  >([]);

  const [productToShow, setProductToShow] = useState<ProductoSelect | null>(
    null
  );

  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/products/for-inventary`
      );
      if (response.status === 200) {
        setProductsInventary(response.data);
        console.log("la data es: ", response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir los productos");
    }
  };
  const [proveedores, setProveedores] = useState<Provider[]>();
  const getProviders = async () => {
    try {
      const response = await axios.get(`${API_URL}/proveedor/`);
      if (response.status === 200) {
        setProveedores(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir los productos");
    }
  };

  const [empaquesInventario, setEmpaquesInventario] = useState<Empaque[]>([]);

  const getEmpaques = async () => {
    try {
      const response = await axios.get(`${API_URL}/empaque`);

      if (response.status === 200) {
        setEmpaquesInventario(response.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getProducts();
    getProviders();
    getEmpaques();
  }, []);

  const totalStock = stockEntries.reduce(
    (total, producto) => total + producto.cantidad * producto.precioCosto,
    0
  );
  //STOCK DE EMPAQUES

  const [isDisableSubmit, setIsDisableSubmit] = useState(false);
  const [selectedEmpaqueId, setSelectedEmpaqueId] = useState<string>("");
  // const [empaqueToShow, setEmpaqueToShow] = useState<Empaque | null>(null);

  const [stockEntrieseEmpaque, setStockEntriesEmpaques] = useState<
    EmpaqueStockEntry[]
  >([]);

  const [editingEmpaqueEntry, setEditingEmpaqueEntry] =
    useState<EmpaqueStockEntry | null>(null);

  const handleAddEmpaqueEntry = () => {
    const cantidadNum = parseInt(cantidad);

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

    if (!fechaIngreso) {
      toast.warning("Debe seleccionar la fecha de ingreso.");
      return;
    }

    const newEntry: EmpaqueStockEntry = {
      empaqueId: parseInt(selectedEmpaqueId),
      cantidad: cantidadNum,
      precioCosto: precioCosto,
      costoTotal: calculateTotalCost(cantidadNum, precioCosto),
      fechaIngreso: fechaIngreso.toISOString(),
      fechaVencimiento: fechaVencimiento?.toISOString(),
      proveedorId: parseInt(selectedProviderId),
    };

    if (
      stockEntrieseEmpaque.some(
        (entry) => entry.empaqueId === newEntry.empaqueId
      )
    ) {
      toast.warning("Este empaque ya está en la lista.");
      return;
    }

    setStockEntriesEmpaques([...stockEntrieseEmpaque, newEntry]);
    resetForm();
    setSelectedEmpaqueId("");
    setPrecioCosto(0);
    toast.success("Empaque añadido");
  };

  console.log("el stock a enviar es: ", stockEntrieseEmpaque);

  const [openConfirSendEmpaque, setOpenConfirmSendEmpaque] = useState(false);
  // const [submitingEmpaques, setSubmitingEmpaques]=useState(false)
  const handleSubmitEmpaques = async () => {
    if (isSubmitting || isDisableSubmit) return;

    setIsDisableSubmit(true);
    setIsSubmitting(true);

    if (stockEntrieseEmpaque.length === 0) {
      toast.error("No hay empaques para registrar.");
      setIsDisableSubmit(false);
      setIsSubmitting(false);
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
      setIsDisableSubmit(false);
      setIsSubmitting(false);
      return;
    }

    for (const entry of stockEntrieseEmpaque) {
      if (
        !entry.empaqueId ||
        entry.cantidad <= 0 ||
        entry.precioCosto <= 0 ||
        !entry.fechaIngreso ||
        isNaN(new Date(entry.fechaIngreso).getTime())
      ) {
        toast.error("Verifica los campos de cada empaque.");
        setIsDisableSubmit(false);
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const payload = {
        proveedorId: proveedorIdNum,
        sucursalId: sucursalIdNum,
        recibidoPorId: recibidoPorIdNum,
        stockEntries: stockEntrieseEmpaque.map((entry) => ({
          empaqueId: entry.empaqueId,
          cantidad: entry.cantidad,
          precioCosto: entry.precioCosto,
          costoTotal: entry.costoTotal,
          fechaIngreso: entry.fechaIngreso,
          fechaVencimiento: entry.fechaVencimiento ?? null,
          proveedorId: entry.proveedorId,
        })),
      };

      const response = await axios.post(`${API_URL}/stock/empaques`, payload);

      if (response.status === 201 || response.status === 200) {
        toast.success("Stock de empaques registrado con éxito.");

        // ✅ Limpieza de estado después del éxito
        setOpenConfirmSendEmpaque(false);
        setSelectedProviderId("");
        setStockEntriesEmpaques([]);
      }
    } catch (error) {
      console.error("Error al registrar stock:", error);
      toast.error("Error al registrar stock.");
    } finally {
      // ✅ Siempre se ejecuta, éxito o error
      setIsSubmitting(false);
      setIsDisableSubmit(false);
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

    const updatedEntries = stockEntrieseEmpaque.map((entry) =>
      entry.empaqueId === updated.empaqueId ? updated : entry
    );

    setStockEntriesEmpaques(updatedEntries);
    setIsEditDialogOpen(false);
    setEditingEmpaqueEntry(null);
    toast.success("Entrada editada");
  };

  const removeEntryEmpaque = (index: number) => {
    setStockEntriesEmpaques(stockEntrieseEmpaque.filter((_, i) => i !== index));
  };

  const totalStockEmpaques = stockEntrieseEmpaque.reduce(
    (total, producto) => total + producto.cantidad * producto.precioCosto,
    0
  );

  return (
    <>
      {" "}
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Agregar Stock de Producto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
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
                        setSelectedProductId(selectedOption.value.toString());
                        const selectedProduct = productsInventary.find(
                          (product) =>
                            product.id.toString() ===
                            selectedOption.value.toString()
                        );

                        if (selectedProduct) {
                          setProductToShow({
                            id: selectedProduct.id,
                            nombreProducto: selectedProduct.nombre,
                            precioCostoActual:
                              selectedProduct.precioCostoActual,
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
                        setProductToShow(null); // Resetea el valor si no hay selección
                      }
                    }}
                    value={
                      selectedProductId
                        ? productsInventary
                            .filter(
                              (product) =>
                                product.id.toString() === selectedProductId
                            )
                            .map((product) => ({
                              value: product.id.toString(),
                              label: `${product.nombre} (${product.codigoProducto})`,
                            }))[0]
                        : null // Si no hay valor seleccionado, el select queda vacío
                    }
                  />
                  {errors.product && (
                    <p className="text-sm text-red-500">{errors.product}</p>
                  )}
                </div>
              </div>

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
                    {proveedores &&
                      proveedores.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.id.toString()}
                        >
                          <span className="flex items-center">
                            <Truck className="mr-2 h-4 w-4" />
                            {provider.nombre}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.provider && (
                  <p className="text-sm text-red-500">{errors.provider}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ingrese la cantidad"
                />
                {errors.cantidad && (
                  <p className="text-sm text-red-500">{errors.cantidad}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="precioCosto">Precio de costo producto</Label>
                <Input
                  id="precioCosto"
                  type="number"
                  readOnly
                  value={precioCosto || ""} // Asegura que sea un string si está vacío
                  onChange={(e) => setPrecioCosto(Number(e.target.value))}
                  placeholder="Ingrese el precio de costo"
                />

                {errors.precioCosto && (
                  <p className="text-sm text-red-500">{errors.precioCosto}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="costoTotal">Costo total</Label>
                <Input
                  id="costoTotal"
                  type="number"
                  value={costoTotal.toFixed(2)}
                  readOnly
                  className=""
                />
              </div>
              <div className="space-y-2 block">
                <Label className="block">Fecha de ingreso</Label>{" "}
                {/* Se asegura que Label esté en bloque */}
                <input
                  className="block w-full bg-transparent"
                  type="date"
                  onChange={(e) => setFechaIngreso(new Date(e.target.value))}
                />
                {errors.fechaIngreso && (
                  <p className="text-sm text-red-500">{errors.fechaIngreso}</p>
                )}
              </div>
              <div className="space-y-2 block">
                <Label className="block">Fecha de vencimiento (opcional)</Label>
                <input
                  value={
                    fechaVencimiento
                      ? fechaVencimiento.toISOString().split("T")[0]
                      : ""
                  }
                  className="block w-full bg-transparent"
                  type="date"
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value) {
                      // Crea la fecha en zona horaria local (medianoche en Guatemala)
                      const localDate = new Date(`${value}T00:00:00`);
                      setFechaVencimiento(localDate);
                    } else {
                      setFechaVencimiento(null);
                    }
                  }}
                />
                {errors.fechaVencimiento && (
                  <p className="text-sm text-red-500">
                    {errors.fechaVencimiento}
                  </p>
                )}
              </div>
              <div className="space-y-2 block">
                {productToShow && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-md">
                        Stocks disponibles
                      </CardTitle>
                      <CardDescription>Existencias disponibles</CardDescription>
                      <CardContent>
                        <div className="mt-4">
                          {Object.entries(
                            productToShow.stock.reduce<
                              Record<string, GroupedStock>
                            >((acc, stock) => {
                              // Group by sucursal name and sum quantities
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
                              className="flex justify-between"
                            >
                              <span className="text-sm">{sucursalName}</span>
                              <span className="text-sm">{cantidad} uds</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CardHeader>
                  </Card>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Registrado por: {usuarioNombre}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Button type="button" onClick={handleAddEntry} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Agregar a la lista
              </Button>
              {/* BOTON PARA ACCIONAR EL VER LA LISTA DE PRODUCTOS */}

              <Dialog open={isDialogInspect} onOpenChange={setIsDialogInspect}>
                <DialogTrigger asChild>
                  <Button
                    variant={"destructive"}
                    className="w-full"
                    type="button"
                  >
                    <SendIcon className="mr-2 h-4 w-4" />
                    Añadir lista
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full max-w-[800px]">
                  <DialogHeader>
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Productos a añadirles stock
                    </h3>
                  </DialogHeader>

                  {stockEntries.length > 0 ? (
                    <>
                      {/* Contenedor scrolleable solo para los productos */}
                      <div className="mt-8 max-h-72 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Producto</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio Costo</TableHead>
                              <TableHead>Costo Total</TableHead>
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
                                  {new Intl.NumberFormat("es-GT", {
                                    style: "currency",
                                    currency: "GTQ",
                                  }).format(entry.precioCosto)}
                                </TableCell>
                                <TableCell>
                                  {new Intl.NumberFormat("es-GT", {
                                    style: "currency",
                                    currency: "GTQ",
                                  }).format(entry.costoTotal)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Botones y totales fuera del contenedor scrolleable */}
                      <div className="mt-4">
                        <Button
                          variant={"secondary"}
                          type="button"
                          className="w-full"
                        >
                          {totalStock ? (
                            <>
                              Total:{" "}
                              {new Intl.NumberFormat("es-GT", {
                                style: "currency",
                                currency: "GTQ",
                              }).format(totalStock)}
                            </>
                          ) : (
                            "Seleccione productos"
                          )}
                        </Button>
                        <Button
                          disabled={isDisableSubmit}
                          className="w-full mt-4"
                          onClick={() => {
                            handleSubmit();
                          }}
                        >
                          <PackagePlus className="mr-2 h-4 w-4" />
                          Confirmar registro
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="text-center justify-center">
                      Seleccione productos a añadir stock
                    </p>
                  )}

                  <DialogFooter className="flex text-center items-center justify-center">
                    <DialogDescription className="text-center"></DialogDescription>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </form>

          <div className="w-full  border p-4 rounded-md mt-2">
            <div>
              <h3 className="text-md font-semibold mb-4 text-center">Lista</h3>
            </div>

            {stockEntries.length > 0 ? (
              <>
                {/* Contenedor scrolleable solo para los productos */}
                <div className="mt-8 max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Costo</TableHead>
                        <TableHead>Costo Total</TableHead>
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
                          <TableCell>
                            {new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(entry.precioCosto)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(entry.costoTotal)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editEntry(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
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

                {/* Botones y totales fuera del contenedor scrolleable */}
                <div className="mt-4">
                  <Button
                    variant={"secondary"}
                    type="button"
                    className="w-full"
                  >
                    {totalStock ? (
                      <>
                        Total:{" "}
                        {new Intl.NumberFormat("es-GT", {
                          style: "currency",
                          currency: "GTQ",
                        }).format(totalStock)}
                      </>
                    ) : (
                      "Seleccione productos"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center justify-center">
                Seleccione productos a añadir stock
              </p>
            )}
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-center">
                  Editar Empaque
                </DialogTitle>
              </DialogHeader>
              {editingEmpaqueEntry && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-cantidad" className="text-right">
                      Cantidad
                    </Label>
                    <Input
                      id="edit-cantidad"
                      type="number"
                      value={editingEmpaqueEntry.cantidad}
                      onChange={(e) =>
                        setEditingEmpaqueEntry({
                          ...editingEmpaqueEntry,
                          cantidad: parseInt(e.target.value),
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-precioCosto" className="text-right">
                      Precio Costo
                    </Label>
                    <Input
                      id="edit-precioCosto"
                      type="number"
                      value={editingEmpaqueEntry.precioCosto}
                      onChange={(e) =>
                        setEditingEmpaqueEntry({
                          ...editingEmpaqueEntry,
                          precioCosto: parseFloat(e.target.value),
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
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
      {/* EMPAQUE STOCK */}
      <div className="py-5"></div>
      <Card className="w-full max-w-4xl mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold">
            Agregar Stock de Empaque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selección de Empaque */}
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
                <Label htmlFor="provider">Proveedor</Label>
                <Select
                  onValueChange={setSelectedProviderId}
                  value={selectedProviderId}
                >
                  <SelectTrigger id="provider">
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {proveedores &&
                      proveedores.map((provider) => (
                        <SelectItem
                          key={provider.id}
                          value={provider.id.toString()}
                        >
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
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input
                  id="cantidad"
                  type="number"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ingrese la cantidad"
                />
              </div>

              {/* Precio de costo */}
              <div className="space-y-2">
                <Label htmlFor="precioCosto">Precio de costo empaque</Label>
                <Input
                  id="precioCosto"
                  type="number"
                  value={precioCosto || ""}
                  onChange={(e) => setPrecioCosto(Number(e.target.value))}
                  placeholder="Ingrese el precio de costo"
                />
              </div>

              {/* Costo total */}
              <div className="space-y-2">
                <Label htmlFor="costoTotal">Costo total</Label>
                <Input
                  id="costoTotal"
                  type="number"
                  value={(parseFloat(cantidad || "0") * precioCosto).toFixed(2)}
                  readOnly
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Registrado por: {usuarioNombre}
              </span>
            </div>

            <div className="mt-4 flex gap-4">
              <Button
                type="button"
                onClick={handleAddEmpaqueEntry}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> Agregar a la lista
              </Button>

              <Dialog
                open={openConfirSendEmpaque}
                onOpenChange={setOpenConfirmSendEmpaque}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full"
                    type="button"
                  >
                    <SendIcon className="mr-2 h-4 w-4" />
                    Añadir lista
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-full max-w-[800px]">
                  <DialogHeader>
                    <h3 className="text-lg font-semibold mb-4 text-center">
                      Confirmar stock de empaques
                    </h3>
                  </DialogHeader>

                  {stockEntrieseEmpaque.length > 0 ? (
                    <>
                      {/* Tabla de revisión de stock */}
                      <div className="mt-8 max-h-72 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Empaque</TableHead>
                              <TableHead>Cantidad</TableHead>
                              <TableHead>Precio Costo</TableHead>
                              <TableHead>Costo Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stockEntrieseEmpaque.map((entry, index) => {
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
                                    {new Intl.NumberFormat("es-GT", {
                                      style: "currency",
                                      currency: "GTQ",
                                    }).format(entry.precioCosto)}
                                  </TableCell>
                                  <TableCell>
                                    {new Intl.NumberFormat("es-GT", {
                                      style: "currency",
                                      currency: "GTQ",
                                    }).format(entry.costoTotal)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Totales y botón de envío */}
                      <div className="mt-4">
                        <Button
                          variant="secondary"
                          type="button"
                          className="w-full"
                        >
                          Total:{" "}
                          {new Intl.NumberFormat("es-GT", {
                            style: "currency",
                            currency: "GTQ",
                          }).format(totalStockEmpaques)}
                        </Button>
                        <Button
                          disabled={isDisableSubmit}
                          className="w-full mt-4"
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

                  <DialogFooter className="text-center" />
                </DialogContent>
              </Dialog>
            </div>

            {/* Tabla de revisión de stockEntries */}
            {stockEntrieseEmpaque.length > 0 ? (
              <>
                <div className="mt-8 max-h-72 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empaque</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Costo</TableHead>
                        <TableHead>Costo Total</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockEntrieseEmpaque.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {
                              empaquesInventario.find(
                                (e) => e.id === entry.empaqueId
                              )?.nombre
                            }
                          </TableCell>
                          <TableCell>{entry.cantidad}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(entry.precioCosto)}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("es-GT", {
                              style: "currency",
                              currency: "GTQ",
                            }).format(entry.costoTotal)}
                          </TableCell>
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
                    {totalStockEmpaques ? (
                      <>
                        Total:{" "}
                        {new Intl.NumberFormat("es-GT", {
                          style: "currency",
                          currency: "GTQ",
                        }).format(totalStockEmpaques)}
                      </>
                    ) : (
                      "Seleccione empaques"
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-center justify-center">
                Seleccione empaques a añadir stock
              </p>
            )}
          </form>
        </CardContent>
      </Card>
      {/* DIALOG DE CONFIRMACION DE ENVIO STOCK EMPAQUE */}
    </>
  );
}
