import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  Barcode,
  CheckCircle2,
  CirclePlus,
  Delete,
  Home,
  Printer,
  Receipt,
  Search,
  ShoppingBag,
  Trash2,
  User,
  UserPlus,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import React from "react";
import { useStore } from "@/components/Context/ContextSucursal";

import SelectM from "react-select";
import { Link } from "react-router-dom";

import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// 🔑 NUEVOS HOOKS
import {
  useGetEmpaques,
  useGetClientes,
  useGetProductosBySucursal,
} from "@/hooks/useHooks/useVentaQueries";
import {
  useCreatePriceRequest,
  useCreateVenta,
  Venta,
} from "@/hooks/useHooks/useVentaMutations";
import { getApiErrorMessageAxios } from "./Utils/apiAxiosError";

dayjs.extend(localizedFormat);
dayjs.locale("es");

function formatearFechaUTC(fecha: string) {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
}

// ========================================>
// Tipos locales para el componente
type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
};

type Precios = {
  id: number;
  precio: number;
  orden: number;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta?: number;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  stock: Stock[];
  precios: Precios[];
};

interface CartItem extends Producto {
  quantity: number;
  selectedPriceId: number;
  selectedPrice: number;
}

interface Customer {
  id: number;
  nombre: string;
  telefono?: string;
  dpi?: string;
}

interface CustomerOption {
  value: number;
  label: string;
}
// Devuelve el precio "base": primero por orden, luego por valor
const getBasePrice = (precios: Precios[] = []) => {
  if (!precios || precios.length === 0) {
    return { id: 0, precio: 0, sorted: [] as Precios[] };
  }

  const sorted = [...precios].sort((a, b) => {
    // Si ambos tienen orden, usamos orden
    if (a.orden != null && b.orden != null && a.orden !== b.orden) {
      return a.orden - b.orden;
    }
    // Fallback por precio más bajo
    return a.precio - b.precio;
  });

  const best = sorted[0];
  return { id: best.id, precio: best.precio, sorted };
};

export default function PuntoVenta() {
  const userId = useStore((state) => state.userId) ?? 0;
  const rawSucursalId = useStore((state) => state.sucursalId);
  const sucursalId = rawSucursalId ?? 0;

  // =======================
  // NUEVOS HOOKS DE DATA
  // =======================
  const {
    data: productos = [],
    // isLoading: isLoadingProductos,
    // isFetching: isFetchingProductos,
  } = useGetProductosBySucursal(rawSucursalId);

  const {
    data: empaques = [],
    // isLoading: isLoadingEmpaques
  } = useGetEmpaques();

  const {
    data: clients = [],
    // isLoading: isLoadingClientes
  } = useGetClientes();

  // MUTATIONS
  const { mutateAsync: createVenta, isPending: isCreatingVenta } =
    useCreateVenta();

  const { mutateAsync: createPriceRequest, isPending: isCreatingPriceRequest } =
    useCreatePriceRequest();

  // =======================
  // ESTADO LOCAL
  // =======================
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("CONTADO");

  const [openSection, setOpenSection] = useState(false);
  const [ventaResponse, setventaResponse] = useState<Venta | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [openEmpaques, setOpenEmpaques] = useState(false);

  const [nombre, setNombre] = useState<string>("");
  const [dpi, setDpi] = useState<string>("");
  const [imei, setImei] = useState<string>("");

  const [telefono, setTelefono] = useState<string>("");
  const [direccion, setDireccion] = useState<string>("");

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [precioReques, setPrecioRequest] = useState<number | null>(null);
  const [openReques, setOpenRequest] = useState(false);

  const [selectedCustomerID, setSelectedCustomerID] = useState<Customer | null>(
    null
  );

  const [activeTab, setActiveTab] = useState("existing");

  const [empaquesUsados, setEmpaquesUsados] = useState<
    { id: number; quantity: number }[]
  >([]);

  const [filterEmpaques, setFilterEmpaques] = useState<string>("");

  const handleClose = () => {
    setOpenSection(false);
  };

  // =======================
  // LÓGICA CARRITO
  // =======================
  const addToCart = (product: Producto) => {
    const existingItem = cart.find((item) => item.id === product.id);

    // Ordenamos precios y escogemos el base
    const {
      id: basePriceId,
      precio: basePrice,
      sorted,
    } = getBasePrice(product.precios);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newCartItem: CartItem = {
        ...product,
        precios: sorted, // dejamos los precios ya ordenados
        quantity: 1,
        selectedPriceId: basePriceId,
        selectedPrice: basePrice,
      };

      setCart((prev) => [...prev, newCartItem]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: number, newQuantity: number) => {
    setCart(
      cart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = (): number => {
    return cart.reduce(
      (total, item) => total + item.selectedPrice * item.quantity,
      0
    );
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredProducts = productos.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updatePrice = (productId: number, newPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              selectedPrice: newPrice,
              selectedPriceId:
                item.precios.find((price) => price.precio === newPrice)?.id ||
                item.selectedPriceId,
            }
          : item
      )
    );
  };

  // =======================
  // PRICE REQUEST
  // =======================
  const handleMakeRequest = async () => {
    if (precioReques && precioReques <= 0) {
      toast.info("La cantidad a solicitar no debe ser negativa");
      return;
    }

    if (!selectedProductId) {
      toast.info("Debe seleccionar un producto primero");
      return;
    }

    try {
      await createPriceRequest({
        productoId: Number(selectedProductId),
        precioSolicitado: precioReques,
        solicitadoPorId: userId,
      });

      toast.success(
        "Solicitud enviada, esperando respuesta del administrador..."
      );
      setPrecioRequest(null);
      setSelectedProductId("");
      setOpenRequest(false);
    } catch (error) {
      console.log(error);
      toast.error("Algo salió mal");
    }
  };

  // =======================
  // CLIENTES (react-select)
  // =======================
  const handleChange = (selectedOption: CustomerOption | null) => {
    const selectedCustomer = selectedOption
      ? clients.find((customer) => customer.id === selectedOption.value) || null
      : null;
    setSelectedCustomerID(selectedCustomer);
  };

  const customerOptions = clients.map((customer) => ({
    value: customer.id,
    label: `${customer.nombre} ${
      customer.telefono ? `(${customer.telefono})` : ""
    } ${customer.dpi ? `DPI: ${customer.dpi}` : ""} ${
      (customer as any).iPInternet ? `IP: ${(customer as any).iPInternet}` : ""
    }`,
  }));

  // =======================
  // FORMATO
  // =======================
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(amount);
  };

  const updateEmpaqueQuantity = (id: number, quantity: number) => {
    setEmpaquesUsados((prev) => {
      const exists = prev.find((e) => e.id === id);
      if (exists) {
        return prev.map((e) => (e.id === id ? { ...e, quantity } : e));
      }
      return [...prev, { id, quantity }];
    });
  };

  const removeEmpaque = (packId: number) => {
    const filterWithOutPack = empaquesUsados.filter(
      (pack) => pack.id !== packId
    );
    setEmpaquesUsados(filterWithOutPack);
  };

  const totalEmpuesSeleccionados = empaquesUsados.reduce(
    (total, acc) => total + acc.quantity,
    0
  );

  const totalProductos = cart.reduce((total, acc) => total + acc.quantity, 0);

  const filteredEmpaques = useMemo(() => {
    const estandarFilter = filterEmpaques.toLocaleLowerCase().trim();
    const matchesFiltered = empaques.filter(
      (pack) =>
        pack.nombre.trim().toLowerCase().includes(estandarFilter) ||
        pack.codigoProducto.trim().toLowerCase().includes(estandarFilter)
    );

    return matchesFiltered;
  }, [filterEmpaques, empaques]);

  // =======================
  // COMPLETAR VENTA (mutation)
  // =======================
  const handleCompleteSale = async () => {
    // 1) Validaciones básicas de usuario/sucursal
    if (!userId || !rawSucursalId) {
      toast.error(
        "No se puede registrar la venta: sucursal o usuario no válidos."
      );
      return;
    }

    // 2) Definir método de pago con fallback a CONTADO
    // Asegúrate que estos strings coinciden EXACTO con tu enum MetodoPago del backend
    const metodoPago = (paymentMethod || "CONTADO") as
      | "CONTADO"
      | "TARJETA"
      | "TRANSFERENCIA"
      | string;

    const saleData = {
      usuarioId: userId,
      sucursalId: rawSucursalId,
      clienteId: selectedCustomerID?.id ?? null,
      productos: cart.map((prod) => ({
        productoId: prod.id,
        cantidad: prod.quantity,
        selectedPriceId: prod.selectedPriceId,
      })),
      empaques: empaquesUsados.map((pack) => ({
        id: pack.id,
        quantity: pack.quantity,
      })),
      metodoPago,
      monto: cart.reduce(
        (acc, prod) => acc + prod.selectedPrice * prod.quantity,
        0
      ),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      dpi: dpi.trim(),
      imei: imei.trim(),
    };

    const isCustomerInfoProvided =
      !!saleData.nombre && !!saleData.telefono && !!saleData.direccion;

    // 3) Regla de cliente para ventas grandes
    if (
      saleData.monto > 1000 &&
      !saleData.clienteId &&
      !isCustomerInfoProvided
    ) {
      toast.warning(
        "Para ventas mayores a 1000 es necesario ingresar o seleccionar un cliente"
      );
      return;
    }

    try {
      // 4) Ejecutar la venta con toast.promise
      const ventaCreada = await toast.promise(createVenta(saleData), {
        loading: "Registrando venta...",
        success: (data) => {
          // data es la venta creada que devuelve el backend
          // Aquí aplicamos todos los efectos colaterales en UI
          setIsDialogOpen(false);
          setCart([]);
          setImei("");
          setventaResponse(data);
          setSelectedCustomerID(null);
          setNombre("");
          setTelefono("");
          setDireccion("");
          setDpi("");
          setEmpaquesUsados([]);
          setOpenEmpaques(false);

          setTimeout(() => {
            setOpenSection(true);
          }, 1000);

          return "Venta completada con éxito";
        },
        error: (error) => getApiErrorMessageAxios(error),
      });

      // Si quieres usar ventaCreada después, aquí también la tienes:
      console.log("Venta creada:", ventaCreada);
    } catch (error) {
      console.log(error);
      // El mensaje principal ya lo muestra toast.promise vía getApiErrorMessageAxios,
      // esto es solo un fallback genérico.
      toast.error("Ocurrió un error al completar la venta");
    }
  };

  // =======================
  // RENDER
  // =======================
  console.log("los productos son: ", productos);

  return (
    <div className="container">
      {/* Dialog venta registrada */}
      <Dialog open={openSection} onOpenChange={setOpenSection}>
        <DialogContent className="max-w-md border-[#e2b7b8] dark:border-[#7b2c7d] shadow-lg">
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-[#2d2d2d] border-4 border-[#e2b7b8] dark:border-[#7b2c7d] flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-[#7b2c7d] dark:text-[#e2b7b8]" />
            </div>
          </div>

          <DialogHeader className="pt-12 pb-2">
            <DialogTitle className="text-xl font-bold text-center text-[#7b2c7d] dark:text-[#e2b7b8]">
              Venta registrada exitosamente
            </DialogTitle>
          </DialogHeader>

          {ventaResponse && (
            <div className="mt-6 bg-gradient-to-r from-[#e2b7b8]/10 to-[#7b2c7d]/10 dark:from-[#7b2c7d]/10 dark:to-[#e2b7b8]/10 rounded-lg p-4">
              <div className="flex items-center justify-center mb-4">
                <Receipt className="h-5 w-5 text-[#7b2c7d] dark:text-[#e2b7b8] mr-2" />
                <h3 className="font-medium text-[#7b2c7d] dark:text-[#e2b7b8]">
                  Detalles de la venta
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="text-right text-[#7b2c7d]/70 dark:text-[#e2b7b8]/70">
                  Número de Venta:
                </div>
                <div className="font-semibold text-[#7b2c7d] dark:text-[#e2b7b8]">
                  #{ventaResponse.id}
                </div>

                <div className="text-right text-[#7b2c7d]/70 dark:text-[#e2b7b8]/70">
                  Fecha y Hora:
                </div>
                <div className="font-semibold text-[#7b2c7d] dark:text-[#e2b7b8]">
                  {formatearFechaUTC(ventaResponse.fechaVenta)}
                </div>

                <div className="text-right text-[#7b2c7d]/70 dark:text-[#e2b7b8]/70">
                  Monto Total:
                </div>
                <div className="font-semibold text-[#7b2c7d] dark:text-[#e2b7b8]">
                  {new Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(ventaResponse.totalVenta)}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center items-center gap-3 mt-6">
            <Button
              onClick={handleClose}
              className="transition-all duration-300 px-4 py-2 bg-white border-2 border-[#e2b7b8] text-[#7b2c7d] hover:bg-[#e2b7b8]/10 hover:border-[#d19fa0] dark:bg-[#2d2d2d] dark:border-[#7b2c7d] dark:text-[#e2b7b8] dark:hover:bg-[#7b2c7d]/10 dark:hover:border-[#9a3c9c]"
            >
              <Home className="h-4 w-4 mr-2" />
              Mantenerse
            </Button>

            <Link
              to={
                ventaResponse
                  ? `/venta/generar-factura/${ventaResponse.id}`
                  : "#"
              }
            >
              <Button
                onClick={handleClose}
                className="transition-all duration-300 px-4 py-2 bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white shadow-md hover:shadow-lg dark:from-[#e2b7b8] dark:to-[#d19fa0] dark:text-[#7b2c7d]"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir Comprobante
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* LISTA PRODUCTOS */}
        <div className="space-y-1">
          <Card className="shadow-xl ">
            <CardContent className="p-2">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="text-sm py-1"
                />
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-y-auto max-h-[28rem] shadow-xl">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p style={{ fontSize: "12px" }}>{product.nombre}</p>
                      </TableCell>

                      <TableCell>
                        <p style={{ fontSize: "13px" }}>
                          {product.precios
                            .sort((a, b) => a.orden - b.orden)
                            .map((precio) =>
                              new Intl.NumberFormat("es-GT", {
                                style: "currency",
                                currency: "GTQ",
                              }).format(Number(precio.precio))
                            )
                            .join(", ")}
                        </p>
                      </TableCell>

                      {product.stock && product.stock.length > 0 ? (
                        <>
                          <TableCell>
                            {product.stock.some(
                              (stock) => stock.cantidad > 0
                            ) ? (
                              <p className="font-bold">
                                {product.stock.reduce(
                                  (total, stocks) => total + stocks.cantidad,
                                  0
                                )}
                              </p>
                            ) : (
                              "Sin stock"
                            )}
                          </TableCell>

                          <TableCell>
                            <Button
                              className={cn(
                                "transition-all duration-300",
                                "bg-[#e2b7b8] hover:bg-[#d19fa0] text-[#7b2c7d]",
                                "dark:bg-[#7b2c7d] dark:hover:bg-[#9a3c9c] dark:text-[#f5d0d1]",
                                "disabled:bg-[#e2b7b8]/50 disabled:text-[#7b2c7d]/50 disabled:hover:bg-[#e2b7b8]/50",
                                "dark:disabled:bg-[#7b2c7d]/50 dark:disabled:text-[#f5d0d1]/50 dark:disabled:hover:bg-[#7b2c7d]/50"
                              )}
                              onClick={() => addToCart(product)} // 👈 aquí el cambio
                              disabled={
                                product.stock.reduce(
                                  (total, stocks) => total + stocks.cantidad,
                                  0
                                ) === 0
                              }
                            >
                              <CirclePlus />
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <TableCell colSpan={3} className="text-center">
                          Sin stock disponible
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* CARRITO + CLIENTE */}
        <div className="space-y-2 ">
          {/* CARRITO */}
          <Card className="flex flex-col h-80 shadow-md">
            <div className="p-3 border-b flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 dark:text-white" />
                Carrito
                <span className="text-xs bg-primary/10 px-2 py-0.5 rounded-full dark:text-white">
                  {cart.reduce((acc, total) => acc + total.quantity, 0)} items
                </span>
              </h3>
            </div>

            <CardContent className="flex-1 overflow-y-auto p-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-8">
                  <ShoppingBag className="h-12 w-12 mb-2 opacity-20" />
                  <p className="text-sm">El carrito está vacío</p>
                </div>
              ) : (
                <Table className="text-sm">
                  <TableHeader className="bg-muted/40 sticky top-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-1.5 w-[30%]">Producto</TableHead>
                      <TableHead className="py-1.5 w-[15%]">Cant.</TableHead>
                      <TableHead className="py-1.5 w-[25%]">Precio</TableHead>
                      <TableHead className="py-1.5 w-[20%]">Total</TableHead>
                      <TableHead className="py-1.5 w-[10%]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/5">
                        <TableCell className="py-1.5 font-medium truncate max-w-[120px]">
                          {item.nombre}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                item.id,
                                Number.parseInt(e.target.value)
                              )
                            }
                            min="1"
                            max={item.stock.reduce(
                              (total, stock) => total + stock.cantidad,
                              0
                            )}
                            className="h-7 w-16 text-xs px-2"
                          />
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Select
                            value={item.selectedPriceId.toString()}
                            onValueChange={(newPriceId) => {
                              const selectedPrice = item.precios.find(
                                (price) =>
                                  price.id === Number.parseInt(newPriceId)
                              );
                              if (selectedPrice) {
                                updatePrice(item.id, selectedPrice.precio);
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue
                                placeholder={formatCurrency(item.selectedPrice)}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel className="text-xs">
                                  Precios disponibles
                                </SelectLabel>
                                {item.precios
                                  .filter((prec) => prec.precio > 0)
                                  .map((precio) => (
                                    <SelectItem
                                      key={precio.id}
                                      value={precio.id.toString()}
                                      className="text-xs"
                                    >
                                      {formatCurrency(precio.precio)}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="py-1.5 font-semibold text-xs">
                          {formatCurrency(item.selectedPrice * item.quantity)}
                        </TableCell>
                        <TableCell className="py-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                            className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-2 p-3 border-t bg-muted/10">
              <div className="flex justify-between w-full text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs dark:text-white font-semibold">
                    Total: {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Button
                  onClick={() => {
                    setOpenEmpaques(true);
                  }}
                  disabled={cart.length <= 0}
                  className="w-full mt-1 bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white shadow-md hover:shadow-lg dark:from-[#e2b7b8] dark:to-[#d19fa0] dark:text-[#7b2c7d]"
                  size="sm"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Completar venta
                </Button>

                <DialogContent className="max-w-xs sm:max-w-sm border-[#e2b7b8] dark:border-[#7b2c7d] shadow-lg">
                  <DialogHeader className="pb-2">
                    <div className="w-16 h-16 rounded-full bg-[#e2b7b8]/20 dark:bg-[#7b2c7d]/20 flex items-center justify-center mx-auto mb-2">
                      <AlertCircle className="h-8 w-8 text-[#7b2c7d] dark:text-[#e2b7b8]" />
                    </div>
                    <DialogTitle className="text-center text-[#7b2c7d] dark:text-[#e2b7b8] text-xl">
                      Confirmación de Venta
                    </DialogTitle>
                  </DialogHeader>

                  <div className="py-3 text-center">
                    <p className="text-center text-sm mb-2">
                      ¿Estás seguro de que deseas completar la venta con estos
                      datos?
                    </p>

                    <div className="mt-2 p-2 bg-[#e2b7b8]/10 dark:bg-[#7b2c7d]/10 rounded-md">
                      <div className="flex justify-between text-xs text-[#7b2c7d] dark:text-[#e2b7b8]">
                        <span>Total de productos:</span>
                        <span className="font-bold">{totalProductos}</span>
                      </div>

                      <div className="flex justify-between text-xs text-[#7b2c7d] dark:text-[#e2b7b8]">
                        <span>Total de empaques:</span>
                        <span className="font-bold">
                          {totalEmpuesSeleccionados}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      className="w-full transition-all duration-300 bg-white border-2 border-[#e2b7b8] text-[#7b2c7d] hover:bg-[#e2b7b8]/10 hover:border-[#d19fa0] dark:bg-[#2d2d2d] dark:border-[#7b2c7d] dark:text-[#e2b7b8] dark:hover:bg-[#7b2c7d]/10 dark:hover:border-[#9a3c9c]"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>

                    <Button
                      disabled={isCreatingVenta}
                      onClick={handleCompleteSale}
                      className="w-full transition-all duration-300 bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white shadow-md hover:shadow-lg dark:from-[#e2b7b8] dark:to-[#d19fa0] dark:text-[#7b2c7d] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* DIALOG EMPAQUES */}
              <Dialog open={openEmpaques} onOpenChange={setOpenEmpaques}>
                <DialogContent className="max-w-5xl h-[95%] border-[#e2b7b8] dark:border-[#7b2c7d] shadow-lg flex flex-col">
                  <div className="pb-1 bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] dark:from-[#e2b7b8] dark:to-[#d19fa0] p-[0.35rem] rounded-t-lg">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mx-auto">
                      <ShoppingBag className="h-6 w-6 text-white dark:text-[#7b2c7d]" />
                    </div>
                    <h3 className="text-center text-white dark:text-[#7b2c7d] text-balance font-medium mt-2">
                      ¿Usar empaques en esta venta?
                    </h3>
                  </div>

                  <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    <div className="p-4 md:w-1/2 w-full md:border-r">
                      <div className="flex gap-2">
                        <div className="w-1/2">
                          <h4 className="text-sm font-medium text-[#7b2c7d] dark:text-[#e2b7b8] mb-2">
                            Empaques disponibles
                          </h4>
                        </div>
                        <div className="w-1/2 relative">
                          <Input
                            className="w-full h-6 pl-8 text-sm"
                            placeholder="Buscar"
                            value={filterEmpaques}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => setFilterEmpaques(e.target.value)}
                          />
                          <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                            <Search className="h-4 w-4" />
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 h-[30vh] md:h-[50vh] overflow-y-auto pr-1 border rounded-md p-2 pb-4">
                        {filteredEmpaques.map((empaque) => {
                          const stockPorSucursal = empaque.stock.reduce(
                            (acc, curr) => {
                              const id = curr.sucursal.id;
                              const nombre = curr.sucursal.nombre;
                              const cantidad = curr.cantidad ?? 0;

                              if (!acc[id]) {
                                acc[id] = { nombre, total: cantidad };
                              } else {
                                acc[id].total += cantidad;
                              }

                              return acc;
                            },
                            {} as Record<
                              number,
                              { nombre: string; total: number }
                            >
                          );

                          const maxPackage = empaque.stock
                            .filter((pack) => pack.sucursal.id === sucursalId)
                            .reduce(
                              (total, acc) => total + (acc.cantidad ?? 0),
                              0
                            );

                          return (
                            <div
                              key={empaque.id}
                              className="flex items-center justify-between text-sm p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                            >
                              <div className="flex-1 mr-2">
                                <p className="font-medium text-[#7b2c7d] dark:text-[#e2b7b8]">
                                  {empaque.nombre}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {empaque.descripcion}
                                </p>
                                <div className="text-xs text-muted-foreground py-1 flex flex-wrap gap-1">
                                  Stock:
                                  {Object.values(stockPorSucursal).map(
                                    (sucursal, index) => (
                                      <p
                                        key={index}
                                        className="bg-muted px-2 py-0.5 rounded-full ml-2"
                                      >
                                        {sucursal.nombre}: {sucursal.total}
                                      </p>
                                    )
                                  )}
                                </div>
                              </div>
                              {maxPackage <= 0 ? (
                                <span className="font-semibold text-xs text-red-500 whitespace-nowrap">
                                  Sin stock disponible
                                </span>
                              ) : (
                                <Input
                                  type="number"
                                  min={0}
                                  max={maxPackage}
                                  onChange={(e) =>
                                    updateEmpaqueQuantity(
                                      empaque.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-16 h-8 text-center flex-shrink-0"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 md:w-1/2 w-full">
                      <h4 className="text-sm font-medium text-[#7b2c7d] dark:text-[#e2b7b8] mb-2">
                        Empaques seleccionados {totalEmpuesSeleccionados}
                      </h4>
                      <div className="border rounded-md p-2 h-[30vh] md:h-[60vh] overflow-y-auto pb-4">
                        {empaquesUsados && empaquesUsados.length > 0 ? (
                          <div className="space-y-1">
                            {empaquesUsados &&
                              empaquesUsados
                                .filter((pack) => pack.quantity > 0)
                                .map((pack, index) => {
                                  const empaque = empaques.find(
                                    (e) => e.id === pack.id
                                  );

                                  return (
                                    <div
                                      key={index}
                                      className="grid grid-cols-[1fr_auto_auto] items-center py-2 px-3 text-sm rounded hover:bg-slate-50 dark:hover:bg-slate-800 border-b last:border-b-0 gap-2"
                                    >
                                      <span className="text-[#7b2c7d] dark:text-[#e2b7b8] font-medium truncate">
                                        {empaque?.nombre}
                                      </span>

                                      <span className="bg-[#7b2c7d]/10 dark:bg-[#e2b7b8]/10 px-3 py-1 rounded-full text-[#7b2c7d] dark:text-[#e2b7b8] font-medium text-center min-w-[2.5rem]">
                                        {pack.quantity}
                                      </span>

                                      <Button
                                        className="w-7 h-7 p-0"
                                        variant="outline"
                                        onClick={() => removeEmpaque(pack.id)}
                                      >
                                        <Delete className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  );
                                })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full">
                            <p className="text-sm text-muted-foreground text-center py-2">
                              No hay empaques seleccionados
                            </p>
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mt-2" />
                          </div>
                        )}
                        <div className="h-2"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 p-4 border-t">
                    <Button
                      type="button"
                      variant={"destructive"}
                      onClick={() => setOpenEmpaques(false)}
                      className="w-full transition-all duration-300 bg-white border-2 border-[#e2b7b8] text-[#7b2c7d] hover:bg-[#e2b7b8]/10 hover:border-[#d19fa0] dark:bg-[#2d2d2d] dark:border-[#7b2c7d] dark:text-[#e2b7b8] dark:hover:bg-[#7b2c7d]/10 dark:hover:border-[#9a3c9c]"
                      size="sm"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>

                    <Button
                      disabled={isCreatingVenta}
                      onClick={() => {
                        setOpenEmpaques(false);
                        setIsDialogOpen(true);
                      }}
                      className="w-full transition-all duration-300 bg-gradient-to-r from-[#7b2c7d] to-[#9a3c9c] hover:from-[#8d3390] hover:to-[#ac4cae] text-white shadow-md hover:shadow-lg dark:from-[#e2b7b8] dark:to-[#d19fa0] dark:text-[#7b2c7d] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      size="sm"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirmar venta
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>

          {/* CLIENTE + MÉTODO DE PAGO */}
          <Card className="shadow-md ">
            <CardContent className="p-2">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2 items-center">
                  <Label htmlFor="payment-method" className="text-xs">
                    Método de Pago
                  </Label>
                  <div className="col-span-2">
                    <Select
                      value={paymentMethod}
                      onValueChange={setPaymentMethod}
                    >
                      <SelectTrigger
                        id="payment-method"
                        className="h-7 text-xs w-full"
                      >
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTADO" className="text-xs">
                          Contado
                        </SelectItem>
                        <SelectItem value="TARJETA" className="text-xs">
                          Tarjeta
                        </SelectItem>
                        <SelectItem value="TRANSFERENCIA" className="text-xs">
                          Transferencia Bancaria
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator className="my-1" />

                <Tabs
                  defaultValue={activeTab}
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-2 mb-2">
                    <TabsTrigger
                      value="existing"
                      className="text-xs"
                      onClick={() => setActiveTab("existing")}
                    >
                      <User className="h-3 w-3 mr-1" />
                      Cliente Existente
                    </TabsTrigger>
                    <TabsTrigger
                      value="new"
                      className="text-xs"
                      disabled={!!selectedCustomerID}
                      onClick={() => setActiveTab("new")}
                    >
                      <UserPlus className="h-3 w-3 mr-1" />
                      Nuevo Cliente
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing" className="mt-0">
                    <div className="space-y-2">
                      <Label className="text-xs">Seleccionar Cliente</Label>
                      <SelectM
                        className="bg-transparent w-full text-xs text-black"
                        options={customerOptions}
                        onChange={handleChange}
                        placeholder="Buscar cliente..."
                        isClearable
                        value={
                          selectedCustomerID
                            ? {
                                value: selectedCustomerID.id,
                                label: selectedCustomerID.nombre,
                              }
                            : null
                        }
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="new" className="mt-0">
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label htmlFor="nombre" className="text-xs">
                          Nombre
                        </Label>
                        <div className="col-span-2">
                          <Input
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            placeholder="Nombre del cliente"
                            className="h-8 text-xs"
                            disabled={!!selectedCustomerID}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label htmlFor="telefono" className="text-xs">
                          Teléfono
                        </Label>
                        <div className="col-span-2">
                          <Input
                            id="telefono"
                            value={telefono}
                            onChange={(e) => setTelefono(e.target.value)}
                            placeholder="Opcional"
                            className="h-8 text-xs"
                            disabled={!!selectedCustomerID}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label htmlFor="direccion" className="text-xs">
                          Dirección
                        </Label>
                        <div className="col-span-2">
                          <Input
                            id="direccion"
                            value={direccion}
                            onChange={(e) => setDireccion(e.target.value)}
                            placeholder="Opcional"
                            className="h-8 text-xs"
                            disabled={!!selectedCustomerID}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label htmlFor="dpi" className="text-xs">
                          DPI
                        </Label>
                        <div className="col-span-2">
                          <Input
                            id="dpi"
                            value={dpi}
                            onChange={(e) => setDpi(e.target.value)}
                            placeholder="Opcional"
                            className="h-8 text-xs"
                            disabled={!!selectedCustomerID}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* PETICIÓN PRECIO ESPECIAL */}
      <div className="mt-20">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">
              Petición de precio especial
            </CardTitle>
            <CardDescription>
              Al solicitar un precio especial, esa instancia solo se podrá usar
              en una venta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Producto</Label>

                <SelectM
                  placeholder="Seleccionar producto"
                  options={productos.map((product) => ({
                    value: product.id.toString(),
                    label: `${product.nombre} (${product.codigoProducto})`,
                  }))}
                  className="basic-select text-black"
                  classNamePrefix="select"
                  onChange={(selectedOption) => {
                    if (selectedOption) {
                      setSelectedProductId(selectedOption.value);
                    }
                  }}
                  value={
                    selectedProductId
                      ? {
                          value: selectedProductId,
                          label: `${
                            productos.find(
                              (product) =>
                                product.id.toString() === selectedProductId
                            )?.nombre
                          } (${
                            productos.find(
                              (product) =>
                                product.id.toString() === selectedProductId
                            )?.codigoProducto
                          })`,
                        }
                      : null
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Precio Requerido</Label>
                <Input
                  value={precioReques ?? ""}
                  onChange={(e) =>
                    setPrecioRequest(
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="100"
                  type="number"
                />
              </div>
            </div>

            <Button
              onClick={() => setOpenRequest(true)}
              className="my-10 w-full"
              variant={"default"}
            >
              Solicitar precio especial
            </Button>

            <Dialog open={openReques} onOpenChange={setOpenRequest}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="text-center">
                    Solicitar precio especial
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Esta instancia solo se podrá aplicar a una venta
                  </DialogDescription>
                  <DialogDescription className="text-center">
                    ¿Continuar?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2">
                  <Button
                    disabled={
                      !precioReques ||
                      !selectedProductId ||
                      isCreatingPriceRequest
                    }
                    variant={"default"}
                    className="w-full"
                    onClick={handleMakeRequest}
                  >
                    Solicitar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
