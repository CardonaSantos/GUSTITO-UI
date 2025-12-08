import { ResponsiveLine } from "@nivo/line";

export interface LineDatum {
  x: string | number;
  y: number;
}

export interface LineSerie {
  id: string;
  color: string; // color que mandas desde backend
  data: LineDatum[];
}

interface AnalyticsLineChartProps {
  data: LineSerie[];
}

export const AnalyticsLineChart = ({ data }: AnalyticsLineChartProps) => {
  const hasData = data && data.some((serie) => serie.data.length > 0);

  if (!hasData) {
    return (
      <div className="h-[350px] flex items-center justify-center text-muted-foreground bg-muted/10 rounded-xl border border-dashed">
        Sin datos históricos
      </div>
    );
  }

  // por si acaso, clono el array (evita mutaciones raras)
  const chartData = data.map((s) => ({
    ...s,
    data: s.data.map((d) => ({ ...d })),
  }));

  return (
    <div className="h-[350px] w-full">
      <ResponsiveLine
        data={chartData}
        margin={{ top: 20, right: 20, bottom: 60, left: 50 }}
        xScale={{ type: "point" }}
        yScale={{
          type: "linear",
          min: "auto",
          max: "auto",
          stacked: false,
          reverse: false,
        }}
        yFormat=" >-.2f"
        curve="catmullRom"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 15,
          tickRotation: 0,
          legend: "",
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 15,
          tickRotation: 0,
          format: (value) =>
            Number(value) >= 1000
              ? `${(Number(value) / 1000).toFixed(1)}k`
              : `${value}`,
        }}
        enableGridX={false}
        enableGridY={true}
        // usa el campo "color" de cada serie
        colors={(serie) => (serie as any).color}
        lineWidth={3}
        // --- PUNTOS ---
        enablePoints={true}
        pointSize={10}
        pointColor={{ from: "serieColor" }} // relleno del mismo color de la línea
        pointBorderWidth={2}
        pointBorderColor={{
          from: "serieColor",
          modifiers: [["darker", 0.6]],
        }}
        pointLabelYOffset={-12}
        // capas explícitas para que los puntos se dibujen
        layers={[
          "grid",
          "markers",
          "axes",
          "areas",
          "lines",
          "points",
          "slices",
          "mesh",
          "legends",
        ]}
        // --- INTERACCIÓN ---
        useMesh={true}
        enableSlices="x"
        crosshairType="x"
        // --- ÁREA ---
        enableArea={true}
        areaOpacity={0.15}
        // --- LEYENDA ---
        legends={[
          {
            anchor: "bottom",
            direction: "row",
            justify: false,
            translateX: 0,
            translateY: 50,
            itemsSpacing: 25,
            itemDirection: "left-to-right",
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 10,
            symbolShape: "circle",
          },
        ]}
        // --- TOOLTIP ---
        sliceTooltip={({ slice }) => (
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-xl border rounded-xl p-3 min-w-[180px] z-50">
            <div className="text-center font-bold text-slate-700 dark:text-slate-200 border-b pb-2 mb-2 text-sm">
              {slice.points[0].data.xFormatted}
            </div>
            <div className="flex flex-col gap-2">
              {slice.points.map((point) => (
                <div
                  key={point.id}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: point.seriesColor }}
                    />
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {String(point.seriesId)}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    Q
                    {Number(point.data.yFormatted).toLocaleString("es-GT", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      />
    </div>
  );
};
