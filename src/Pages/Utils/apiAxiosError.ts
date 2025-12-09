import axios from "axios";

type NestErrorBody =
  | string
  | {
      statusCode?: number;
      message?: string | string[];
      error?: string;
      code?: string;
    };

export function getApiErrorMessageAxios(err: unknown): string {
  const fallback = "Error al registrar el movimiento.";
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as NestErrorBody | undefined;
    if (!data) return err.message || fallback;

    if (typeof data === "string") return data;
    if (Array.isArray(data.message)) return data.message.join(", ");
    if (typeof data.message === "string") return data.message;
    if (data.error) return data.error;
    return `HTTP ${err.response?.status ?? ""}`.trim();
  }
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
