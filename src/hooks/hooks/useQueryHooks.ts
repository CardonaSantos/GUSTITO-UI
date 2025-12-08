// /hooks/useApi.ts
import { AxiosRequestConfig } from "axios";
import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
  QueryKey,
} from "@tanstack/react-query";
import { axiosClient } from "./axiosClient";

// const API_URL = import.meta.env.VITE_API_URL;

// -------- GET (useQuery) ----------
/**
 * Hook genérico para hacer GET requests con TanStack Query + Axios.
 *
 * @param key      -> clave única para cache (ej: ["clientes"], ["producto", id])
 * @param endpoint -> endpoint relativo (ej: "/clientes", "/productos/1")
 * @param config   -> configuración opcional de axios (params, headers, etc.)
 * @param options  -> opciones de TanStack Query (enabled, staleTime, etc.)
 */
export function useApiQuery<TData>(
  key: QueryKey,
  endpoint: string,
  config?: AxiosRequestConfig,
  options?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<TData, Error, TData, QueryKey>({
    queryKey: key,
    queryFn: async () => {
      const { data } = await axiosClient.get<TData>(
        endpoint.startsWith("/") ? endpoint : `/${endpoint}`,
        config
      );
      return data;
    },
    ...options,
  });
}

// -------- MUTATION (POST, PUT, DELETE, PATCH) ----------
/**
 * Hook genérico para llamadas de escritura (POST, PUT, PATCH, DELETE).
 *
 * @param method    -> método HTTP
 * @param endpoint  -> endpoint relativo (ej: "/clientes", "/productos/1")
 * @param config    -> configuración opcional de axios (headers, params, etc.)
 * @param options   -> opciones de React Query (onSuccess, onError, etc.)
 *
 * Retorna lo mismo que useMutation:
 *   - mutate / mutateAsync
 *   - isPending (antes: isLoading en v4)
 *   - isError, error
 *   - isSuccess, data
 */
export function useApiMutation<
  TData, // tipo de respuesta del servidor
  TVariables = unknown, // tipo del payload (body que mandamos)
  TError = unknown // tipo del error (puedes tipar AxiosError o HttpError)
>(
  method: "post" | "put" | "patch" | "delete",
  endpoint: string,
  config?: AxiosRequestConfig,
  options?: UseMutationOptions<TData, TError, TVariables>
) {
  return useMutation<TData, TError, TVariables>({
    // 🔥 función que se ejecuta al llamar mutate/mutateAsync
    mutationFn: async (variables: TVariables) => {
      const { data } = await axiosClient.request<TData>({
        url: endpoint,
        method,
        // Solo algunos métodos aceptan body
        data: ["post", "put", "patch"].includes(method) ? variables : undefined,
        ...config,
      });
      return data;
    },

    // 🎛️ permitimos sobreescribir comportamiento (onSuccess, onError, etc.)
    ...options,
  });
}
