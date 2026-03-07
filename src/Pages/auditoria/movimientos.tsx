import { useMemo, useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowLeftRightIcon,
  WrenchIcon,
  Trash2Icon,
  RefreshCwIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ActivityIcon,
} from "lucide-react";
import {
  MovimientoStock,
  TipoMovimientoStock,
  useGetMovimientosBySucursal,
} from "@/hooks/useGetMovimientosBySucursal";

// ─── Constantes ──────────────────────────────────────────────────────────────

const SUCURSAL_ID = 1;
const PAGE_SIZE_OPTIONS = [10, 25, 50];

// ─── Helpers de presentación ─────────────────────────────────────────────────

const TIPO_CONFIG: Record<
  TipoMovimientoStock,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "destructive" | "outline";
    color: string;
  }
> = {
  INGRESO: {
    label: "Ingreso",
    icon: <ArrowDownIcon className="h-3 w-3" />,
    variant: "default",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  VENTA: {
    label: "Venta",
    icon: <ArrowUpIcon className="h-3 w-3" />,
    variant: "destructive",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  AJUSTE_MANUAL: {
    label: "Ajuste manual",
    icon: <WrenchIcon className="h-3 w-3" />,
    variant: "secondary",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  TRANSFERENCIA: {
    label: "Transferencia",
    icon: <ArrowLeftRightIcon className="h-3 w-3" />,
    variant: "outline",
    color: "text-blue-600 bg-blue-50 border-blue-200",
  },
  ELIMINACION: {
    label: "Eliminación",
    icon: <Trash2Icon className="h-3 w-3" />,
    variant: "destructive",
    color: "text-red-700 bg-red-50 border-red-200",
  },
  CORRECCION: {
    label: "Corrección",
    icon: <RefreshCwIcon className="h-3 w-3" />,
    variant: "secondary",
    color: "text-violet-600 bg-violet-50 border-violet-200",
  },
};

const formatFecha = (iso: string) => {
  const d = new Date(iso);
  return {
    fecha: d.toLocaleDateString("es-GT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    hora: d.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" }),
  };
};

const getDeltaDisplay = (delta: number) => {
  if (delta > 0)
    return { text: `+${delta}`, cls: "text-emerald-600 font-semibold" };
  if (delta < 0)
    return { text: `${delta}`, cls: "text-rose-600 font-semibold" };
  return { text: "0", cls: "text-slate-400" };
};

// ─── Fila de movimiento ───────────────────────────────────────────────────────

function MovimientoRow({ mov }: { mov: MovimientoStock }) {
  //   const config = TIPO_CONFIG[mov.tipoMovimiento];
  // ✅ Después — fallback seguro
  const config = TIPO_CONFIG[mov.tipoMovimiento] ?? {
    label: mov.tipoMovimiento ?? "Desconocido",
    icon: <ActivityIcon className="h-3 w-3" />,
    variant: "outline" as const,
    color: "text-slate-500 bg-slate-50 border-slate-200",
  };
  const { fecha, hora } = formatFecha(mov.fechaMovimiento);
  const delta = getDeltaDisplay(mov.delta);
  const nombre = mov.producto?.nombre ?? mov.empaque?.nombre ?? "—";
  const usuario = mov.usuario?.nombre ?? `UID ${mov.usuarioId ?? "—"}`;

  return (
    <TableRow className="hover:bg-slate-50/60 transition-colors">
      {/* Fecha */}
      <TableCell className="whitespace-nowrap">
        <div className="text-sm font-medium text-slate-700">{fecha}</div>
        <div className="text-xs text-slate-400">{hora}</div>
      </TableCell>

      {/* Tipo */}
      <TableCell>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
        >
          {config.icon}
          {config.label}
        </span>
      </TableCell>

      {/* Producto / Empaque */}
      <TableCell className="max-w-[180px]">
        <div className="truncate text-sm font-medium text-slate-800">
          {nombre}
        </div>
        {mov.empaqueId && <div className="text-xs text-slate-400">Empaque</div>}
      </TableCell>

      {/* Cantidad anterior → nueva */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-sm">
          <span className="text-slate-500">{mov.cantidadAnterior}</span>
          <ArrowLeftRightIcon className="h-3 w-3 text-slate-300" />
          <span className="font-medium text-slate-700">
            {mov.cantidadNueva}
          </span>
        </div>
      </TableCell>

      {/* Delta */}
      <TableCell className="text-center">
        <span className={`text-sm ${delta.cls}`}>{delta.text}</span>
      </TableCell>

      {/* Usuario */}
      <TableCell>
        <span className="text-sm text-slate-600">{usuario}</span>
      </TableCell>

      {/* Origen módulo */}
      <TableCell className="max-w-[160px]">
        {mov.origenModulo ? (
          <code className="truncate block text-xs bg-slate-100 text-slate-500 rounded px-1.5 py-0.5">
            {mov.origenModulo}
          </code>
        ) : (
          <span className="text-slate-300 text-xs">—</span>
        )}
      </TableCell>

      {/* Descripción */}
      <TableCell className="max-w-[200px]">
        <span className="text-xs text-slate-500 line-clamp-2">
          {mov.descripcion ?? "—"}
        </span>
      </TableCell>
    </TableRow>
  );
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: 8 }).map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full rounded" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Page principal ───────────────────────────────────────────────────────────

export default function MovimientosStockPage() {
  const { data, isLoading, isError, refetch, isFetching } =
    useGetMovimientosBySucursal(SUCURSAL_ID);

  // Filtros
  const [search, setSearch] = useState("");
  const [tipoFiltro, setTipoFiltro] = useState<TipoMovimientoStock | "TODOS">(
    "TODOS",
  );

  // Paginación
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // 1) Ordenar de más reciente a más tardío
  const ordenados = useMemo(() => {
    if (!data) return [];
    return [...data].sort(
      (a, b) =>
        new Date(b.fechaMovimiento).getTime() -
        new Date(a.fechaMovimiento).getTime(),
    );
  }, [data]);

  // 2) Filtrar por tipo y búsqueda
  const filtrados = useMemo(() => {
    return ordenados.filter((m) => {
      const matchTipo =
        tipoFiltro === "TODOS" || m.tipoMovimiento === tipoFiltro;

      const term = search.toLowerCase();
      const matchSearch =
        !term ||
        (m.producto?.nombre ?? "").toLowerCase().includes(term) ||
        (m.empaque?.nombre ?? "").toLowerCase().includes(term) ||
        (m.usuario?.nombre ?? "").toLowerCase().includes(term) ||
        (m.origenModulo ?? "").toLowerCase().includes(term) ||
        (m.descripcion ?? "").toLowerCase().includes(term) ||
        String(m.id).includes(term);

      return matchTipo && matchSearch;
    });
  }, [ordenados, tipoFiltro, search]);

  // 3) Paginar
  const totalPages = Math.max(1, Math.ceil(filtrados.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginados = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtrados.slice(start, start + pageSize);
  }, [filtrados, safePage, pageSize]);

  // Reset página al cambiar filtros
  const handleSearch = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleTipo = (v: string) => {
    setTipoFiltro(v as TipoMovimientoStock | "TODOS");
    setPage(1);
  };
  const handlePageSize = (v: string) => {
    setPageSize(Number(v));
    setPage(1);
  };
  console.log("La data es: ", data);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-[1400px] space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800">
              <ActivityIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Movimientos de Stock
              </h1>
              <p className="text-sm text-slate-500">
                Sucursal #{SUCURSAL_ID} — auditoría completa
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar producto, usuario, módulo…"
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <Select value={tipoFiltro} onValueChange={handleTipo}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Tipo de movimiento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos los tipos</SelectItem>
              {Object.entries(TIPO_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className="flex items-center gap-2">
                    {cfg.icon} {cfg.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Contador */}
          <span className="ml-auto text-sm text-slate-500">
            {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Error */}
        {isError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Error al cargar los movimientos. Intenta actualizar.
          </div>
        )}

        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-[120px] text-slate-600">
                  Fecha
                </TableHead>
                <TableHead className="w-[150px] text-slate-600">Tipo</TableHead>
                <TableHead className="text-slate-600">
                  Producto / Empaque
                </TableHead>
                <TableHead className="w-[140px] text-center text-slate-600">
                  Antes → Después
                </TableHead>
                <TableHead className="w-[80px] text-center text-slate-600">
                  Delta
                </TableHead>
                <TableHead className="text-slate-600">Usuario</TableHead>
                <TableHead className="text-slate-600">Módulo</TableHead>
                <TableHead className="text-slate-600">Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : paginados.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-16 text-center text-slate-400 text-sm"
                  >
                    No se encontraron movimientos
                  </TableCell>
                </TableRow>
              ) : (
                paginados.map((mov) => <MovimientoRow key={mov.id} mov={mov} />)
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Filas por página:</span>
            <Select value={String(pageSize)} onValueChange={handlePageSize}>
              <SelectTrigger className="h-8 w-[70px] bg-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">
              Página {safePage} de {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
