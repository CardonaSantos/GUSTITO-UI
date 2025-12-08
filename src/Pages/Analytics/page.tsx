import React from "react";
import {
  BarChart3,
  TrendingUp,
  CalendarRange,
  CalendarDays,
} from "lucide-react";

// Hooks y Componentes
import { AnalyticsBarChart } from "@/charts/AnalyticsBarChart";
import { AnalyticsLineChart } from "@/charts/AnalyticsLineChart";
import { useGetAnalitycs } from "@/hooks/useHooks/useGetAnalitycs";
import { useStore } from "@/components/Context/ContextSucursal";
import { INITIAL_ANALYTICS_STATE } from "./interfaces/analytics";

// --- COMPONENTE DE TARJETA REUTILIZABLE (Estilo Shadcn "Slim") ---
interface ChartCardProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
}

const ChartCard = ({
  title,
  icon: Icon,
  children,
  className = "",
}: ChartCardProps) => (
  <div
    className={`rounded-xl border bg-card text-card-foreground shadow-sm  flex flex-col ${className}`}
  >
    {/* Header Compacto */}
    <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
      <div className="p-1.5 bg-primary/10 rounded-md">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h3 className="font-semibold text-sm tracking-tight">{title}</h3>
    </div>

    {/* Content: Sin padding extra para maximizar el gráfico en móvil */}
    <div className="p-1 sm:p-2 flex-1 min-h-0 relative">{children}</div>
  </div>
);

function AnalitycsMainPage() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;

  // Usamos el hook y aseguramos data inicial
  const { data: da, isLoading } = useGetAnalitycs(sucursalId);
  const data = da || INITIAL_ANALYTICS_STATE;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground animate-pulse">
        Cargando métricas...
      </div>
    );
  }

  return (
    <div className="w-full  mx-auto p-2 sm:p-4 space-y-4 pb-20">
      {/* Encabezado de Página */}
      <div className="flex flex-col space-y-1 mb-2 px-1">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Tablero Financiero
        </h2>
        <p className="text-xs text-muted-foreground">
          Resumen de ventas, egresos y depósitos en tiempo real.
        </p>
      </div>

      {/* Grid Responsivo: 1 columna en móvil, 2 en tablet/desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* 1. Resumen Diario (Full width en móvil, col-span-2 en desktop si quieres destacar) */}
        <ChartCard
          title="Resumen de Hoy"
          icon={BarChart3}
          // Opcional: Si quieres que el del día ocupe todo el ancho arriba descomenta:
          // className="lg:col-span-2"
        >
          <AnalyticsBarChart data={data.dia} />
        </ChartCard>

        {/* 2. Tendencia Semanal (Rolling 7 days) */}
        <ChartCard title="Últimos 7 Días" icon={TrendingUp}>
          <AnalyticsLineChart data={data.semana} />
        </ChartCard>

        {/* 3. Tendencia Mensual */}
        <ChartCard title="Desempeño Mensual" icon={CalendarDays}>
          <AnalyticsLineChart data={data.mes} />
        </ChartCard>

        {/* 4. Histórico Anual */}
        <ChartCard title="Histórico Anual" icon={CalendarRange}>
          <AnalyticsLineChart data={data.anio} />
        </ChartCard>
      </div>
    </div>
  );
}

export default AnalitycsMainPage;
