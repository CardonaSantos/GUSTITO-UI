"use client";
import type { EmpaqueConStock } from "./EmpaquesType";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package2, AlertTriangle, Building2 } from "lucide-react";

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
  // Function to aggregate stock by branch
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

  // Function to calculate total stock across all branches
  const getTotalStock = (stocks: EmpaqueConStock["stock"]): number => {
    return stocks.reduce((total, stock) => total + stock.cantidad, 0);
  };

  // Check if any empaque has stock
  const hasEmpaques = empaques.length > 0;

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Stocks de Empaques</CardTitle>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1 text-amber-500" />
                  Stock bajo: &lt; {lowStockThreshold}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Los empaques con stock menor a {lowStockThreshold} se marcan
                  como bajos
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription className="text-xs mt-1">
          Inventario actual de empaques por sucursal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasEmpaques ? (
          <div className="text-center py-6 text-muted-foreground">
            No hay empaques registrados
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-170px)] pr-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Empaque</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Sucursales</TableHead>
                  <TableHead className="text-right">Stock Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empaques.map((empaque) => {
                  const aggregatedStocks = getAggregatedStockBySucursal(
                    empaque.stock
                  );
                  const totalStock = getTotalStock(empaque.stock);
                  const isLowStock = totalStock < lowStockThreshold;

                  return (
                    <TableRow key={empaque.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{empaque.nombre}</span>
                          <span
                            className="text-xs text-muted-foreground truncate max-w-[170px]"
                            title={empaque.descripcion}
                          >
                            {empaque.descripcion}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {empaque.codigoProducto}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {aggregatedStocks.map((stock) => (
                            <div
                              key={stock.sucursalId}
                              className="flex items-center gap-1.5"
                            >
                              <Building2 className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">
                                {stock.sucursalNombre}:
                              </span>
                              <Badge
                                className={`text-[10px] h-5 px-1.5 font-semibold border-0 ${
                                  stock.cantidadTotal < lowStockThreshold
                                    ? "bg-[#f4b6c2] text-[#6a3266]" // stock bajo: rosa claro + púrpura
                                    : "bg-[#a85c9c] text-white" // stock bueno: lila fuerte
                                }`}
                              >
                                {stock.cantidadTotal}
                              </Badge>

                              <span className="text-[10px] text-muted-foreground">
                                (Últ. ingreso:{" "}
                                {new Date(
                                  stock.ultimoIngreso
                                ).toLocaleDateString()}
                                )
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={`ml-auto text-[10px] h-5 px-1.5 font-medium  items-center gap-1 border-0 ${
                            isLowStock
                              ? "bg-[#f4b6c2] text-[#6a3266]" // Rosa pastel, texto púrpura
                              : "bg-[#a85c9c] text-white" // Lila fuerte, texto blanco
                          }`}
                        >
                          {isLowStock && (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          )}
                          {totalStock}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default EmpaquesStock;
