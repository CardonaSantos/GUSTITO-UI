// src/hooks/useHooks/useCaja.ts
import { useQueryClient } from "@tanstack/react-query";
import { useApiMutation, useApiQuery } from "../hooks/useQueryHooks";

// =======================
// Tipos
// =======================
export type EstadoCaja = "ABIERTO" | "CERRADO";

export interface CajaResumen {
  saldoInicial: number;
  totalVentas: number;
  totalEgresos: number;
  totalDepositos: number;
  totalDepositosCierre: number;
  saldoTeoricoFinal: number;
  diferencia: number; // (saldoFinal DB - saldoTeoricoFinal) en el backend
}

export interface Usuario {
  id: number;
  nombre: string;
  rol: string;
}

export interface RegistroAbierto {
  id: number;
  sucursalId: number;
  usuarioId: number;
  saldoInicial: number | null;
  saldoFinal: number | null;
  fechaInicio: string;
  fechaCierre: string | null;
  estado: "ABIERTO" | "CERRADO";
  comentario?: string | null;
  usuario?: {
    id: number;
    nombre: string;
    rol: string;
  } | null;
  resumen?: CajaResumen; // 👈 lo que calculamos en el backend
}

export interface UltimaCajaCerrada {
  id: number;
  sucursalId: number;
  saldoFinal: number | null;
  fechaCierre: string;
  usuario: Usuario;
}

export interface CajaInfo {
  tieneCajaAbierta: boolean;
  cajaAbierta: RegistroAbierto | null;
  ultimaCajaCerrada: UltimaCajaCerrada | null;
}

export interface Deposito {
  id: number;
  registroCajaId: number | null;
  monto: number;
  numeroBoleta: string;
  banco: string;
  fechaDeposito: string;
  usadoParaCierre: boolean;
  descripcion: string;
  sucursalId: number;
  usuarioId: number | null;
  usuario: Usuario | null;
  sucursal: {
    id: number;
    nombre: string;
  };
}

export interface UsuarioEgreso {
  id: number;
  nombre: string;
  rol: string;
}

export interface Egreso {
  id: number;
  registroCajaId: number | null;
  descripcion: string;
  monto: number;
  fechaEgreso: string;
  sucursalId: number;
  usuarioId: number;
  usuario: UsuarioEgreso;
}

export interface ProductosVenta {
  cantidad: number;
  producto: {
    id: number;
    nombre: string;
    codigoProducto: string;
  };
}

export interface VentaWithOutCashRegist {
  id: number;
  clienteId: number | null;
  fechaVenta: string;
  horaVenta: string;
  totalVenta: number;
  sucursalId: number;
  nombreClienteFinal: string | null;
  telefonoClienteFinal: string | null;
  direccionClienteFinal: string | null;
  imei: string | null;
  registroCajaId: number | null;
  productos: ProductosVenta[];
}

// Payloads
export interface RegistroCajaInicioPayload {
  saldoInicial: number;
  estado: EstadoCaja;
  comentario: string;
  usuarioId: number;
  sucursalId: number;
}

export interface RegistroCajaCierrePayload {
  saldoInicial: number;
  saldoFinal: number;
  fechaInicio: string;
  fechaCierre: string;
  estado: EstadoCaja;
  comentario: string;
  usuarioId: number;
  sucursalId: number;
  depositosIds: number[];
  egresosIds: number[];
  ventasIds: number[];
  id?: number;
}

// =======================
// Query Keys
// =======================
export const cajaKeys = {
  root: ["caja"] as const,
  open: (sucursalId: number, usuarioId: number) =>
    ["caja", "open", sucursalId, usuarioId] as const,
  deposits: (sucursalId: number) =>
    [...cajaKeys.root, "deposits", sucursalId] as const,
  egresos: (sucursalId: number) =>
    [...cajaKeys.root, "egresos", sucursalId] as const,
  ventas: (sucursalId: number, usuarioId: number) =>
    [...cajaKeys.root, "ventas", { sucursalId, usuarioId }] as const,
};

// =======================
// QUERIES
// =======================
// Traer caja abierta por sucursal + usuario usando query params
export function useGetCajaAbierta(sucursalId: number, usuarioId: number) {
  return useApiQuery<CajaInfo>(
    cajaKeys.open(sucursalId, usuarioId),
    "caja/find-cash-regist-open", // 👈 ya sin params en el path
    {
      params: {
        sucursalId,
        userId: usuarioId,
      },
    }, // 👈 query string ?sucursalId=&userId=
    {
      enabled: !!sucursalId && !!usuarioId,
    }
  );
}

export function useGetDepositosSucursal(sucursalId?: number | null) {
  const enabled = !!sucursalId;

  return useApiQuery<Deposito[]>(
    cajaKeys.deposits(sucursalId ?? 0),
    enabled ? `caja/get-all-deposits-sucursal/${sucursalId}` : "",
    undefined,
    {
      enabled,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    }
  );
}

export function useGetEgresosSucursal(sucursalId?: number | null) {
  const enabled = !!sucursalId;

  return useApiQuery<Egreso[]>(
    cajaKeys.egresos(sucursalId ?? 0),
    enabled ? `caja/get-all-egresos-sucursal/${sucursalId}` : "",
    undefined,
    {
      enabled,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    }
  );
}

export function useGetVentasCaja(
  sucursalId?: number | null,
  usuarioId?: number | null
) {
  const enabled = !!sucursalId && !!usuarioId;

  return useApiQuery<VentaWithOutCashRegist[]>(
    cajaKeys.ventas(sucursalId ?? 0, usuarioId ?? 0),
    enabled ? `venta/get-ventas-caja/${sucursalId}/${usuarioId}` : "",
    undefined,
    {
      enabled,
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    }
  );
}

// =======================
// MUTATIONS
// =======================
export function useOpenCaja() {
  const queryClient = useQueryClient();

  return useApiMutation<RegistroAbierto, RegistroCajaInicioPayload, Error>(
    "post",
    "caja/open-cash-regist",
    undefined,
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({
          queryKey: cajaKeys.open(variables.sucursalId, variables.usuarioId),
        });
      },
    }
  );
}

export function useCloseCaja() {
  const queryClient = useQueryClient();

  return useApiMutation<RegistroAbierto, RegistroCajaCierrePayload, Error>(
    "patch",
    "caja/close-box",
    undefined,
    {
      onSuccess: (_data, variables) => {
        const { sucursalId, usuarioId } = variables;

        queryClient.invalidateQueries({
          queryKey: cajaKeys.open(sucursalId, usuarioId),
        });
        queryClient.invalidateQueries({
          queryKey: cajaKeys.deposits(sucursalId),
        });
        queryClient.invalidateQueries({
          queryKey: cajaKeys.egresos(sucursalId),
        });
        queryClient.invalidateQueries({
          queryKey: cajaKeys.ventas(sucursalId, usuarioId),
        });
      },
    }
  );
}
