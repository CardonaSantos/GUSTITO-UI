import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Banknote,
  CreditCard,
  ArrowUpFromLine,
  CalendarClock,
  User,
  ShoppingBag,
  Landmark,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import {
  Deposito,
  Egreso,
  VentaWithOutCashRegist,
} from "@/hooks/useHooks/useCaja";

interface DetalleMovimientosCajaProps {
  ventas: VentaWithOutCashRegist[];
  depositos: Deposito[];
  egresos: Egreso[];
  isLoading?: boolean;
}

export default function DetalleMovimientosCaja({
  ventas,
  depositos,
  egresos,
  isLoading,
}: DetalleMovimientosCajaProps) {
  // Helpers de formato
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(amount);

  const formatTime = (dateString: string) => {
    if (!dateString) return "--:--";
    const date = new Date(dateString);
    return date.toLocaleTimeString("es-GT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalVentas = useMemo(
    () => ventas.reduce((acc, v) => acc + v.totalVenta, 0),
    [ventas]
  );
  const totalDepositos = useMemo(
    () => depositos.reduce((acc, d) => acc + d.monto, 0),
    [depositos]
  );
  const totalEgresos = useMemo(
    () => egresos.reduce((acc, e) => acc + e.monto, 0),
    [egresos]
  );

  if (isLoading) {
    return <div className="h-24 w-full animate-pulse rounded-xl bg-muted/50" />;
  }

  return (
    <Card className="w-full border border-[#e2b7b8] dark:border-[#7b2c7d] rounded-2xl overflow-hidden shadow-sm">
      {/* Header Compacto */}
      <CardHeader className="bg-[#fff5f7] dark:bg-[#7b2c7d]/10 py-3 px-4 border-b border-[#e2b7b8]/60 dark:border-[#7b2c7d]/60">
        <CardTitle className="text-base font-semibold text-[#7b2c7d] dark:text-[#e2b7b8] flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Detalle de Movimientos
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {/* === SECCION VENTAS === */}
          <SectionItem
            value="ventas"
            title="Ventas"
            count={ventas.length}
            total={totalVentas}
            icon={<CreditCard className="h-4 w-4" />}
            colorClass="text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400"
            badgeClass="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          >
            <ScrollArea className="h-auto max-h-[300px] w-full px-4 py-2">
              {ventas.length === 0 ? (
                <EmptyState text="Sin ventas registradas" />
              ) : (
                <div className="space-y-2">
                  {ventas.map((venta) => (
                    <div
                      key={venta.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg border bg-card/50 hover:bg-card hover:border-[#7b2c7d]/30 transition-all gap-2 text-sm"
                    >
                      <div className="flex items-start gap-2.5 overflow-hidden">
                        <div className="mt-0.5 min-w-fit">
                          <ShoppingBag className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate text-foreground">
                              {venta.nombreClienteFinal || "Consumidor Final"}
                            </span>
                            <Badge
                              variant="secondary"
                              className="h-4 px-1 text-[9px] font-normal text-muted-foreground"
                            >
                              #{venta.id}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate opacity-90">
                            {venta.productos
                              .map((p) => `${p.cantidad}x ${p.producto.nombre}`)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 min-w-fit pl-6 sm:pl-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/30 px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3" />
                          {formatTime(venta.horaVenta)}
                        </span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(venta.totalVenta)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SectionItem>

          {/* === SECCION DEPOSITOS === */}
          <SectionItem
            value="depositos"
            title="Depósitos"
            count={depositos.length}
            total={totalDepositos}
            icon={<Banknote className="h-4 w-4" />}
            colorClass="text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
            badgeClass="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
          >
            <ScrollArea className="h-auto max-h-[250px] w-full px-4 py-2">
              {depositos.length === 0 ? (
                <EmptyState text="Sin depósitos registrados" />
              ) : (
                <div className="space-y-2">
                  {depositos.map((deposito) => (
                    <div
                      key={deposito.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg border bg-card/50 hover:bg-card hover:border-[#7b2c7d]/30 transition-all gap-2 text-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          <Landmark className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium uppercase text-xs">
                              {deposito.banco}
                            </p>
                            <span className="text-[10px] text-muted-foreground bg-muted/30 px-1 rounded">
                              Boleta: {deposito.numeroBoleta}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">
                            {deposito.descripcion}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 min-w-fit pl-6 sm:pl-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(deposito.fechaDeposito)}
                        </span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(deposito.monto)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SectionItem>

          {/* === SECCION EGRESOS === */}
          <SectionItem
            value="egresos"
            title="Egresos"
            count={egresos.length}
            total={totalEgresos}
            icon={<ArrowUpFromLine className="h-4 w-4" />}
            colorClass="text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
            badgeClass="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            isLast
          >
            <ScrollArea className="h-auto max-h-[250px] w-full px-4 py-2 pb-3">
              {egresos.length === 0 ? (
                <EmptyState text="Sin egresos registrados" />
              ) : (
                <div className="space-y-2">
                  {egresos.map((egreso) => (
                    <div
                      key={egreso.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg border bg-card/50 hover:bg-card hover:border-[#7b2c7d]/30 transition-all gap-2 text-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground/70" />
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight">
                            {egreso.descripcion}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 text-muted-foreground/70" />
                            <p className="text-[10px] text-muted-foreground">
                              {egreso.usuario?.nombre}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 min-w-fit pl-6 sm:pl-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(egreso.fechaEgreso)}
                        </span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {formatCurrency(egreso.monto)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </SectionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

// Subcomponente para renderizar cada sección del acordeón y reducir ruido
function SectionItem({
  value,
  title,
  count,
  total,
  icon,
  colorClass,
  badgeClass,
  isLast = false,
  children,
}: {
  value: string;
  title: string;
  count: number;
  total: number;
  icon: React.ReactNode;
  colorClass: string;
  badgeClass: string;
  isLast?: boolean;
  children: React.ReactNode;
}) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(amount);

  return (
    <AccordionItem
      value={value}
      className={isLast ? "border-none" : "border-b border-muted/50"}
    >
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 hover:no-underline group transition-all">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-3">
            <div
              className={`p-1.5 rounded-full transition-transform group-hover:scale-105 ${colorClass}`}
            >
              {icon}
            </div>
            <div className="text-left flex flex-col">
              <span className="text-sm font-medium text-foreground leading-none">
                {title}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">
                {count} {count === 1 ? "registro" : "registros"}
              </span>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`font-mono font-medium ${badgeClass}`}
          >
            {formatCurrency(total)}
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="bg-muted/5 dark:bg-transparent pb-0">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground opacity-50">
      <AlertCircle className="h-6 w-6 mb-1" />
      <p className="text-xs">{text}</p>
    </div>
  );
}
