import { useEffect, useState } from "react";
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
import { Barcode, CirclePlus, User2Icon, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import { ProductosResponse } from "@/Types/Venta/ProductosResponse";
import React from "react";
import { useStore } from "@/components/Context/ContextSucursal";

import SelectM from "react-select"; // Importación correcta de react-select
import { Link } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import dayjs from "dayjs";
import "dayjs/locale/es";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);
dayjs.locale("es");

function formatearFechaUTC(fecha: string) {
  return dayjs(fecha).format("DD/MM/YYYY hh:mm A");
}

const API_URL = import.meta.env.VITE_API_URL;

//========================================>
type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
};

type Precios = {
  id: number;
  precio: number;
};

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta?: number; // Este campo no lo veo en el objeto, pero lo mencionas en el botón
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  stock: Stock[];
  precios: Precios[];
};
interface CartItem extends Producto {
  quantity: number; // Cantidad del producto en el carrito
  selectedPriceId: number; // ID del precio seleccionado
  selectedPrice: number; // Precio para mostrar en el resumen
}

type Client = {
  id: number;
  nombre: string;
  telefono: string;
  dpi: string;
  iPInternet: string;
  direccion: string;
  actualizadoEn: Date;
};

interface Venta {
  id: number;
  clienteId: number | null;
  fechaVenta: string;
  horaVenta: string;
  totalVenta: number;
  direccionClienteFinal: string | null;
  nombreClienteFinal: string | null;
  sucursalId: number;
  telefonoClienteFinal: string | null;
  imei: string;
}

export default function PuntoVenta() {
  const userId = useStore((state) => state.userId) ?? 0;
  console.log("El id del user en el punto venta es: ", userId);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const sucursalId = useStore((state) => state.sucursalId);

  const [paymentMethod, setPaymentMethod] = useState<string>("CONTADO");

  console.log("El cart a enviar es: ", cart);

  const addToCart = (product: Producto) => {
    const existingItem = cart.find((item) => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const initialPriceId = product.precios[0]?.id; // Guardar solo el ID del primer precio
      const initialPrice = product.precios[0]?.precio || 0; // Precio para mostrar en el resumen

      const newCartItem: CartItem = {
        ...product,
        quantity: 1,
        selectedPriceId: initialPriceId, // Cambiar a ID del precio
        selectedPrice: initialPrice, // Mantener el precio para mostrar
      };

      setCart([...cart, newCartItem]);
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

  const [openSection, setOpenSection] = useState(false);
  const [ventaResponse, setventaResponse] = useState<Venta | null>(null);
  const handleClose = () => {
    setOpenSection(false);
  };

  const [isDisableButton, setIsDisableButton] = useState(false);

  const handleCompleteSale = async () => {
    // Deshabilitar el botón al iniciar el proceso
    setIsDisableButton(true);

    const saleData = {
      usuarioId: userId,
      sucursalId: sucursalId,
      clienteId: selectedCustomerID?.id,
      productos: cart.map((prod) => ({
        productoId: prod.id,
        cantidad: prod.quantity,
        selectedPriceId: prod.selectedPriceId,
      })),
      metodoPago: paymentMethod || "CONTADO",
      monto: cart.reduce(
        (acc, prod) => acc + prod.selectedPrice * prod.quantity,
        0
      ),
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      direccion: direccion.trim(),
      dpi: dpi.trim(),
      // iPInternet: iPInternet.trim(),
      imei: imei.trim(),
    };

    const isCustomerInfoProvided =
      saleData.nombre && saleData.telefono && saleData.direccion;

    if (
      saleData.monto > 1000 &&
      !saleData.clienteId &&
      !isCustomerInfoProvided
    ) {
      toast.warning(
        "Para ventas mayores a 1000 es necesario ingresar o seleccionar un cliente"
      );
      setIsDisableButton(false); // Rehabilitar el botón
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/venta`, saleData);

      if (response.status === 201 || response.status === 200) {
        toast.success("Venta completada con éxito");
        // Restablecer los estados y cerrar el diálogo
        setIsDialogOpen(false);
        setCart([]);
        getProducts();
        setImei("");
        setventaResponse(response.data);
        setSelectedCustomerID(null);
        setNombre("");
        setTelefono("");
        setDireccion("");
        setDpi("");
        setTimeout(() => {
          setOpenSection(true);
        }, 1000);
        setTimeout(() => {
          setIsDisableButton(false);
        }, 1000);
      } else {
        toast.error("Error al completar la venta");
      }
    } catch (error) {
      toast.error("Ocurrió un error al completar la venta");
      setIsDisableButton(false); // Rehabilitar el botón
    }
  };

  console.log("El metodo de pago seleccionado es: ", paymentMethod);

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [productos, setProductos] = useState<ProductosResponse[]>([]);

  const getProducts = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/products/sucursal/${sucursalId}`
      );
      if (response.status === 200) {
        setProductos(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al obtener productos.");
    }
  };

  useEffect(() => {
    if (sucursalId) {
      // Verificar que sucursalId está disponible
      getProducts();
    }
  }, [sucursalId]);
  console.log("Los productos son: ", productos);

  const filteredProducts = productos.filter(
    (product) =>
      product.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.codigoProducto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [openCustomerDetails, setOpenCustomerDetails] = useState(false);

  const [nombre, setNombre] = useState<string>("");
  const [dpi, setDpi] = useState<string>("");
  const [imei, setImei] = useState<string>("");

  const [telefono, setTelefono] = useState<string>("");
  const [direccion, setDireccion] = useState<string>("");
  console.log("Los datos de cf final son: ", {
    nombre,
    telefono,
    direccion,
  });

  const updatePrice = (productId: number, newPrice: number) => {
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId
          ? {
              ...item,
              selectedPrice: newPrice, // Actualizamos el precio seleccionado
              selectedPriceId:
                item.precios.find((price) => price.precio === newPrice)?.id ||
                item.selectedPriceId, // Actualiza el ID del precio seleccionado
            }
          : item
      )
    );
  };

  console.log("El cart a enviar es: ", cart);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null
  );
  const [precioReques, setPrecioRequest] = useState<number | null>(null);
  const [openReques, setOpenRequest] = useState(false);

  //==================================>
  async function handleMakeRequest() {
    if (precioReques && precioReques <= 0) {
      toast.info("La cantidad a solicitar no debe ser negativa");
      return;
    }

    if (!selectedProductId) {
      toast.info("Debe seleccionar un producto primero");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/price-request`, {
        productoId: Number(selectedProductId),
        precioSolicitado: precioReques,
        solicitadoPorId: userId,
      });
      if (response.status === 201) {
        toast.success(
          "Solicitud enviada, esperando respuesta del administrador..."
        );
        setPrecioRequest(null);
        setSelectedProductId("");
      }
    } catch (error) {
      console.log(error);
      toast.error("Algo salió mal");
    }
  }

  console.log("El cart a enviar es: ", cart);

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

  // Cambiar el tipo a Customer | null
  const [selectedCustomerID, setSelectedCustomerID] = useState<Customer | null>(
    null
  );
  // Actualizar el manejador de cambio
  const handleChange = (selectedOption: CustomerOption | null) => {
    // Encuentra el cliente correspondiente
    const selectedCustomer = selectedOption
      ? clients.find((customer) => customer.id === selectedOption.value) || null
      : null;
    setSelectedCustomerID(selectedCustomer);
  };

  console.log("EL id del cliente seleccionado es: ", selectedCustomerID?.id);

  const [clients, setClients] = useState<Client[]>([]);
  // Mapeo de clientes a un formato compatible con react-select
  const customerOptions = clients.map((customer) => ({
    value: customer.id, // Este será el ID del cliente
    label: `${customer.nombre} ${
      customer.telefono ? `(${customer.telefono})` : ""
    } ${customer.dpi ? `DPI: ${customer.dpi}` : ""}
    ${customer.iPInternet ? `IP: ${customer.iPInternet}` : ""}
    `, // Formato de presentación
  }));

  useEffect(() => {
    const getCustomers = async () => {
      try {
        const response = await axios.get(`${API_URL}/client/get-all-customers`);

        if (response.status === 200) {
          setClients(response.data);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al conseguir clientes previos");
      }
    };
    getCustomers();
  }, []);

  return (
    <div className="container  ">
      <Dialog open={openSection} onOpenChange={setOpenSection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-center">
              Venta registrada exitosamente
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              Ahora puedes generar el comprobante de venta para el cliente.
            </DialogDescription>
          </DialogHeader>

          {ventaResponse && (
            <div className="mt-4 text-center items-center justify-center">
              {/* Detalles de la venta */}
              <p className="text-sm mb-4">
                Número de Venta: <strong>#{ventaResponse?.id}</strong>
              </p>

              <p className=" text-sm mb-4">
                Fecha y Hora de Venta:{" "}
                <strong>{formatearFechaUTC(ventaResponse.fechaVenta)}</strong>
              </p>
              <p className=" text-sm mb-4">
                Monto Total:{" "}
                <strong>
                  {new Intl.NumberFormat("es-GT", {
                    style: "currency",
                    currency: "GTQ",
                  }).format(ventaResponse?.totalVenta)}
                </strong>
              </p>
            </div>
          )}

          <div className="flex justify-center items-center gap-2 mt-4">
            {/* Botón para cancelar */}
            <Button
              variant={"destructive"}
              className="px-4 py-2  rounded hover:bg-secondary-hover focus:outline-none"
              onClick={handleClose}
            >
              Mantenerse
            </Button>

            {/* Botón para recoger comprobante */}
            <Link to={`/venta/generar-factura/${ventaResponse?.id}`}>
              <Button
                className="px-4 py-2  rounded hover:bg-primary-hover focus:outline-none"
                onClick={handleClose}
              >
                Imprimir Comprobante
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-2">
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-center">
                Buscar productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Buscar por nombre o código..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Button variant="outline" size="icon">
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-y-auto max-h-96 shadow-xl">
            <CardHeader>{/* <CardTitle>Productos</CardTitle> */}</CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Stock</TableHead>
                    {/* <TableHead>Expira</TableHead> */}
                    <TableHead>Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      {/* Nombre del producto */}
                      <TableCell>
                        <p style={{ fontSize: "12px" }}>{product.nombre}</p>
                      </TableCell>

                      {/* Precio del producto */}
                      <TableCell>
                        <p style={{ fontSize: "13px" }}>
                          {product.precios
                            .map((precio) =>
                              new Intl.NumberFormat("es-GT", {
                                style: "currency",
                                currency: "GTQ",
                              }).format(Number(precio.precio))
                            )
                            .join(", ")}
                        </p>
                      </TableCell>

                      {/* Verificación de existencia de stock */}
                      {product.stock && product.stock.length > 0 ? (
                        <>
                          {/* Cantidad total de stock */}
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

                          {/* Botón para añadir al carrito (solo un botón) */}
                          <TableCell>
                            <Button
                              onClick={
                                () =>
                                  addToCart({
                                    ...product, // Incluye todas las propiedades del producto
                                    selectedPrice:
                                      product.precios[0]?.precio || 0, // Asigna el primer precio de la lista como el precio seleccionado inicialmente
                                    quantity: 1, // Añade el producto con cantidad inicial de 1
                                  } as CartItem) // Castea explícitamente como CartItem
                              }
                              disabled={
                                product.stock.reduce(
                                  (total, stocks) => total + stocks.cantidad,
                                  0
                                ) === 0
                              } // Deshabilita si no hay stock disponible
                            >
                              <CirclePlus />
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        // Caso cuando no hay stock disponible
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

        <div className="space-y-2 ">
          <Card className="flex flex-col h-2/4 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg text-center">Carrito</CardTitle>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="sm"
                    variant="secondary"
                    style={{
                      backgroundColor: imei.length >= 15 ? "#06d12b" : "gray",
                      color: "white",
                    }}
                  >
                    {imei.length >= 15 ? "IMEI AÑADIDO" : "AÑADIR IMEI"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Puedes ingresar varios IMEIs separados por comas.
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <Label htmlFor="width">IMEI</Label>
                        <Input
                          value={imei}
                          onChange={(e) => setImei(e.target.value)}
                          id="width"
                          placeholder="Ej. 123456789012345"
                          className="col-span-2 h-8"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardHeader>

            <CardContent className="flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Accion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nombre}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, parseInt(e.target.value))
                          }
                          min="1"
                          max={item.stock.reduce(
                            (total, stock) => total + stock.cantidad,
                            0
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.selectedPriceId.toString()} // Mostrar el ID del precio seleccionado
                          onValueChange={(newPriceId) => {
                            const selectedPrice = item.precios.find(
                              (price) => price.id === parseInt(newPriceId)
                            );
                            if (selectedPrice) {
                              updatePrice(item.id, selectedPrice.precio); // Llama a la función para actualizar con el nuevo precio
                            }
                          }} // Actualizar cuando se selecciona un nuevo precio
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`GTQ ${item.selectedPrice}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Precios disponibles</SelectLabel>
                              {item.precios
                                .filter((prec) => prec.precio > 0)
                                .map((precio) => (
                                  <SelectItem
                                    key={precio.id}
                                    value={precio.id.toString()} // Ahora el ID como valor
                                  >
                                    {new Intl.NumberFormat("es-GT", {
                                      style: "currency",
                                      currency: "GTQ",
                                    }).format(precio.precio)}
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <p className="font-semibold">
                          {new Intl.NumberFormat("es-GT", {
                            style: "currency",
                            currency: "GTQ",
                          }).format(item.selectedPrice * item.quantity)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>

            <CardFooter className="flex justify-between items-center mt-2">
              <span className="text-lg font-bold">
                Total:{" "}
                {new Intl.NumberFormat("es-GT", {
                  style: "currency",
                  currency: "GTQ",
                }).format(calculateTotal())}
              </span>
              <span className="text-lg font-bold">
                Productos:{" "}
                {cart.reduce((acc, total) => acc + total.quantity, 0)}
              </span>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={cart.length <= 0}>Completar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-center">
                      Confirmación de Venta
                    </DialogTitle>
                  </DialogHeader>
                  <p className="text-center">
                    ¿Estás seguro de que deseas completar la venta con estos
                    datos?
                  </p>
                  <div className="flex gap-2 mt-4 items-center justify-center">
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                      style={{ color: "white" }}
                      className="text-white bg-red-600 border-none hover:bg-red-600 shadow-md hover:shadow-lg w-full "
                    >
                      Cancelar
                    </Button>
                    <Button
                      disabled={isDisableButton}
                      style={{ color: "white" }}
                      onClick={handleCompleteSale}
                      className="text-white bg-green-600 border-none hover:bg-green-600 shadow-md hover:shadow-lg w-full"
                    >
                      Confirmar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
          <Card className="shadow-xl">
            <CardContent>
              <div className="flex justify-center p-2 items-center">
                <h2 className="font-bold text-base">
                  Método de Pago & Cliente
                </h2>
              </div>

              <div className="mb-4 w-full">
                <Label htmlFor="payment-method">Método de Pago</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) => setPaymentMethod(value)}
                >
                  <SelectTrigger id="payment-method" className="w-full">
                    <SelectValue placeholder="Método de Pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTADO">Contado</SelectItem>
                    <SelectItem value="TARJETA">Tarjeta</SelectItem>
                    <SelectItem value="TRANSFERENCIA">
                      Transferencia Bancaria
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover
                open={openCustomerDetails}
                onOpenChange={setOpenCustomerDetails}
              >
                <PopoverTrigger asChild>
                  <Button
                    className="w-full my-2"
                    variant="destructive"
                    size="sm"
                    disabled={!!selectedCustomerID}
                  >
                    Añadir Cliente
                    <User2Icon className="h-4 w-4 ml-2" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-96 p-4 shadow-lg rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="customer">Nombre</Label>
                      <Input
                        disabled={!!selectedCustomerID}
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre cliente"
                        className="mt-1 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-method">Teléfono</Label>
                      <Input
                        disabled={!!selectedCustomerID}
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Tel. referencia (opcional)"
                        className="mt-1 w-full"
                      />
                    </div>

                    <div>
                      <Label>Dirección</Label>
                      <Input
                        disabled={!!selectedCustomerID}
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Dirección cliente (opcional)"
                        className="mt-1 w-full"
                      />
                    </div>

                    <div>
                      <Label>DPI</Label>
                      <Input
                        disabled={!!selectedCustomerID}
                        value={dpi}
                        onChange={(e) => setDpi(e.target.value)}
                        placeholder="Opcional"
                        className="mt-1 w-full"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* SELECCION DE CLIENTE YA CREADO */}

              <div className="flex mt-4">
                <div className="space-y-4 px-4 w-full">
                  {/* Selección de cliente */}
                  <Label>Seleccionar Cliente</Label>
                  <SelectM
                    className="bg-transparent text-black w-full texsm"
                    options={customerOptions}
                    onChange={handleChange}
                    placeholder="Seleccionar cliente"
                    isClearable
                    value={
                      selectedCustomerID
                        ? {
                            value: selectedCustomerID.id,
                            label: selectedCustomerID.nombre,
                          }
                        : null
                    }
                    isDisabled={!!(nombre || direccion || telefono || dpi)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      {/* seleccionar precio especial::::::::::::::::::::::*/}
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
                      setSelectedProductId(selectedOption.value); // Almacena solo el ID
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
                      : null // Select vacío si no hay selección
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
                    disabled={!precioReques && !selectedProductId}
                    variant={"default"}
                    className="w-full"
                    onClick={() => handleMakeRequest()}
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
