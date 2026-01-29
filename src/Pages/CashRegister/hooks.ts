// Crear depósito

import { useApiMutation, useApiQuery } from "@/hooks/hooks/useQueryHooks";
import { cajaKeys, Deposito, Egreso } from "@/hooks/useHooks/useCaja";
import { useQueryClient } from "@tanstack/react-query";
import { depositosQkeys, egresosQkeys } from "./Qk";

// Payload para crear depósito
export interface DepositoCreatePayload {
  monto: number;
  numeroBoleta: string;
  banco: string;
  usadoParaCierre: boolean;
  sucursalId: number;
  descripcion: string;
  usuarioId: number | null;
}

// Payload para crear egreso
export interface EgresoCreatePayload {
  monto: number;
  sucursalId: number;
  descripcion: string;
  usuarioId: number | null;
}

export function useCreateDeposito() {
  const queryClient = useQueryClient();

  return useApiMutation<Deposito, DepositoCreatePayload, Error>(
    "post",
    "caja/create-deposit",
    undefined,
    {
      onSuccess: (_data, variables) => {
        const { sucursalId, usuarioId } = variables;

        // Refetch de depósitos de la sucursal
        queryClient.invalidateQueries({
          queryKey: cajaKeys.deposits(sucursalId),
        });

        // Refetch del estado de caja (resumen / saldo teórico, etc.)
        if (usuarioId) {
          queryClient.invalidateQueries({
            queryKey: cajaKeys.open(sucursalId, usuarioId),
          });
        }
      },
    }
  );
}

// Crear egreso
export function useCreateEgreso() {
  const queryClient = useQueryClient();

  return useApiMutation<Egreso, EgresoCreatePayload, Error>(
    "post",
    "caja/create-egreso",
    undefined,
    {
      onSuccess: (_data, variables) => {
        const { sucursalId, usuarioId } = variables;

        // Refetch de egresos de la sucursal
        queryClient.invalidateQueries({
          queryKey: cajaKeys.egresos(sucursalId),
        });

        // Refetch del estado de caja (resumen / saldo teórico, etc.)
        if (usuarioId) {
          queryClient.invalidateQueries({
            queryKey: cajaKeys.open(sucursalId, usuarioId),
          });
        }
      },
    }
  );
}

export type Deposit = {
  id: number;
  banco: string;
  descripcion: string;
  fechaDeposito: string;
  monto: number;
  numeroBoleta: string;
  usadoParaCierre: boolean;
  usuario: User;
};

export type User = {
  id: number;
  nombre: string;
  rol: string;
};

export type Expense = {
  id: number;
  descripcion: string;
  fechaEgreso: string;
  monto: number;
  usuario: User;
};

export function useGetDepositos(id: number) {
  return useApiQuery<Array<Deposit>>(
    depositosQkeys.all,
    `sucursal-saldo/get-sucursal-deposits/${id}`,
    undefined,
    {
      staleTime: 0,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    }
  );
}

export function useGetEgresos(id: number) {
  return useApiQuery<Array<Expense>>(
    egresosQkeys.all,
    `sucursal-saldo/get-sucursal-egresos/${id}`,
    undefined,
    {
      staleTime: 0,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    }
  );
}

export function useDeleteDeposito(id: number) {
  const query = useQueryClient();

  return useApiMutation("delete", `caja/delete-deposito/${id}`, undefined, {
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: depositosQkeys.all,
      });
    },
  });
}

export function useDeleteEgreso(id: number) {
  const query = useQueryClient();
  return useApiMutation("delete", `caja/delete-egreso/${id}`, undefined, {
    onSuccess: () => {
      query.invalidateQueries({
        queryKey: egresosQkeys.all,
      });
    },
  });
}

// --- EDIT HOOKS ---
export function useUpdateDeposito() {
  return useApiMutation("patch", `caja/update-deposito`);
}

export function useUpdateEgreso() {
  return useApiMutation("patch", `caja/update-egreso`);
}
