import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { useStore } from "@/components/Context/ContextSucursal";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Empaque {
  id: number;
  nombre: string;
}

interface StockEditionType {
  id: number;
  empaqueId: number;
  cantidad: number;
  costoTotal: number;
  creadoEn: string;
  fechaIngreso: string;
  fechaVencimiento: string | null;
  precioCosto: number;
  entregaStockId: number | null;
  sucursalId: number;
  empaque: Empaque;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function StockEditEmpaque() {
  const [truncardelete, setTrucarDelete] = useState(false);
  const [truncarEdit, setTrucarEdit] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const [stock, setStock] = useState<StockEditionType | null>(null);
  const [loading, setLoading] = useState(true);
  const userID = useStore((state) => state.userId);

  const [descripcionEdit, setDescripcionEdit] = useState<string>("");

  const [descripcionDelete, setDescripcionDelete] = useState<string>("");

  useEffect(() => {
    const getStockInfo = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/stock/get-empaque-stock/${id}`
        );
        if (response.status === 200) {
          setStock(response.data);
        }
      } catch (error) {
        console.error(error);
        toast.error("Error al conseguir el stock");
      } finally {
        setLoading(false);
      }
    };

    getStockInfo();
  }, [id]);

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!stock) return;

    setTrucarEdit(true);

    if (truncarEdit) return;

    const stockUpdateData = {
      cantidad: stock.cantidad, // Cantidad actualizada del stock
      costoTotal: stock.costoTotal, // Nuevo costo total del stock
      fechaVencimiento: stock.fechaVencimiento, // Fecha de vencimiento en formato string
      fechaIngreso: stock.fechaIngreso, // Fecha de ingreso en formato string
      empaqueId: stock.empaqueId, // ID del producto asociado
      stockId: stock.id, // Opcional: ID específico del stock si aplica
      cantidadAjustada: stock.cantidad, // Cantidad ajustada (puede ser positiva o negativa)
      usuarioId: userID, // Opcional: ID del usuario que realizó el ajuste
      descripcion: descripcionEdit, // Descripción del motivo del ajuste
    };
    console.log("La data enviandose es: ", stockUpdateData);

    if (!stockUpdateData.fechaIngreso) {
      toast.warning("Se necesita marca una fecha de entrega");
      return;
    }

    try {
      const response = await axios.patch(
        `${API_URL}/ajuste-stock/update-empaque-stock/${id}`,
        stockUpdateData
      );

      if (response.status === 200) {
        toast.success("Stock actualizado correctamente");
        navigate("/inventario-empaques");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar el stock");
      setTrucarEdit(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!stock) return;
    const { name, value } = e.target;
    setStock({
      ...stock,
      [name]:
        name === "cantidad" || name === "precioCosto" ? Number(value) : value,
    });
  };

  const handleDateChange = (
    dateString: string,
    field: "fechaIngreso" | "fechaVencimiento"
  ) => {
    if (!stock) return;

    if (dateString) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        setStock({ ...stock, [field]: date.toISOString() });
      } else {
        console.error("Fecha inválida");
      }
    } else {
      setStock({ ...stock, [field]: null });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleDeleteStock = async () => {
    setTrucarDelete(true);

    if (truncardelete) {
      return;
    }

    const deleteData = {
      stockId: stock?.id,
      empaqueId: stock?.empaqueId,
      sucursalId: stock?.sucursalId,
      usuarioId: userID,
      motivo: descripcionDelete,
    };

    console.log("Los datos del delete son: ", deleteData);

    try {
      const response = await axios.post(
        `${API_URL}/stock/delete-stock-empaque`,
        deleteData
      );
      if (response.status === 201) {
        toast.success("Eliminacion completada");
        setTimeout(() => {
          navigate("/inventario-empaques");
        }, 1000);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al eliminar stock");
      setTrucarDelete(false);
    }
  };

  if (!stock) {
    return (
      <div className="text-center text-red-500">
        No se encontró el registro de stock
      </div>
    );
  }

  console.log("El stock a editar es: ", stock);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 shadow-xl">
      <CardHeader>
        <CardTitle className="text-center">Editar Stock Empaque</CardTitle>
        <CardDescription>
          Modifica los detalles del stock para el empaque:{" "}
          {stock.empaque.nombre}
        </CardDescription>
      </CardHeader>
      <form>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cantidad">Cantidad</Label>
              <Input
                id="cantidad"
                name="cantidad"
                type="number"
                value={stock.cantidad}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="precioCosto">Precio de Costo</Label>
              <Input
                id="precioCosto"
                name="precioCosto"
                type="number"
                value={stock.precioCosto}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Fecha de Ingreso</Label>
              <input
                type="date"
                className=" bg-transparent w-full border border-gray-300 rounded px-3 py-2"
                value={
                  stock.fechaIngreso ? stock.fechaIngreso.slice(0, 10) : ""
                }
                onChange={(e) =>
                  handleDateChange(e.target.value, "fechaIngreso")
                }
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="block py-2 ">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="button" className="w-full my-2">
                Guardar Cambios
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-center">
                  Editar Stock del Producto
                </DialogTitle>
                <DialogDescription className="text-center">
                  Al guardar los cambios, el stock del producto en esta sucursal
                  será actualizado.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Escriba una breve explicación sobre los cambios realizados o del porque de su acción"
                  value={descripcionEdit}
                  onChange={(e) => setDescripcionEdit(e.target.value)}
                  className="mb-4"
                />
                <Button onClick={handleSubmit} className="w-full">
                  Confirmar Cambios
                </Button>
              </div>
              <DialogFooter className="text-center"></DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant={"destructive"}
                type="button"
                className="w-full my-2 text-center"
              >
                Eliminar Stock
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="text-center">
                <DialogTitle className="text-center">
                  Eliminación de Registro de Stock
                </DialogTitle>
                <DialogDescription className="text-center">
                  Al eliminar el registro, se descontará el stock para la
                  sucursal actual.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Textarea
                  placeholder="Escriba un breve comentario del porqué de esta acción"
                  value={descripcionDelete}
                  onChange={(e) => setDescripcionDelete(e.target.value)}
                  className="mb-4 w-full"
                />
                <Button
                  variant={"destructive"}
                  onClick={handleDeleteStock}
                  disabled={truncardelete}
                  className="w-full"
                >
                  Sí, Continuar y Eliminar
                </Button>
              </div>
              <DialogFooter className="text-center text-sm text-gray-500"></DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </form>
    </Card>
  );
}
