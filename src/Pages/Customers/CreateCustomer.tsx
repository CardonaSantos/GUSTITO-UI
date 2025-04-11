import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Edit } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = import.meta.env.VITE_API_URL;

interface ClienteResponse {
  id: number;
  nombre: string;
  telefono: string;
  dpi: string;
  direccion: string;
  iPInternet: string;
  actualizadoEn: string;
  _count: {
    compras: number;
  };
}

// Define form data structure
interface FormData {
  nombre: string;
  telefono?: string;
  direccion?: string;
  dpi?: string;
  iPInternet?: string;
}

interface FormDataEdit {
  id: number;
  nombre: string;
  telefono?: string;
  direccion?: string;
  dpi?: string;
  iPInternet?: string;
}

// Define form errors structure
interface FormErrors {
  nombre?: string;
  dpi?: string;
  telefono?: string;
}

export default function CreateCustomer() {
  const [formData, setFormData] = useState<FormData>({
    nombre: "",
    telefono: "",
    direccion: "",
    dpi: "",
    iPInternet: "",
  });

  const [formDataEdit, setFormDataEdit] = useState<FormDataEdit>({
    nombre: "",
    telefono: "",
    direccion: "",
    dpi: "",
    id: 0,
    iPInternet: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);

  // HANDLE PARA EL CHANGE
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // VALIDAR FORM
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (formData.dpi && !/^\d{13}$/.test(formData.dpi))
      newErrors.dpi = "El DPI debe tener 13 dígitos";
    if (formData.telefono && !/^\d{8}$/.test(formData.telefono))
      newErrors.telefono = "El teléfono debe tener 8 dígitos";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // CREAR CLIENTE
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await axios.post(`${API_URL}/client`, formData);
        if (response.status === 201) {
          toast.success("Cliente creado");
          setFormData({
            nombre: "",
            telefono: "",
            direccion: "",
            dpi: "",
            iPInternet: "",
          });
        } else {
          throw new Error("Failed to create client");
        }
      } catch (error) {
        toast.error("Error al crear el cliente");
      }
    }
  };

  // Fetch clientes data from API
  const getCustomers = async () => {
    try {
      const response = await axios.get(`${API_URL}/client/get-all-customers`);
      if (response.status === 200) {
        setClientes(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al conseguir clientes");
    }
  };

  //CONSEGUIR CLIENTES DEL SERVER
  useEffect(() => {
    getCustomers();
  }, []);

  console.log("LOS CLIENTES SON: ", clientes);

  const [searchTermn, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"more" | "less">("more");

  // Filtrado y ordenación combinados
  const filteredClientes = [...clientes]
    .filter(
      (cliente) =>
        cliente.nombre
          .toLocaleLowerCase()
          .includes(searchTermn.toLocaleLowerCase()) ||
        cliente.dpi.includes(searchTermn) ||
        cliente.direccion
          .toLocaleLowerCase()
          .trim()
          .includes(searchTermn.toLocaleLowerCase()) ||
        cliente.telefono.includes(searchTermn)
    )
    .sort((a, b) => {
      return filterType === "more"
        ? b._count.compras - a._count.compras // Descendente para más compras
        : a._count.compras - b._count.compras; // Ascendente para menos compras
    });

  //PARA ELA PAGINACION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const totalPages = Math.ceil(filteredClientes.length / itemsPerPage);
  // Calcular el índice del último elemento de la página actual
  const indexOfLastItem = currentPage * itemsPerPage;
  // Calcular el índice del primer elemento de la página actual
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // Obtener los elementos de la página actual
  const currentItems = filteredClientes.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  // Cambiar de página
  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  //DIALOG
  const [openSection, setOpenSection] = useState(false);
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);

  // Función para manejar la apertura del diálogo y cargar datos del cliente
  const handleEditClick = (client: FormDataEdit) => {
    setFormDataEdit({
      nombre: client.nombre || "",
      telefono: client.telefono || "",
      direccion: client.direccion || "",
      dpi: client.dpi || "",
      id: client.id,
      iPInternet: client.iPInternet || "",
    });
    setOpenSection(true);
  };

  // Función para cerrar el diálogo
  const handleClose = () => {
    setOpenSection(false);
  };

  const handleSubmitEditCustomer = async () => {
    try {
      const response = await axios.patch(
        `${API_URL}/client/${formDataEdit.id}`,
        formDataEdit
      );

      if (response.status === 200) {
        toast.success("Cliente actualizado correctamente");
        handleClose();
        getCustomers();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al actualizar el cliente");
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      const response = await axios.delete(
        `${API_URL}/client/${formDataEdit.id}`
      );
      if (response.status === 200) {
        toast.success("Usuario eliminado correctamente");
        getCustomers();
        setOpenConfirmDelete(false);
        handleClose();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al eliminar cliente");
    }
  };

  return (
    <Tabs defaultValue="crear-cliente" className="w-full ">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="crear-cliente">Crear Cliente</TabsTrigger>
        <TabsTrigger value="clientes">Clientes</TabsTrigger>
      </TabsList>
      {/* Formulario para crear cliente */}
      <TabsContent value="crear-cliente">
        <Card className="shadow-xl">
          <CardHeader></CardHeader>
          <CardContent className="space-y-2">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 max-w-2xl mx-auto p-6 bg-card rounded-lg shadow-md"
            >
              <h2 className="text-2xl font-bold text-center mb-6">
                Crear Nuevo Cliente
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className={errors.nombre ? "border-destructive" : ""}
                  />
                  {errors.nombre && (
                    <p className="text-sm text-destructive">{errors.nombre}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dpi">DPI (opcional)</Label>
                  <Input
                    id="dpi"
                    name="dpi"
                    value={formData.dpi}
                    onChange={handleChange}
                    className={errors.dpi ? "border-destructive" : ""}
                  />
                  {errors.dpi && (
                    <p className="text-sm text-destructive">{errors.dpi}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono (opcional)</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className={errors.telefono ? "border-destructive" : ""}
                  />
                  {errors.telefono && (
                    <p className="text-sm text-destructive">
                      {errors.telefono}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección (opcional)</Label>
                  <Input
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Crear Cliente
              </Button>
            </form>
          </CardContent>
          <CardFooter></CardFooter>
        </Card>
      </TabsContent>

      {/* Tabla de clientes */}
      <TabsContent value="clientes">
        <div className="my-3 ">
          <Input
            className="my-2"
            onChange={(e) => setSearchTerm(e.target.value)}
            value={searchTermn}
            placeholder="Buscar por Nombre, DPI, Teléfono, Dirección..."
          />
          <Select
            onValueChange={(value) => setFilterType(value as "more" | "less")}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecciona un filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="more">Más Compras</SelectItem>
              <SelectItem value="less">Menos Compras</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>Clientes disponibles</CardTitle>
            <CardDescription>
              Visualiza y gestiona la información de los clientes existentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Table>
              <TableCaption>Clientes disponibles</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Cliente No.</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead className="text-right">DPI</TableHead>
                  {/* <TableHead className="text-right">IP</TableHead> */}
                  <TableHead className="text-right">Dirección</TableHead>
                  <TableHead className="text-right">Compras hechas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentItems &&
                  currentItems.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">
                        #{client.id ?? "ID no disponible"}
                      </TableCell>
                      <TableCell>
                        {client.nombre || "Nombre no disponible"}
                      </TableCell>
                      <TableCell>
                        {client.telefono || "Teléfono no disponible"}
                      </TableCell>
                      <TableCell className="text-right">
                        {client.dpi || "DPI no disponible"}
                      </TableCell>

                      {/* <TableCell className="text-right">
                        {client.iPInternet || "N/A"}
                      </TableCell> */}

                      <TableCell className="text-right">
                        {client.direccion || "Dirección no disponible"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/cliente-historial-compras/${client.id}`}>
                          <Button variant={"outline"}>
                            {client._count?.compras ?? 0}
                          </Button>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleEditClick(client)}
                          variant={"outline"}
                        >
                          <Edit />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
              <Dialog open={openSection} onOpenChange={setOpenSection}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-center">
                      Editar Información del Cliente
                    </DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <label>
                      Nombre:
                      <input
                        type="text"
                        value={formDataEdit.nombre}
                        onChange={(e) =>
                          setFormDataEdit({
                            ...formDataEdit,
                            nombre: e.target.value,
                          })
                        }
                        className="border p-2 rounded w-full bg-transparent"
                      />
                    </label>
                    <label>
                      Teléfono:
                      <input
                        type="text"
                        value={formDataEdit.telefono}
                        onChange={(e) =>
                          setFormDataEdit({
                            ...formDataEdit,
                            telefono: e.target.value,
                          })
                        }
                        className="border p-2 rounded w-full bg-transparent"
                      />
                    </label>
                    <label>
                      Dirección:
                      <input
                        type="text"
                        value={formDataEdit.direccion}
                        onChange={(e) =>
                          setFormDataEdit({
                            ...formDataEdit,
                            direccion: e.target.value,
                          })
                        }
                        className="border p-2 rounded w-full bg-transparent"
                      />
                    </label>
                    {/* 
                    <label>
                      IP Internet:
                      <input
                        type="text"
                        value={formDataEdit.iPInternet}
                        onChange={(e) =>
                          setFormDataEdit({
                            ...formDataEdit,
                            iPInternet: e.target.value,
                          })
                        }
                        className="border p-2 rounded w-full bg-transparent"
                      />
                    </label> */}

                    <label>
                      DPI:
                      <input
                        type="text"
                        value={formDataEdit.dpi}
                        onChange={(e) =>
                          setFormDataEdit({
                            ...formDataEdit,
                            dpi: e.target.value,
                          })
                        }
                        className="border p-2 rounded w-full bg-transparent"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end items-center gap-2 mt-4">
                    <Button
                      variant={"destructive"}
                      className="px-5 py-2 rounded"
                      // onClick={handleDeleteCustomer}
                      onClick={() => setOpenConfirmDelete(true)}
                    >
                      Eliminar Cliente
                    </Button>

                    <Button
                      variant={"outline"}
                      className="px-4 py-2 rounded"
                      onClick={handleClose}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant={"default"}
                      className="px-4 py-2 rounded"
                      onClick={() => {
                        handleSubmitEditCustomer();
                      }}
                    >
                      Guardar Cambios
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog
                open={openConfirmDelete}
                onOpenChange={setOpenConfirmDelete}
              >
                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-center">
                      Confirmación de eliminación de cliente
                    </DialogTitle>
                    <DialogDescription className="text-center mt-2 text-sm text-gray-600">
                      Esta acción es permanente. Al eliminar este cliente, se
                      borrará completamente de la base de datos, incluyendo
                      todos sus registros de compras.
                    </DialogDescription>
                    <DialogDescription className="text-center mt-1 text-base font-medium">
                      ¿Estás seguro de que deseas continuar?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                      variant={"outline"}
                      className="px-4 py-2 rounded w-full"
                      onClick={() => setOpenConfirmDelete(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant={"destructive"}
                      className="px-4 py-2 rounded w-full"
                      onClick={handleDeleteCustomer}
                    >
                      Sí, eliminar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <TableFooter></TableFooter>
            </Table>
          </CardContent>
          <CardFooter className="flex justify-center items-center">
            <div className="flex items-center justify-center py-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button onClick={() => onPageChange(1)}>Primero</Button>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </PaginationPrevious>
                  </PaginationItem>

                  {/* Sistema de truncado */}
                  {currentPage > 3 && (
                    <>
                      <PaginationItem>
                        <PaginationLink onClick={() => onPageChange(1)}>
                          1
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <span className="text-muted-foreground">...</span>
                      </PaginationItem>
                    </>
                  )}

                  {Array.from({ length: totalPages }, (_, index) => {
                    const page = index + 1;
                    if (
                      page === currentPage ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={index}>
                          <PaginationLink
                            onClick={() => onPageChange(page)}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  {currentPage < totalPages - 2 && (
                    <>
                      <PaginationItem>
                        <span className="text-muted-foreground">...</span>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => onPageChange(totalPages)}
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    </>
                  )}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        onPageChange(Math.min(totalPages, currentPage + 1))
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </PaginationNext>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      variant={"destructive"}
                      onClick={() => onPageChange(totalPages)}
                    >
                      Último
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
