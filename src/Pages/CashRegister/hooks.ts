// Crear depósito

import { useApiMutation } from "@/hooks/hooks/useQueryHooks";
import { cajaKeys, Deposito, Egreso } from "@/hooks/useHooks/useCaja";
import { useQueryClient } from "@tanstack/react-query";

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
