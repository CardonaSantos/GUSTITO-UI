import { AnalitycsQkeys } from "@/Pages/Analytics/Qk/analitycsQkeys";
import { useApiQuery } from "../hooks/useQueryHooks";
import { AnalyticsDashboardResponse } from "@/Pages/Analytics/interfaces/analytics";

export function useGetAnalitycs(id: number) {
  return useApiQuery<AnalyticsDashboardResponse>(
    AnalitycsQkeys.all,
    `analytics/comparativa/${id}`,
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
