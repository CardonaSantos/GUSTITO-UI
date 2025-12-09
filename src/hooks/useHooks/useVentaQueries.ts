import { useApiQuery } from "../hooks/useQueryHooks";
import { ProductosResponse } from "@/Types/Venta/ProductosResponse";
import { VentaQkeys } from "../Qkeys/ventaQkeys";
import { VentasSucursalPaginatedResponse } from "@/Types/SalesHistory/HistorialVentas";

// TIPOS (puedes moverlos a /Types si quieres compartirlos)
export type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento: string;
};

export type Precios = {
  id: number;
  precio: number;
  // Propiedades de Control/Metadata
  creadoPorId: number;
  estado: "APROBADO" | "PENDIENTE" | "RECHAZADO" | string; // Usamos uniones literales si conoces los estados
  fechaCreacion: string; // Se recomienda usar 'string' para fechas ISO-8601 en interfaces
  orden: number;
  productoId: number;
  tipo: "ESTANDAR" | "ESPECIAL" | string; // Usamos uniones literales si conoces los tipos
  usado: boolean;
};

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
  sucursal: {
    id: number;
    nombre: string;
  };
}

export interface Client {
  id: number;
  nombre: string;
  telefono: string;
  dpi: string;
  iPInternet: string;
  direccion: string;
  actualizadoEn: Date;
}
export interface SucursalSalesFilters {
  page: number;
  pageSize: number;
  search?: string;
  from?: string; // "YYYY-MM-DD"
  to?: string; // "YYYY-MM-DD"
}

// ---------------- GET PRODUCTOS POR SUCURSAL ----------------
export function useGetProductosBySucursal(sucursalId?: number | null) {
  return useApiQuery<ProductosResponse[]>(
    VentaQkeys.productosBySucursal(sucursalId ?? 0),
    sucursalId ? `products/sucursal/${sucursalId}` : "",
    undefined,
    {
      enabled: !!sucursalId, // solo dispara cuando hay sucursal
      staleTime: 0,
      gcTime: 1000 * 60,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    }
  );
}

// ---------------- GET EMPAQUES ----------------
export function useGetEmpaques() {
  return useApiQuery<Empaque[]>(VentaQkeys.empaques, "empaque", undefined, {
    staleTime: 0,
    gcTime: 1000 * 60,
    refetchOnWindowFocus: "always",
    refetchOnMount: "always",
    refetchOnReconnect: "always",
    retry: 1,
  });
}

// ---------------- GET CLIENTES ----------------
export function useGetClientes() {
  return useApiQuery<Client[]>(
    VentaQkeys.clientes,
    "client/get-all-customers",
    undefined,
    {
      staleTime: 0,
      gcTime: 1000 * 60,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    }
  );
}

//historial ventas
export function useGetSucursalSalesHistory(
  sucursalId?: number | null,
  filters?: SucursalSalesFilters
) {
  return useApiQuery<VentasSucursalPaginatedResponse>(
    [
      ...VentaQkeys.sucursalSalesHistory(sucursalId ?? 0),
      filters?.page ?? 1,
      filters?.pageSize ?? 25,
      filters?.search ?? "",
      filters?.from ?? "",
      filters?.to ?? "",
    ],
    sucursalId ? `venta/find-my-sucursal-sales/${sucursalId}` : "",
    {
      params: filters,
    },
    {
      enabled: !!sucursalId,
      staleTime: 0,
      gcTime: 1000 * 60,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    }
  );
}
