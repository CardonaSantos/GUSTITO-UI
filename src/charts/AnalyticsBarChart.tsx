import { ResponsiveBar } from "@nivo/bar";

// 1. AJUSTE DE LA INTERFAZ
// Nivo requiere [key: string]: string | number para funcionar internamente
export interface AnalyticsBarDatum {
  id: string;
  label: string;
  value: number;
  color: string;
  [key: string]: string | number; // <--- ESTA LINEA SOLUCIONA EL PRIMER ERROR
}

interface AnalyticsBarChartProps {
  data: AnalyticsBarDatum[];
}

export const AnalyticsBarChart = ({ data }: AnalyticsBarChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Sin datos
      </div>
    );
  }

  return (
    <div style={{ height: "350px", width: "100%" }}>
      {/* 2. PASAR EL GENÉRICO <AnalyticsBarDatum> */}
      <ResponsiveBar<AnalyticsBarDatum>
        data={data}
        keys={["value"]}
        indexBy="label"
        margin={{ top: 20, right: 30, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: "linear" }}
        indexScale={{ type: "band", round: true }}
        // 3. SOLUCIÓN COLOR: TypeScript ahora sabe que data.color es string gracias a la interfaz
        colors={({ data }) => data.color}
        borderRadius={4}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Categoría",
          legendPosition: "middle",
          legendOffset: 32,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: "Monto (Q)",
          legendPosition: "middle",
          legendOffset: -45,
        }}
        // Tooltip corregido con tipado seguro
        tooltip={({ data, value, color }) => (
          <div className="bg-white dark:bg-slate-800 p-2 border rounded shadow-md text-xs font-medium flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span>
              {data.label}: <strong>Q{Number(value).toLocaleString()}</strong>
            </span>
          </div>
        )}
      />
    </div>
  );
};
