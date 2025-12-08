import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { VentaQkeys } from "../Qkeys/ventaQkeys";

const API_URL = import.meta.env.VITE_API_URL;

// Misma interfaz que ya usas en la página
export interface Venta {
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

export interface CreateVentaPayload {
  usuarioId: number;
  sucursalId: number | null;
  clienteId: number | null;
  productos: {
    productoId: number;
    cantidad: number;
    selectedPriceId: number;
  }[];
  empaques: {
    id: number;
    quantity: number;
  }[];
  metodoPago: string;
  monto: number;
  nombre: string;
  telefono: string;
  direccion: string;
  dpi: string;
  imei: string;
}

export interface CreatePriceRequestPayload {
  productoId: number;
  precioSolicitado: number | null;
  solicitadoPorId: number;
}

export interface DeleteVentaPayload {
  sucursalId: number;
  ventaId: number;
  usuarioId: number;
  motivo: string;
  totalVenta: number;
  clienteId: number;
  productos: {
    productoId: number;
    cantidad: number;
    precioVenta: number;
  }[];
  adminPassword: string;
}

// ---------------- CREAR VENTA ----------------
export function useCreateVenta() {
  const queryClient = useQueryClient();

  return useMutation<Venta, unknown, CreateVentaPayload>({
    mutationFn: async (venta) => {
      const response = await axios.post(`${API_URL}/venta`, venta);
      return response.data as Venta;
    },
    retry: 1,
    onSuccess: (_data, variables) => {
      // Refetch catálogo de productos de la sucursal
      if (variables.sucursalId) {
        queryClient.invalidateQueries({
          queryKey: VentaQkeys.productosBySucursal(variables.sucursalId),
        });
      }

      // Refetch empaques
      queryClient.invalidateQueries({
        queryKey: VentaQkeys.empaques,
      });
    },
  });
}

// ---------------- SOLICITAR PRECIO ESPECIAL ----------------
export function useCreatePriceRequest() {
  return useMutation<void, unknown, CreatePriceRequestPayload>({
    mutationFn: async (payload) => {
      await axios.post(`${API_URL}/price-request`, payload);
    },
    retry: 1,
  });
}

// 🔹 Mutation para eliminar venta
export function useDeleteVenta() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, DeleteVentaPayload>({
    mutationFn: async (payload) => {
      await axios.post(`${API_URL}/sale-deleted`, payload);
    },
    retry: 1,
    onSuccess: (_data, variables) => {
      // Refetch historial de la sucursal
      queryClient.invalidateQueries({
        queryKey: VentaQkeys.sucursalSalesHistory(variables.sucursalId),
      });
    },
  });
}
