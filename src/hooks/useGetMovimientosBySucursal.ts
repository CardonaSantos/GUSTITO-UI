import { useApiQuery } from "./hooks/useQueryHooks";

export type TipoMovimientoStock =
  | "INGRESO"
  | "VENTA"
  | "AJUSTE_MANUAL"
  | "TRANSFERENCIA"
  | "ELIMINACION"
  | "CORRECCION";

export interface MovimientoStock {
  id: number;
  stockId: number | null;
  productoId: number | null;
  empaqueId: number | null;
  tipoMovimiento: TipoMovimientoStock;
  cantidadAnterior: number;
  cantidadNueva: number;
  delta: number;
  usuarioId: number | null;
  sucursalId: number | null;
  ventaId: number | null;
  entregaStockId: number | null;
  ajusteStockId: number | null;
  transferenciaId: number | null;
  descripcion: string | null;
  origenModulo: string | null;
  fechaMovimiento: string;
  producto?: {
    id: number;
    nombre: string;
    codigoProducto?: string;
  } | null;
  empaque?: {
    id: number;
    nombre: string;
  } | null;
  usuario?: {
    id: number;
    nombre: string;
    rol?: string;
  } | null;
}

export function useGetMovimientosBySucursal(sucursalId?: number | null) {
  return useApiQuery<MovimientoStock[]>(
    ["movimientos-stock", "sucursal", sucursalId ?? 0],
    sucursalId ? `movimiento-stock/by-sucursal/${sucursalId}` : "",
    undefined,
    {
      enabled: !!sucursalId,
      staleTime: 0,
      gcTime: 1000 * 60 * 2,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    },
  );
}
