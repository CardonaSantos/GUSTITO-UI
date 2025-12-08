import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { SocketProvider } from "./components/Context/SocketContext.tsx";
import { GoogleMapsProvider } from "./Crm/CrmRutas/CrmRutasCobro/GoogleMapsProvider .tsx";
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    // global toast opcional (v5)
    onError: (err) => toast.error(`Error generado: ${err}`),
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      // refetchOnWindowFocus: false, // si lo prefieres
    },
  },
});
createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <StrictMode>
      <SocketProvider>
        <GoogleMapsProvider>
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
        </GoogleMapsProvider>
      </SocketProvider>
    </StrictMode>
  </ThemeProvider>
);
