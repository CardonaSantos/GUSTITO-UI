import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProveedorType } from "@/Types/Providers/ProvidersType";
import {
  Building,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Search,
  ShowerHeadIcon,
  User,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
const API_URL = import.meta.env.VITE_API_URL;
interface ProveedorFormData {
  nombre: string;
  correo: string;
  telefono: string;
  direccion?: string;
  razonSocial?: string;
  rfc?: string;
  nombreContacto?: string;
  telefonoContacto?: string;
  emailContacto?: string;
  pais?: string;
  ciudad?: string;
  codigoPostal?: string;
  latitud?: number;
  longitud?: number;
  activo: boolean;
  notas?: string;
}

export default function AgregarProveedor() {
  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: "",
    correo: "",
    telefono: "",
    activo: true,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/proveedor`, {
        ...formData,
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Proveedor creado");
        window.location.reload();
      }
    } catch (error) {
      console.log(error);
      toast.error("error");
    }
  };

  console.log("lo que va enviar es: ", formData);
  const [providers, setProviders] = useState<ProveedorType[]>([]);
  const [providerEdit, setProviderEdit] = useState<ProveedorType>();
  const [providerView, setProviderView] = useState<ProveedorType | null>(null);

  const getProviders = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/proveedor/get-complete-providers`
      );
      if (response.status === 200) {
        setProviders(response.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al encontrar proveedores");
    }
  };

  useEffect(() => {
    getProviders();
  }, []);

  console.log("Proveedores: ", providers);

  //?=======================================>
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const proveedoresPorPagina = 10;

  const proveedoresFiltrados = providers.filter((proveedor) =>
    proveedor.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(
    proveedoresFiltrados.length / proveedoresPorPagina
  );
  const proveedoresPaginados = proveedoresFiltrados.slice(
    (pagina - 1) * proveedoresPorPagina,
    pagina * proveedoresPorPagina
  );

  console.log("El proveedor editando es: ", providerEdit);

  ///STATES DEL EDIT

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProviderEdit((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        `${API_URL}/proveedor/edit-provider/${providerEdit?.id}`,
        {
          ...providerEdit,
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Proveedor editado");
        getProviders();
        // window.location.reload();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error al editar proveedor");
    }
  };

  // const [isOpenView, setIsOpenView] = useState(false);
  // const [isOpenEdit, setIsOpenEdit] = useState(false);

  const InfoItem = ({
    icon,
    label,
    value,
  }: {
    icon: React.ReactNode;
    label: string;
    value?: string;
  }) => (
    <div className="flex items-start space-x-3 p-2">
      <div className="flex-shrink-0 text-primary">{icon}</div>
      <div>
        <p className="font-medium text-sm text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "No especificado"}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add">Agregar Proveedor</TabsTrigger>
          <TabsTrigger value="provider">Proveedores</TabsTrigger>
        </TabsList>
        <TabsContent value="add">
          <Card className="w-full max-w-4xl mx-auto shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Agregar Nuevo Proveedor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="correo">Correo Electrónico</Label>
                    <Input
                      id="correo"
                      name="correo"
                      type="email"
                      value={formData.correo}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Input
                      id="direccion"
                      name="direccion"
                      value={formData.direccion || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="razonSocial">Razón Social</Label>
                    <Input
                      id="razonSocial"
                      name="razonSocial"
                      value={formData.razonSocial || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rfc">RFC</Label>
                    <Input
                      id="rfc"
                      name="rfc"
                      value={formData.rfc || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nombreContacto">Nombre de Contacto</Label>
                    <Input
                      id="nombreContacto"
                      name="nombreContacto"
                      value={formData.nombreContacto || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefonoContacto">
                      Teléfono de Contacto
                    </Label>
                    <Input
                      id="telefonoContacto"
                      name="telefonoContacto"
                      value={formData.telefonoContacto || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailContacto">Email de Contacto</Label>
                    <Input
                      id="emailContacto"
                      name="emailContacto"
                      type="email"
                      value={formData.emailContacto || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      name="pais"
                      value={formData.pais || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <Input
                      id="ciudad"
                      name="ciudad"
                      value={formData.ciudad || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codigoPostal">Código Postal</Label>
                    <Input
                      id="codigoPostal"
                      name="codigoPostal"
                      value={formData.codigoPostal || ""}
                      onChange={handleInputChange}
                    />
                  </div>
                  {/* <div className="space-y-2">
                <Label htmlFor="latitud">Latitud</Label>
                <Input
                  id="latitud"
                  name="latitud"
                  type="number"
                  step="any"
                  value={formData.latitud || ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitud">Longitud</Label>
                <Input
                  id="longitud"
                  name="longitud"
                  type="number"
                  step="any"
                  value={formData.longitud || ""}
                  onChange={handleInputChange}
                />
              </div> */}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    name="notas"
                    value={formData.notas || ""}
                    onChange={handleInputChange}
                    className="min-h-[100px]"
                  />
                </div>
                {/* <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="activo">Activo</Label>
            </div> */}
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" onClick={handleSubmit}>
                Crear Proveedor
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="provider">
          <div className="container mx-auto  shadow-xl px-4 py-8">
            <h1 className="text-2xl font-bold mb-5 text-center">Proveedores</h1>
            <div className="flex justify-between items-center mb-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Ciudad</TableHead>
                  <TableHead>Activo</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proveedoresPaginados.map((proveedor) => (
                  <TableRow key={proveedor.id}>
                    <TableCell>{proveedor.nombre}</TableCell>
                    <TableCell>{proveedor.correo}</TableCell>
                    <TableCell>{proveedor.telefono}</TableCell>
                    <TableCell>{proveedor.ciudad || "N/A"}</TableCell>
                    <TableCell>{proveedor.activo ? "Sí" : "No"}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalles"
                            onClick={() => setProviderView(proveedor)} // proveedor debe ser el objeto seleccionado
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {providerView && (
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold text-center">
                                {providerView.nombre}
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] pr-4">
                              <Card className="mt-4 border-none shadow-none">
                                <CardHeader>
                                  <CardTitle className="text-xl font-semibold text-primary dark:text-white">
                                    Información General
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InfoItem
                                    icon={
                                      <Mail
                                        className="h-5 w-5
                                      dark:text-white
                                      "
                                      />
                                    }
                                    label="Correo"
                                    value={providerView.correo ?? undefined}
                                  />
                                  <InfoItem
                                    icon={
                                      <Phone
                                        className="h-5 w-5
                                      dark:text-white
                                      "
                                      />
                                    }
                                    label="Teléfono"
                                    value={providerView.telefono ?? undefined}
                                  />
                                  <InfoItem
                                    icon={
                                      <MapPin
                                        className="h-5 w-5
                                      dark:text-white
                                      "
                                      />
                                    }
                                    label="Dirección"
                                    value={providerView.direccion ?? undefined}
                                  />
                                  <InfoItem
                                    icon={
                                      <Building
                                        className="h-5 w-5
                                      dark:text-white
                                      "
                                      />
                                    }
                                    label="Razón Social"
                                    value={
                                      providerView.razonSocial ?? undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={
                                      <FileText className="h-5 w-5 dark:text-white" />
                                    }
                                    label="RFC"
                                    value={providerView.rfc ?? undefined}
                                  />
                                </CardContent>
                              </Card>

                              <Card className="mt-6 border-none shadow-none">
                                <CardHeader>
                                  <CardTitle className="text-xl font-semibold text-primary">
                                    Información de Contacto
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InfoItem
                                    icon={<User className="h-5 w-5" />}
                                    label="Nombre del Contacto"
                                    value={
                                      providerView.nombreContacto ?? undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={<Phone className="h-5 w-5" />}
                                    label="Teléfono de Contacto"
                                    value={
                                      providerView.telefonoContacto ?? undefined
                                    }
                                  />
                                  <InfoItem
                                    icon={<Mail className="h-5 w-5" />}
                                    label="Email de Contacto"
                                    value={
                                      providerView.emailContacto ?? undefined
                                    }
                                  />
                                </CardContent>
                              </Card>

                              <Card className="mt-6 border-none shadow-none">
                                <CardHeader>
                                  <CardTitle className="text-xl font-semibold text-primary">
                                    Ubicación
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <InfoItem
                                    icon={<Globe className="h-5 w-5" />}
                                    label="País"
                                    value={providerView.pais ?? undefined}
                                  />
                                  <InfoItem
                                    icon={<Building className="h-5 w-5" />}
                                    label="Ciudad"
                                    value={providerView.ciudad ?? undefined}
                                  />
                                  <InfoItem
                                    icon={<MapPin className="h-5 w-5" />}
                                    label="Código Postal"
                                    value={
                                      providerView.codigoPostal ?? undefined
                                    }
                                  />
                                </CardContent>
                              </Card>

                              {providerView.notas && (
                                <Card className="mt-6 border-none shadow-none">
                                  <CardHeader>
                                    <CardTitle className="text-xl font-semibold text-primary">
                                      Notas
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm">
                                      {providerView.notas}
                                    </p>
                                  </CardContent>
                                </Card>
                              )}
                            </ScrollArea>
                          </DialogContent>
                        )}
                      </Dialog>

                      {/* EDICION DE PRODUCTO */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            title="Ver detalles"
                            onClick={() => {
                              setProviderEdit(proveedor);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-h-[95vh] h-auto overflow-y-auto p-4">
                          <form
                            onSubmit={handleEditSubmit}
                            className="space-y-4"
                          >
                            <div className="flex items-center gap-2">
                              <ShowerHeadIcon className="h-5 w-5 text-gray-600" />
                              <h2 className="text-xl font-bold">
                                Editar Proveedor
                              </h2>
                            </div>

                            {/* Nombre */}
                            <div>
                              <label className="font-semibold">Nombre</label>
                              <Input
                                name="nombre"
                                value={providerEdit?.nombre || ""}
                                onChange={handleChange}
                                placeholder="Nombre"
                                className="w-full"
                              />
                            </div>

                            {/* Correo */}
                            <div>
                              <label className="font-semibold">Correo</label>
                              <Input
                                name="correo"
                                type="email"
                                value={providerEdit?.correo || ""}
                                onChange={handleChange}
                                placeholder="Correo"
                                className="w-full"
                              />
                            </div>

                            {/* Teléfono */}
                            <div>
                              <label className="font-semibold">Teléfono</label>
                              <Input
                                name="telefono"
                                value={providerEdit?.telefono || ""}
                                onChange={handleChange}
                                placeholder="Teléfono"
                                className="w-full"
                              />
                            </div>

                            {/* Dirección */}
                            <div>
                              <label className="font-semibold">Dirección</label>
                              <Textarea
                                name="direccion"
                                value={providerEdit?.direccion || ""}
                                onChange={handleChange}
                                placeholder="Dirección"
                                className="w-full"
                              />
                            </div>

                            {/* Razón Social */}
                            <div>
                              <label className="font-semibold">
                                Razón Social
                              </label>
                              <Input
                                name="razonSocial"
                                value={providerEdit?.razonSocial || ""}
                                onChange={handleChange}
                                placeholder="Razón Social"
                                className="w-full"
                              />
                            </div>

                            {/* RFC */}
                            <div>
                              <label className="font-semibold">RFC</label>
                              <Input
                                name="rfc"
                                value={providerEdit?.rfc || ""}
                                onChange={handleChange}
                                placeholder="RFC"
                                className="w-full"
                              />
                            </div>

                            {/* Nombre del Contacto */}
                            <div>
                              <label className="font-semibold">
                                Nombre del Contacto
                              </label>
                              <Input
                                name="nombreContacto"
                                value={providerEdit?.nombreContacto || ""}
                                onChange={handleChange}
                                placeholder="Nombre del Contacto"
                                className="w-full"
                              />
                            </div>

                            {/* Teléfono del Contacto */}
                            <div>
                              <label className="font-semibold">
                                Teléfono del Contacto
                              </label>
                              <Input
                                name="telefonoContacto"
                                value={providerEdit?.telefonoContacto || ""}
                                onChange={handleChange}
                                placeholder="Teléfono del Contacto"
                                className="w-full"
                              />
                            </div>

                            {/* Email del Contacto */}
                            <div>
                              <label className="font-semibold">
                                Email del Contacto
                              </label>
                              <Input
                                name="emailContacto"
                                type="email"
                                value={providerEdit?.emailContacto || ""}
                                onChange={handleChange}
                                placeholder="Email del Contacto"
                                className="w-full"
                              />
                            </div>

                            {/* País */}
                            <div>
                              <label className="font-semibold">País</label>
                              <Input
                                name="pais"
                                value={providerEdit?.pais || ""}
                                onChange={handleChange}
                                placeholder="País"
                                className="w-full"
                              />
                            </div>

                            {/* Ciudad */}
                            <div>
                              <label className="font-semibold">Ciudad</label>
                              <Input
                                name="ciudad"
                                value={providerEdit?.ciudad || ""}
                                onChange={handleChange}
                                placeholder="Ciudad"
                                className="w-full"
                              />
                            </div>

                            {/* Código Postal */}
                            <div>
                              <label className="font-semibold">
                                Código Postal
                              </label>
                              <Input
                                name="codigoPostal"
                                value={providerEdit?.codigoPostal || ""}
                                onChange={handleChange}
                                placeholder="Código Postal"
                                className="w-full"
                              />
                            </div>

                            {/* Latitud */}
                            {/* <div>
                              <label className="font-semibold">Latitud</label>
                              <Input
                                name="latitud"
                                type="number"
                                value={providerEdit?.latitud || ""}
                                onChange={handleChange}
                                placeholder="Latitud"
                                className="w-full"
                              />
                            </div> */}

                            {/* Longitud */}
                            {/* <div>
                              <label className="font-semibold">Longitud</label>
                              <Input
                                name="longitud"
                                type="number"
                                value={providerEdit?.longitud || ""}
                                onChange={handleChange}
                                placeholder="Longitud"
                                className="w-full"
                              />
                            </div> */}

                            {/* Activo */}
                            {/* <div className="flex items-center">
        <label className="font-semibold">Activo</label>
        <Switch checked={providerEdit?.activo || false} onChange={handleSwitchChange} />
      </div> */}

                            {/* Notas */}
                            <div>
                              <label className="font-semibold">Notas</label>
                              <Textarea
                                name="notas"
                                value={providerEdit?.notas || ""}
                                onChange={handleChange}
                                placeholder="Notas"
                                className="w-full"
                              />
                            </div>

                            {/* Botón de enviar */}
                            <Button type="submit" className="w-full">
                              Guardar cambios
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-between items-center mt-4">
              <div>
                Mostrando {(pagina - 1) * proveedoresPorPagina + 1} -{" "}
                {Math.min(
                  pagina * proveedoresPorPagina,
                  proveedoresFiltrados.length
                )}{" "}
                de {proveedoresFiltrados.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas, p + 1))
                  }
                  disabled={pagina === totalPaginas}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
