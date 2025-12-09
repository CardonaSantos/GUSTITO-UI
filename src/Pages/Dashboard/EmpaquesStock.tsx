"use client";
import type { EmpaqueConStock } from "./EmpaquesType";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Package2, AlertTriangle, Building2, Box } from "lucide-react";

interface PropsFromDashboard {
  empaques: EmpaqueConStock[];
  lowStockThreshold?: number;
}

interface AggregatedStock {
  sucursalId: number;
  sucursalNombre: string;
  cantidadTotal: number;
  ultimoIngreso: string;
}

function EmpaquesStock({
  empaques,
  lowStockThreshold = 10,
}: PropsFromDashboard) {
  const getAggregatedStockBySucursal = (
    stocks: EmpaqueConStock["stock"]
  ): AggregatedStock[] => {
    const stockMap = new Map<number, AggregatedStock>();

    stocks.forEach((stock) => {
      const { sucursal, cantidad, fechaIngreso } = stock;

      if (!stockMap.has(sucursal.id)) {
        stockMap.set(sucursal.id, {
          sucursalId: sucursal.id,
          sucursalNombre: sucursal.nombre,
          cantidadTotal: 0,
          ultimoIngreso: fechaIngreso,
        });
      }

      const current = stockMap.get(sucursal.id)!;
      const newTotal = current.cantidadTotal + cantidad;
      const newDate =
        new Date(fechaIngreso) > new Date(current.ultimoIngreso)
          ? fechaIngreso
          : current.ultimoIngreso;

      stockMap.set(sucursal.id, {
        ...current,
        cantidadTotal: newTotal,
        ultimoIngreso: newDate,
      });
    });

    return Array.from(stockMap.values());
  };

  const getTotalStock = (stocks: EmpaqueConStock["stock"]): number =>
    stocks.reduce((total, stock) => total + stock.cantidad, 0);

  const hasEmpaques = empaques.length > 0;

  const empaquesOrdenados = empaques
    .map((empaque) => {
      const aggregatedStocks = getAggregatedStockBySucursal(empaque.stock);
      const totalStock = getTotalStock(empaque.stock);
      const isLowStock = totalStock < lowStockThreshold;

      return {
        ...empaque,
        aggregatedStocks,
        totalStock,
        isLowStock,
      };
    })
    .sort((a, b) => a.totalStock - b.totalStock);

  return (
    <Card className="w-full shadow-lg border border-[#f3d5e0] dark:border-[#7b2c7d]/50 rounded-2xl">
      <CardHeader className="pb-2 border-b border-[#f3d5e0]/60 dark:border-[#7b2c7d]/50 bg-[#fff5f7] dark:bg-[#7b2c7d]/10 rounded-t-2xl">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Package2 className="h-4 w-4 text-[#7b2c7d]" />
            <div className="flex flex-col">
              <CardTitle className="text-sm text-[#7b2c7d]">
                Stocks de Empaques
              </CardTitle>
              <CardDescription className="text-[10px]">
                Inventario actual de empaques por sucursal
              </CardDescription>
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-[10px] text-muted-foreground cursor-default">
                  <AlertTriangle className="h-3 w-3 mr-1 text-amber-500" />
                  Stock bajo: &lt; {lowStockThreshold}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Los empaques con stock menor a {lowStockThreshold} se marcan
                  como bajos.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        {!hasEmpaques ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            No hay empaques registrados.
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-200px)] pr-2">
            {/* Más compacto: menor gap, paddings pequeños */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
              {empaquesOrdenados.map((empaque) => (
                <div
                  key={empaque.id}
                  className="rounded-xl border border-[#f3d5e0] dark:border-[#7b2c7d]/40 bg-white dark:bg-[#0b0610] px-2.5 py-2 flex flex-col gap-1.5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Box className="h-3 w-3 text-[#7b2c7d]" />
                        <p className="text-[11px] font-semibold truncate">
                          {empaque.nombre}
                        </p>
                      </div>
                      <p
                        className="text-[10px] text-muted-foreground truncate"
                        title={empaque.descripcion}
                      >
                        {empaque.descripcion}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Código:{" "}
                        <span className="font-medium">
                          {empaque.codigoProducto}
                        </span>
                      </p>
                    </div>

                    <Badge
                      className={`ml-1 text-[10px] h-5 px-1.5 font-semibold flex items-center gap-1 border-0 ${
                        empaque.isLowStock
                          ? "bg-[#f4b6c2] text-[#6a3266]"
                          : "bg-[#a85c9c] text-white"
                      }`}
                    >
                      {empaque.isLowStock && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {empaque.totalStock}
                    </Badge>
                  </div>

                  <div className="mt-0.5 space-y-1">
                    {empaque.aggregatedStocks
                      .sort((a, b) => a.cantidadTotal - b.cantidadTotal)
                      .map((stock) => (
                        <div
                          key={stock.sucursalId}
                          className="flex items-center justify-between gap-1.5 rounded-lg bg-[#fff5f7] dark:bg-[#7b2c7d]/10 px-2 py-0.5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Building2 className="h-3 w-3 text-[#7b2c7d]" />
                            <span className="text-[10px] font-medium truncate">
                              {stock.sucursalNombre}
                            </span>
                          </div>

                          <div className="flex flex-col items-end gap-0">
                            <span className="text-[9px] text-muted-foreground">
                              Últ. ingreso:{" "}
                              {new Date(stock.ultimoIngreso).toLocaleDateString(
                                "es-GT"
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default EmpaquesStock;
