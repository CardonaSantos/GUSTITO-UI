// 1. Tipos para el Gráfico de Barras (Sección "dia")
export interface AnalyticsBarDatum {
  id: string;
  label: string;
  value: number;
  color: string;
  // Esta firma de índice es vital para que Nivo no marque error de tipado estricto
  [key: string]: string | number;
}

// 2. Tipos para los Gráficos de Líneas (Sección "semana", "mes", "anio")
export interface AnalyticsPoint {
  x: string; // Ej: "08/12"
  y: number; // Ej: 210
}

export interface AnalyticsLineSerie {
  id: string; // Ej: "Ventas"
  color: string; // Ej: "hsl(152, 70%, 50%)"
  data: AnalyticsPoint[];
}

// 3. Respuesta Principal del Endpoint
export interface AnalyticsDashboardResponse {
  dia: AnalyticsBarDatum[];
  semana: AnalyticsLineSerie[];
  mes: AnalyticsLineSerie[];
  anio: AnalyticsLineSerie[];
}

export const INITIAL_ANALYTICS_STATE: AnalyticsDashboardResponse = {
  dia: [
    {
      id: "Ventas",
      label: "Ventas",
      value: 0,
      color: "hsl(152, 70%, 50%)",
    },
    {
      id: "Egresos",
      label: "Egresos",
      value: 0,
      color: "hsl(0, 70%, 50%)",
    },
    {
      id: "Depósitos",
      label: "Depósitos",
      value: 0,
      color: "hsl(215, 70%, 50%)",
    },
  ],
  semana: [
    { id: "Ventas", color: "hsl(152, 70%, 50%)", data: [] },
    { id: "Egresos", color: "hsl(0, 70%, 50%)", data: [] },
    { id: "Depósitos", color: "hsl(215, 70%, 50%)", data: [] },
  ],
  mes: [
    { id: "Ventas", color: "hsl(152, 70%, 50%)", data: [] },
    { id: "Egresos", color: "hsl(0, 70%, 50%)", data: [] },
    { id: "Depósitos", color: "hsl(215, 70%, 50%)", data: [] },
  ],
  anio: [
    { id: "Ventas", color: "hsl(152, 70%, 50%)", data: [] },
    { id: "Egresos", color: "hsl(0, 70%, 50%)", data: [] },
    { id: "Depósitos", color: "hsl(215, 70%, 50%)", data: [] },
  ],
};
