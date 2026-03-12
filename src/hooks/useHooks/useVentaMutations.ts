import { useQueryClient } from "@tanstack/react-query";
import { VentaQkeys } from "../Qkeys/ventaQkeys";
import { useApiMutation } from "../hooks/useQueryHooks";

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

  return useApiMutation<Venta, CreateVentaPayload, Error>(
    "post",
    "venta",
    undefined,
    {
      onSuccess: (_data, variables) => {
        if (variables.sucursalId) {
          queryClient.invalidateQueries({
            queryKey: VentaQkeys.productosBySucursal(variables.sucursalId),
          });
        }

        queryClient.invalidateQueries({
          queryKey: VentaQkeys.empaques,
        });
      },
    },
  );
}

// ---------------- SOLICITAR PRECIO ESPECIAL ----------------
export function useCreatePriceRequest() {
  return useApiMutation<void, CreatePriceRequestPayload, Error>(
    "post",
    "price-request",
  );
}

export function useDeleteVenta() {
  const queryClient = useQueryClient();

  return useApiMutation<void, DeleteVentaPayload, Error>(
    "post",
    "sale-deleted",
    undefined,
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: VentaQkeys.sucursalSalesHistory(variables.sucursalId),
        });
      },
    },
  );
}
