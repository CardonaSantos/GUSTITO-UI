import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  // Coins,
  CoinsIcon,
} from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";
const API_URL = import.meta.env.VITE_API_URL;

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSocket } from "@/components/Context/SocketContext";

import currency from "currency.js";
import DesvanecerHaciaArriba from "@/Crm/Motion/DashboardAnimations";
import { EmpaqueConStock } from "./EmpaquesType";
import EmpaquesStock from "./EmpaquesStock";

const formatearMoneda = (monto: number) => {
  return currency(monto, {
    symbol: "Q",
    separator: ",",
    decimal: ".",
    precision: 2,
  }).format();
};

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
}

interface Usuario {
  id: number;
  nombre: string;
  rol: string;
  sucursal: { nombre: string };
}

interface Solicitud {
  id: number;
  productoId: number;
  precioSolicitado: number;
  solicitadoPorId: number;
  estado: EstadoPrecio;
  aprobadoPorId: number | null;
  fechaSolicitud: string;
  fechaRespuesta: string | null;
  producto: Producto;
  solicitadoPor: Usuario;
}

enum EstadoSolicitudTransferencia {
  PENDIENTE,
  APROBADO,
  RECHAZADO,
}

interface Producto {
  nombre: string;
}

interface SucursalDestino {
  nombre: string;
}

interface SucursalOrigen {
  nombre: string;
}

enum Rol {
  ADMIN,
  MANAGER,
  VENDEDOR,
  SUPER_ADMIN,
}

interface UsuarioSolicitante {
  rol: Rol;
  nombre: string;
}

export interface SolicitudTransferencia {
  id: number;
  productoId: number;
  producto: Producto;
  sucursalDestino: SucursalDestino;
  sucursalOrigen: SucursalOrigen;
  usuarioSolicitante: UsuarioSolicitante;
  cantidad: number;
  sucursalOrigenId: number;
  sucursalDestinoId: number;
  usuarioSolicitanteId: number | null;
  estado: EstadoSolicitudTransferencia;
  fechaSolicitud: string;
  fechaAprobacion: string | null;
  administradorId: number | null;
}

interface VentasSemanalChart {
  dia: string;
  totalVenta: number;
  ventas: number;
  fecha: string;
}

interface MasVendidos {
  id: number;
  nombre: string;
  totalVentas: number;
}

interface VentaReciente {
  id: number;
  fechaVenta: string;
  totalVenta: number;
  sucursal: {
    id: number;
    nombre: string;
  };
}

interface dailyMoney {
  totalDeHoy: number;
}

enum EstadoPrecio {
  APROBADO = "APROBADO",
  PENDIENTE = "PENDIENTE",
  RECHAZADO = "RECHAZADO",
}

export default function Dashboard() {
  dayjs.extend(localizedFormat);
  dayjs.extend(customParseFormat);
  dayjs.locale("es");
  const formatearFecha = (fecha: string) => {
    let nueva_fecha = dayjs(fecha).format("DD MMMM YYYY, hh:mm A");
    return nueva_fecha;
  };

  const sucursalId = useStore((state) => state.sucursalId);
  const userID = useStore((state) => state.userId);

  const [empaques, setEmpaques] = useState<EmpaqueConStock[]>([]);

  const [ventasMes, setVentasMes] = useState(0);
  const [ventasSemana, setVentasSemana] = useState(0);
  const [ventasDia, setVentasDia] = useState<dailyMoney>({
    totalDeHoy: 0,
  });
  const [ventasSemanalChart, setVentasSemanalChart] = useState<
    VentasSemanalChart[]
  >([]);

  const [masVendidos, setMasVendidos] = useState<MasVendidos[]>([]);
  const [transaccionesRecientes, setTransaccionesRecientes] = useState<
    VentaReciente[]
  >([]);

  const getInfo = async () => {
    try {
      const [
        ventasMes,
        ventasSemana,
        ventasDia,
        ventasSemanalChart,
        productoMasVendidos,
        transaccionesRecientesR,
      ] = await Promise.all([
        axios.get(`${API_URL}/analytics/get-ventas/mes/${sucursalId}`),
        axios.get(`${API_URL}/analytics/get-ventas/semana/${sucursalId}`),
        axios.get(`${API_URL}/analytics/venta-dia/${sucursalId}`),
        axios.get(
          `${API_URL}/analytics/get-ventas/semanal-chart/${sucursalId}`
        ),
        axios.get(`${API_URL}/analytics/get-productos-mas-vendidos/`),
        axios.get(`${API_URL}/analytics/get-ventas-recientes/`),
      ]);

      // Si necesitas combinar la información de alguna manera, puedes hacerlo aquí
      setVentasMes(ventasMes.data);
      setVentasSemana(ventasSemana.data);
      setVentasDia(ventasDia.data);
      setVentasSemanalChart(ventasSemanalChart.data);
      setMasVendidos(productoMasVendidos.data);
      setTransaccionesRecientes(transaccionesRecientesR.data);
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      toast.error("Error al recuperar informacion de ventas del servidor");
    }
  };

  useEffect(() => {
    if (sucursalId) {
      getInfo();
    }
  }, [sucursalId]);

  const getEmpaques = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/empaque/find-empaques-stock`
      );
      if (response.status === 200) {
        setEmpaques(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir solicitudes");
    }
  };

  //==============================================>
  // SOLICITUDES DE PRECIO
  const getSolicitudes = async () => {
    try {
      const response = await axios.get(`${API_URL}/price-request`);
      if (response.status === 200) {
        setSolicitudes(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir solicitudes");
    }
  };
  //=======================================================>
  // SOLICITUDES DE TRANSFERENCIA PRODUCTO
  const getSolicitudesTransferencia = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/solicitud-transferencia-producto`
      );
      if (response.status === 200) {
        setSolicitudesTransferencia(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir solicitudes de transferencia");
    }
  };

  useEffect(() => {
    getSolicitudes();
    getEmpaques();
    getSolicitudesTransferencia();
  }, []);

  const [openAcept, setOpenAcept] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  const handleAceptRequest = async (idSolicitud: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/price-request/acept-request-price/${idSolicitud}/${userID}`
      );
      if (response.status === 200) {
        toast.success("Petición aceptada, precio concedido");
        setOpenAcept(false); // Close dialog upon success
        getSolicitudes();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error");
    }
  };

  const handleRejectRequest = async (idSolicitud: number) => {
    try {
      const response = await axios.patch(
        `${API_URL}/price-request/reject-request-price/${idSolicitud}/${userID}`
      );
      if (response.status === 200) {
        toast.warning("Petición rechazada");
        setOpenAcept(false); // Close dialog upon success
        setOpenReject(false);
        getSolicitudes();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error");
    }
  };

  const socket = useSocket();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);

  useEffect(() => {
    if (socket) {
      const handleSolicitud = (solicitudNueva: Solicitud) => {
        setSolicitudes((prevSolicitudes) => [
          ...prevSolicitudes,
          solicitudNueva,
        ]);
      };

      // Escucha el evento
      socket.on("recibirSolicitud", handleSolicitud);

      // Limpia el listener al desmontar
      return () => {
        socket.off("recibirSolicitud", handleSolicitud);
      };
    }
  }, [socket]);

  const [solicitudesTransferencia, setSolicitudesTransferencia] = useState<
    SolicitudTransferencia[]
  >([]);

  useEffect(() => {
    if (socket) {
      const handleSolicitud = (solicitudNueva: SolicitudTransferencia) => {
        setSolicitudesTransferencia((prevSolicitudes) => [
          ...prevSolicitudes,
          solicitudNueva,
        ]);
      };
      // Escucha el evento
      socket.on("recibirSolicitudTransferencia", handleSolicitud);
      // Limpia el listener al desmontar
      return () => {
        socket.off("recibirSolicitudTransferencia", handleSolicitud);
      };
    }
  }, [socket]);

  const [openAceptarTransferencia, setOpenAceptarTransferencia] =
    useState(false);
  const [openRechazarTransferencia, setOpenRechazarTransferencia] =
    useState(false);

  // Funciones para manejar aceptar y rechazar en el card de transferencia
  const handleAceptarTransferencia = async (
    idSolicitudTransferencia: number
  ) => {
    try {
      // Realiza la llamada al backend usando axios
      const response = await axios.post(
        `${API_URL}/solicitud-transferencia-producto/aceptar`,
        {
          idSolicitudTransferencia,
          userID,
        }
      );

      console.log("Respuesta del servidor:", response.data);
      toast.success("Tranferencia completada");
      getSolicitudesTransferencia();
      // Puedes mostrar una notificación de éxito aquí
    } catch (error) {
      console.error("Error al aceptar la transferencia:", error);
      toast.error("Error");
      // Puedes mostrar una notificación de error aquí
    } finally {
      setOpenAceptarTransferencia(false);
    }
  };

  const handleRejectTransferencia = async (
    idSolicitudTransferencia: number
  ) => {
    try {
      // Realiza la llamada al backend usando axios
      const response = await axios.delete(
        `${API_URL}/solicitud-transferencia-producto/rechazar/${idSolicitudTransferencia}/${userID}`
      );

      if (response.status === 200) {
        toast.warning("Solicitu de transferencia rechazada");
        getSolicitudesTransferencia();
      }
    } catch (error) {
      console.error("Error al aceptar la transferencia:", error);
      toast.error("Error");
    }
  };

  return (
    <motion.div {...DesvanecerHaciaArriba} className="container p-4 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard de Administrador</h1>

      {/* Resumen de ventas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del mes{" "}
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatearMoneda(ventasMes)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos de la semana
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatearMoneda(ventasSemana)}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos del dia{" "}
            </CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ventasDia &&
              typeof ventasDia.totalDeHoy === "number" &&
              !isNaN(ventasDia.totalDeHoy)
                ? formatearMoneda(ventasDia.totalDeHoy)
                : "Sin ventas aún"}
            </div>
          </CardContent>
        </Card>
      </div>

      <EmpaquesStock empaques={empaques} />

      {/* MOSTRAR LAS SOLICITUDES DE PRECIO */}
      <Card className="shadow-lg">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">
            Solicitud de Precio Especial
          </CardTitle>
        </CardHeader>
        <CardContent
          className={
            solicitudes && solicitudes.length > 0
              ? "max-h-[500px] overflow-y-auto py-2"
              : "py-2"
          }
        >
          {solicitudes && solicitudes.length > 0 ? (
            <div className="space-y-3">
              {solicitudes.map((soli) => (
                <Card key={soli.id} className="shadow-sm">
                  <CardContent className="p-3">
                    <div className="grid gap-1 mb-2">
                      <p className="text-sm text-cyan-500">
                        Estado: <strong>{soli.estado}</strong>
                      </p>
                      <p className="text-sm">
                        Producto: <strong>{soli.producto.nombre}</strong> -{" "}
                        {soli.producto.descripcion}
                      </p>
                      <p className="text-sm">
                        Solicitado por:{" "}
                        <strong>{soli.solicitadoPor.nombre}</strong> (
                        {soli.solicitadoPor.rol}) de{" "}
                        <strong>{soli.solicitadoPor.sucursal.nombre}</strong>
                      </p>
                      <p className="text-sm">
                        Precio:{" "}
                        <strong>
                          {new Intl.NumberFormat("es-GT", {
                            style: "currency",
                            currency: "GTQ",
                          }).format(soli.precioSolicitado)}
                        </strong>
                      </p>
                      <div className="flex flex-wrap text-xs text-gray-500 gap-x-2">
                        <span>
                          Solicitud: {formatearFecha(soli.fechaSolicitud)}
                        </span>
                        {soli.fechaRespuesta && (
                          <span>
                            Respuesta:{" "}
                            {new Date(soli.fechaRespuesta).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setOpenAcept(true)}
                        variant="default"
                        size="sm"
                      >
                        Aceptar
                      </Button>

                      <Button
                        onClick={() => setOpenReject(true)}
                        variant="destructive"
                        size="sm"
                      >
                        Rechazar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-2 text-xs">
              No hay solicitudes de precio.
            </p>
          )}
        </CardContent>

        {/* Diálogos de confirmación */}
        <Dialog open={openAcept} onOpenChange={setOpenAcept}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">
                Aceptar solicitud
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Al aceptar se creará una instancia de precio que solo se podrá
                usar una vez para este producto. ¿Continuar?
              </DialogDescription>
            </DialogHeader>
            <Button
              className="w-full"
              onClick={() => handleAceptRequest(solicitudes?.[0]?.id)}
            >
              Aceptar
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog open={openReject} onOpenChange={setOpenReject}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center">
                Rechazar solicitud
              </DialogTitle>
              <DialogDescription className="text-center text-sm">
                Se le negará este precio a la sucursal. ¿Continuar?
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => handleRejectRequest(solicitudes?.[0]?.id)}
            >
              Sí, continuar
            </Button>
          </DialogContent>
        </Dialog>
      </Card>

      {/* MOSTRAS LAS SOLICITUDES DE TRANSFERENCIA */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-sm">
            Solicitudes de Transferencia de Producto
          </CardTitle>
        </CardHeader>
        <CardContent className="h-full">
          {solicitudesTransferencia && solicitudesTransferencia.length > 0 ? (
            solicitudesTransferencia.map((soli) => (
              <Card key={soli.id} className="m-4 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Solicitud de Transferencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-cyan-500">
                    Estado: <strong>{soli.estado}</strong>
                  </p>
                  <p className="text-sm mt-1">
                    Producto: <strong>{soli.producto.nombre}</strong>
                  </p>
                  <p className="text-sm">
                    Solicitado por:{" "}
                    <strong>
                      {soli.usuarioSolicitante.nombre} (
                      {soli.usuarioSolicitante.rol})
                    </strong>
                  </p>
                  <p className="text-sm">
                    Cantidad solicitada: <strong>{soli.cantidad}</strong>
                  </p>
                  <p className="text-sm">
                    Sucursal Origen:{" "}
                    <strong>{soli.sucursalOrigen.nombre}</strong>
                  </p>
                  <p className="text-sm">
                    Sucursal Destino:{" "}
                    <strong>{soli.sucursalDestino.nombre}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Fecha de solicitud: {formatearFecha(soli.fechaSolicitud)}
                  </p>

                  <div className="flex gap-2 mt-2">
                    <Button
                      onClick={() => setOpenAceptarTransferencia(true)}
                      variant={"default"}
                    >
                      Aceptar
                    </Button>

                    <Dialog
                      open={openAceptarTransferencia}
                      onOpenChange={setOpenAceptarTransferencia}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Aceptar solicitud de Transferencia
                          </DialogTitle>
                          <DialogDescription className="text-center">
                            Se le descontará stock a la sucursal de origen y se
                            asignará a la sucursal de destino.
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            className="w-full"
                            onClick={() => handleAceptarTransferencia(soli.id)}
                          >
                            Sí, transferir producto
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      onClick={() => setOpenRechazarTransferencia(true)}
                      variant={"destructive"}
                    >
                      Rechazar
                    </Button>

                    <Dialog
                      open={openRechazarTransferencia}
                      onOpenChange={setOpenRechazarTransferencia}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="text-center">
                            Rechazar transferencia de producto
                          </DialogTitle>
                          <DialogDescription className="text-center">
                            Se negará esta transferencia.
                          </DialogDescription>
                          <DialogDescription className="text-center">
                            ¿Continuar?
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={"destructive"}
                            className="w-full"
                            onClick={() => handleRejectTransferencia(soli.id)}
                          >
                            Sí, negar y continuar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 text-xs">
              No hay solicitudes de transferencia.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Gráfico de ventas */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>
            <p className="text-base">Ventas de la Semana</p>
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ventasSemanalChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "totalVenta") {
                    return [`Q${value}`, "Total Venta"];
                  } else if (name === "ventas") {
                    return [`${value} ventas`, "Número de Ventas"];
                  }
                  return value;
                }}
                labelFormatter={(label) => {
                  const dayData = ventasSemanalChart.find(
                    (d) => d.dia === label
                  );
                  return dayData
                    ? `Fecha: ${new Date(dayData.fecha).toLocaleDateString()}`
                    : label;
                }}
              />
              <Bar dataKey="totalVenta" fill="#8884d8" name="Total Venta" />
              <Bar dataKey="ventas" fill="#82ca9d" name="Número de Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Productos e inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              <p className="text-base">Productos Más Vendidos</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {masVendidos &&
                  masVendidos.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.nombre}</TableCell>
                      <TableCell>{product.totalVentas}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>
              <p className="text-base">Transacciones Recientes</p>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha y hora</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Sucursal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaccionesRecientes &&
                  transaccionesRecientes.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>#{transaction.id}</TableCell>
                      <TableCell>
                        {formatearFecha(transaction.fechaVenta)}
                      </TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("es-GT", {
                          style: "currency",
                          currency: "GTQ",
                        }).format(transaction.totalVenta)}
                      </TableCell>
                      <TableCell>{transaction.sucursal.nombre}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Actividades recientes y Calendario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"></div>

      {/* Notificaciones y alertas */}
    </motion.div>
  );
}
