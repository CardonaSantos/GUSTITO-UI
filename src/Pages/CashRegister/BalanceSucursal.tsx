import { useStore } from "@/components/Context/ContextSucursal";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import {
  MoreHorizontal,
  Trash2,
  FileText,
  Banknote,
  ArrowUpFromLine,
  AlertTriangle,
  Save,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import { useApiMutation } from "@/hooks/hooks/useQueryHooks";
import {
  Deposit,
  Expense,
  useDeleteDeposito,
  useDeleteEgreso,
  useGetDepositos,
  useGetEgresos,
} from "./hooks";
dayjs.extend(localizedFormat);
dayjs.locale("es");

const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format("DD MMM YYYY, hh:mm A");
};
type TargetType = "deposito" | "egreso";

export default function BalanceSucursal() {
  const sucursalId = useStore((state) => state.sucursalId) ?? 0;
  const [selectedItem, setSelectedItem] = useState<Deposit | Expense | null>(
    null
  );
  const [targetType, setTargetType] = useState<TargetType>("deposito");

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: depos, isLoading: isloadingDepos } =
    useGetDepositos(sucursalId);
  const { data: egres, isLoading: isloadingEgresos } =
    useGetEgresos(sucursalId);

  const isLoading = isloadingDepos || isloadingEgresos;
  const fetchData = () => {};
  const depositos = depos ? depos : [];
  const egresos = egres ? egres : [];
  // --- HANDLERS ---
  const handleOpenAction = (
    type: "edit" | "delete",
    item: Deposit | Expense,
    origin: TargetType
  ) => {
    setSelectedItem(item);
    setTargetType(origin);

    if (type === "delete") setIsDeleteDialogOpen(true);
    if (type === "edit") setIsEditDialogOpen(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(amount);

  return (
    <div className="w-full mt-4">
      <Card className="border border-[#e2b7b8] dark:border-[#7b2c7d] shadow-sm rounded-xl overflow-hidden">
        <CardHeader className="bg-[#fff5f7] dark:bg-[#7b2c7d]/10 border-b border-[#e2b7b8]/50 pb-4">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#7b2c7d] dark:text-[#e2b7b8] text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Control de Movimientos
              </CardTitle>
              <CardDescription>
                Administra los depósitos y egresos de la sucursal.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs defaultValue="depositos" className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-2 bg-[#fdf2f4] dark:bg-[#2d1b2d] p-1 rounded-lg">
                <TabsTrigger
                  value="depositos"
                  className="data-[state=active]:bg-[#7b2c7d] data-[state=active]:text-white transition-all"
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Depósitos
                </TabsTrigger>
                <TabsTrigger
                  value="egresos"
                  className="data-[state=active]:bg-[#7b2c7d] data-[state=active]:text-white transition-all"
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  Egresos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="depositos" className="p-0">
              <TablaDepositos
                data={depositos}
                loading={isLoading}
                onAction={(type, item) =>
                  handleOpenAction(type, item, "deposito")
                }
                formatCurrency={formatCurrency}
              />
            </TabsContent>

            <TabsContent value="egresos" className="p-0">
              <TablaEgresos
                data={egresos}
                loading={isLoading}
                onAction={(type, item) =>
                  handleOpenAction(type, item, "egreso")
                }
                formatCurrency={formatCurrency}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/*  DELETE DIALOG */}
      {selectedItem && (
        <DeleteConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          item={selectedItem}
          type={targetType}
          onSuccess={fetchData}
        />
      )}

      {/* EDIT DIALOG */}
      {selectedItem && (
        <EditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          item={selectedItem}
          type={targetType}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}

// SUB-COMPONENTES DE LÓGICA DE ACCIÓN

function DeleteConfirmDialog({
  open,
  onOpenChange,
  item,
  type,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Deposit | Expense;
  type: TargetType;
  onSuccess: () => void;
}) {
  const deleteDeposito = useDeleteDeposito(item.id);
  const deleteEgreso = useDeleteEgreso(item.id);

  const endpoint =
    type === "deposito"
      ? `caja/delete-deposito/${item.id}`
      : `caja/delete-egreso/${item.id}`;

  const { isPending } = useApiMutation("delete", endpoint);

  const handleDelete = async () => {
    try {
      await toast.promise(
        type === "deposito"
          ? deleteDeposito.mutateAsync(item.id)
          : deleteEgreso.mutateAsync(item.id),
        {
          loading: "Eliminando registro...",
          success: "Registro eliminado correctamente",
          error: "No se pudo eliminar el registro",
        }
      );

      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-t-4 border-t-red-500">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar {type === "deposito" ? "Depósito" : "Egreso"}
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro de eliminar el registro <strong>#{item.id}</strong>{" "}
            por <strong>Q{item.monto}</strong>?
            <br />
            Esta acción podría afectar los cierres de caja relacionados.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {isPending ? "Eliminando..." : "Sí, eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditDialog({
  open,
  onOpenChange,
  item,
  type,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Deposit | Expense;
  type: TargetType;
  onSuccess: () => void;
}) {
  // State local del formulario
  const [formData, setFormData] = useState({
    descripcion: item.descripcion || "",
    monto: item.monto || 0,
    // Campos solo para depósito
    banco: (item as Deposit).banco || "",
    numeroBoleta: (item as Deposit).numeroBoleta || "",
  });

  const endpoint =
    type === "deposito"
      ? `caja/update-deposito/${item.id}`
      : `caja/update-egreso/${item.id}`;

  const { mutateAsync, isPending } = useApiMutation("patch", endpoint);

  // Actualizar form si cambia el item
  useEffect(() => {
    setFormData({
      descripcion: item.descripcion || "",
      monto: item.monto || 0,
      banco: (item as Deposit).banco || "",
      numeroBoleta: (item as Deposit).numeroBoleta || "",
    });
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await toast.promise(mutateAsync(formData), {
        loading: "Actualizando registro...",
        success: "Registro actualizado",
        error: "Error al actualizar",
      });
      onSuccess();
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-t-4 border-t-[#7b2c7d]">
        <DialogHeader>
          <DialogTitle className="text-[#7b2c7d]">
            Editar {type === "deposito" ? "Depósito" : "Egreso"} #{item.id}
          </DialogTitle>
          <DialogDescription>
            Modifica los detalles del registro.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label>Monto</Label>
              <Input
                type="number"
                value={formData.monto}
                onChange={(e) =>
                  setFormData({ ...formData, monto: Number(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </div>

            {/* Campos exclusivos de Deposito */}
            {type === "deposito" && (
              <>
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={formData.banco}
                    onChange={(e) =>
                      setFormData({ ...formData, banco: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Boleta</Label>
                  <Input
                    value={formData.numeroBoleta}
                    onChange={(e) =>
                      setFormData({ ...formData, numeroBoleta: e.target.value })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-[#7b2c7d] hover:bg-[#6a256b] text-white"
              disabled={isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// SUB-COMPONENTES DE TABLA

interface TablaProps<T> {
  data: T[];
  loading: boolean;
  onAction: (type: "edit" | "delete", item: T) => void;
  formatCurrency: (val: number) => string;
}

function TablaDepositos({
  data,
  loading,
  onAction,
  formatCurrency,
}: TablaProps<Deposit>) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

  const currentData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading)
    return (
      <div className="p-12 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
        <Banknote className="h-10 w-10 mb-2 opacity-50" />
        <p>Cargando depósitos...</p>
      </div>
    );

  return (
    <div className="flex flex-col min-h-[400px]">
      <Table>
        <TableHeader className="bg-[#fff5f7]/50 dark:bg-[#7b2c7d]/5">
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Banco / Boleta</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead className="hidden md:table-cell">Fecha</TableHead>
            <TableHead className="hidden md:table-cell">Usuario</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-32 text-center text-muted-foreground"
              >
                No hay depósitos registrados.
              </TableCell>
            </TableRow>
          ) : (
            currentData.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-[#fff5f7]/40 dark:hover:bg-[#7b2c7d]/10"
              >
                <TableCell className="font-medium text-[#7b2c7d]">
                  #{item.id}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold uppercase text-xs">
                      {item.banco}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Bol: {item.numeroBoleta}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className="max-w-[200px] truncate text-sm"
                  title={item.descripcion}
                >
                  {item.descripcion}
                </TableCell>
                <TableCell className="font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(item.monto)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {formatearFecha(item.fechaDeposito)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs">
                  {item.usuario.nombre}
                </TableCell>

                <TableCell className="text-right">
                  <ActionMenu onAction={(type) => onAction(type, item)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="mt-auto py-4 border-t">
        <CustomPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function TablaEgresos({
  data,
  loading,
  onAction,
  formatCurrency,
}: TablaProps<Expense>) {
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage) || 1;

  const currentData = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  if (loading)
    return (
      <div className="p-12 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
        <ArrowUpFromLine className="h-10 w-10 mb-2 opacity-50" />
        <p>Cargando egresos...</p>
      </div>
    );

  return (
    <div className="flex flex-col min-h-[400px]">
      <Table>
        <TableHeader className="bg-[#fff5f7]/50 dark:bg-[#7b2c7d]/5">
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Monto</TableHead>
            <TableHead className="hidden md:table-cell">Fecha</TableHead>
            <TableHead className="hidden md:table-cell">
              Registrado por
            </TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                No hay egresos registrados.
              </TableCell>
            </TableRow>
          ) : (
            currentData.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-[#fff5f7]/40 dark:hover:bg-[#7b2c7d]/10"
              >
                <TableCell className="font-medium text-[#7b2c7d]">
                  #{item.id}
                </TableCell>
                <TableCell
                  className="max-w-[300px] truncate text-sm"
                  title={item.descripcion}
                >
                  {item.descripcion}
                </TableCell>
                <TableCell className="font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(item.monto)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                  {formatearFecha(item.fechaEgreso)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs">
                  {item.usuario.nombre}{" "}
                  <span className="text-[10px] text-muted-foreground">
                    ({item.usuario.rol})
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <ActionMenu onAction={(type) => onAction(type, item)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <div className="mt-auto py-4 border-t">
        <CustomPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}

function ActionMenu({
  onAction,
}: {
  onAction: (type: "edit" | "delete") => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0 text-muted-foreground hover:text-[#7b2c7d] hover:bg-[#7b2c7d]/10"
        >
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>

        <DropdownMenuItem
          onClick={() => onAction("delete")}
          className="cursor-pointer text-red-600 focus:text-red-600 group"
        >
          <Trash2 className="mr-2 h-4 w-4 group-hover:text-red-700" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={
              currentPage === 1
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
        <PaginationItem>
          <span className="flex h-9 min-w-9 items-center justify-center text-sm font-medium">
            Página {currentPage} de {totalPages}
          </span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={
              currentPage === totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
