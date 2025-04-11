"use client";

import type React from "react";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useStore } from "@/components/Context/ContextSucursal";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Icons
import {
  AtSign,
  Building,
  BarChartIcon as ChartBarIcon,
  CheckCircle,
  Edit,
  Eye,
  KeyRound,
  Loader2,
  LockIcon,
  Mail,
  Save,
  ShieldAlert,
  ShieldCheck,
  Store,
  User,
  UserCog,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface UserType {
  id: number;
  nombre: string;
  activo: boolean;
  correo: string;
  rol: string;
  contrasena?: string;
  contrasenaConfirm?: string;
}

interface Sucursal {
  id: number;
  nombre: string;
}

interface UsuarioResponse {
  id: number;
  activo: boolean;
  nombre: string;
  correo: string;
  sucursal: Sucursal;
  rol: string;
  totalVentas: number;
}

export default function UserConfig() {
  const { userId } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current user state
  const [user, setUser] = useState<UserType>({
    id: 0,
    nombre: "",
    correo: "",
    rol: "",
    activo: true,
    contrasena: "",
    contrasenaConfirm: "",
  });

  // User being edited state
  const [userEdit, setUserEdit] = useState<UserType>({
    id: 0,
    nombre: "",
    correo: "",
    rol: "",
    activo: true,
    contrasena: "",
    contrasenaConfirm: "",
  });

  // All users state
  const [users, setUsers] = useState<UsuarioResponse[]>([]);

  // UI state
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch current user data
  const getUser = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/user/fin-my-user/${userId}`);
      if (response.status === 200) {
        setUser({
          ...response.data,
          contrasena: "",
          contrasenaConfirm: "",
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener datos del usuario");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users
  const getUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/user/fin-all-users`);
      if (response.status === 200) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al obtener lista de usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    if (userId) {
      getUser();
    }
    getUsers();
  }, [userId]);

  // Handle current user form input changes
  const handleChangeInputs = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  // Handle edit user form input changes
  const handleChangeEditUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserEdit((prev) => ({ ...prev, [name]: value }));
  };

  // Handle role selection change
  const handleRoleChange = (value: string) => {
    setUserEdit((prev) => ({ ...prev, rol: value }));
  };

  // Toggle user active status
  const handleToggleEditActivo = () => {
    setUserEdit((prev) => ({ ...prev, activo: !prev.activo }));
  };

  // Update current user
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.contrasenaConfirm) {
      toast.warning("Ingrese su contraseña para confirmar el cambio");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.patch(
        `${API_URL}/user/update-user/${userId}`,
        user
      );
      if (response.status === 200 || response.status === 201) {
        toast.success("Usuario actualizado correctamente");
        getUser();
        setConfirmDialog(false);
      }
    } catch (error) {
      toast.error("Error al actualizar usuario. Verifique sus credenciales.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update another user (as admin)
  const handleSubmitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEdit.contrasenaConfirm) {
      toast.warning(
        "Ingrese su contraseña de administrador para confirmar el cambio"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        userId: userEdit.id,
        nombre: userEdit.nombre,
        correo: userEdit.correo,
        rol: userEdit.rol,
        activo: userEdit.activo,
        nuevaContrasena: userEdit.contrasena || undefined,
        adminPassword: userEdit.contrasenaConfirm,
      };

      const response = await axios.patch(
        `${API_URL}/user/update-user/as-admin/${userId}`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Usuario actualizado correctamente");
        getUsers();
        setEditDialog(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al editar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.sucursal.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get role badge color and icon
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          color:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
        };
      case "SUPER_ADMIN":
        return {
          color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          icon: <ShieldAlert className="h-3.5 w-3.5" />,
        };
      case "VENDEDOR":
        return {
          color:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
          icon: <Store className="h-3.5 w-3.5" />,
        };
      case "MANAGER":
        return {
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          icon: <UserCog className="h-3.5 w-3.5" />,
        };
      default:
        return {
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
          icon: <User className="h-3.5 w-3.5" />,
        };
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="usuario" className="w-full">
        <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="usuario" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Mi Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Gestión de Usuarios</span>
          </TabsTrigger>
        </TabsList>

        {/* Mi Perfil Tab */}
        <TabsContent value="usuario">
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-2">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <User className="h-10 w-10 text-gray-500" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">Mi Perfil</CardTitle>
              <CardDescription className="text-center">
                Actualiza tu información personal y credenciales
              </CardDescription>
            </CardHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmDialog(true);
              }}
            >
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </h3>
                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label
                        htmlFor="nombre"
                        className="flex items-center gap-1"
                      >
                        <User className="h-4 w-4" />
                        Nombre
                      </Label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={user.nombre}
                        onChange={handleChangeInputs}
                        placeholder="Tu nombre completo"
                        disabled={isLoading}
                        aria-describedby="nombre-description"
                      />
                      <p
                        id="nombre-description"
                        className="text-sm text-muted-foreground"
                      >
                        Tu nombre completo como aparecerá en el sistema
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="correo"
                        className="flex items-center gap-1"
                      >
                        <Mail className="h-4 w-4" />
                        Correo Electrónico
                      </Label>
                      <Input
                        id="correo"
                        name="correo"
                        type="email"
                        value={user.correo}
                        onChange={handleChangeInputs}
                        placeholder="tu@correo.com"
                        disabled={isLoading}
                        aria-describedby="correo-description"
                      />
                      <p
                        id="correo-description"
                        className="text-sm text-muted-foreground"
                      >
                        Tu correo electrónico para iniciar sesión
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <LockIcon className="h-5 w-5" />
                    Cambiar Contraseña
                  </h3>
                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="contrasena"
                        className="flex items-center gap-1"
                      >
                        <KeyRound className="h-4 w-4" />
                        Nueva Contraseña
                      </Label>
                      <Input
                        id="contrasena"
                        name="contrasena"
                        type="password"
                        value={user.contrasena || ""}
                        onChange={handleChangeInputs}
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="contrasenaConfirm"
                        className="flex items-center gap-1 text-amber-500"
                      >
                        <KeyRound className="h-4 w-4" />
                        Confirmar con Contraseña Actual
                      </Label>
                      <Input
                        id="contrasenaConfirm"
                        name="contrasenaConfirm"
                        type="password"
                        value={user.contrasenaConfirm || ""}
                        onChange={handleChangeInputs}
                        placeholder="••••••••"
                        disabled={isLoading}
                        aria-describedby="password-confirm-description"
                      />
                      <p
                        id="password-confirm-description"
                        className="text-sm text-muted-foreground"
                      >
                        Ingresa tu contraseña actual para confirmar los cambios
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* Gestión de Usuarios Tab */}
        <TabsContent value="usuarios">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Gestión de Usuarios
                </h2>
                <p className="text-muted-foreground">
                  Administra los usuarios del sistema y sus permisos
                </p>
              </div>

              <div className="w-full md:w-auto flex flex-col md:flex-row gap-4">
                <div className="relative">
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full md:w-[300px]"
                  />
                  <Eye className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                </div>

                <Button className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Nuevo Usuario</span>
                </Button>
              </div>
            </div>

            <Card className="shadow-md">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Correo</TableHead>
                      <TableHead>Sucursal</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="flex justify-center items-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                          </div>
                          <p className="mt-2 text-muted-foreground">
                            Cargando usuarios...
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <p className="text-muted-foreground">
                            No se encontraron usuarios
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((usuario) => {
                        const roleBadge = getRoleBadge(usuario.rol);
                        return (
                          <TableRow key={usuario.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-500" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {usuario.nombre}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {usuario.id}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <AtSign className="h-4 w-4 text-muted-foreground" />
                                <span>{usuario.correo}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span>{usuario.sucursal.nombre}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`flex items-center gap-1 ${roleBadge.color}`}
                              >
                                {roleBadge.icon}
                                {usuario.rol}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{usuario.totalVentas}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {usuario.activo ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  Activo
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 flex items-center gap-1"
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                  Inactivo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setUserEdit({
                                    id: usuario.id,
                                    nombre: usuario.nombre,
                                    correo: usuario.correo,
                                    rol: usuario.rol,
                                    activo: usuario.activo,
                                    contrasena: "",
                                    contrasenaConfirm: "",
                                  });
                                  setEditDialog(true);
                                }}
                                className="flex items-center gap-1"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Editar</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Confirm Update Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Actualización</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas actualizar tu información personal?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <User className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">{user.nombre}</p>
                <p className="text-sm text-muted-foreground">{user.correo}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Editar Usuario</DialogTitle>
            <DialogDescription className="text-center">
              Actualiza la información y permisos del usuario
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditUser}>
            <div className="py-2 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="font-medium">{userEdit.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {userEdit.correo}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="edit-nombre"
                    className="text-xs flex items-center gap-1 mb-1"
                  >
                    <User className="h-3 w-3" />
                    Nombre
                  </Label>
                  <Input
                    id="edit-nombre"
                    name="nombre"
                    value={userEdit.nombre}
                    onChange={handleChangeEditUser}
                    placeholder="Nombre completo"
                    className="h-8"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="edit-correo"
                    className="text-xs flex items-center gap-1 mb-1"
                  >
                    <Mail className="h-3 w-3" />
                    Correo Electrónico
                  </Label>
                  <Input
                    id="edit-correo"
                    name="correo"
                    type="email"
                    value={userEdit.correo}
                    onChange={handleChangeEditUser}
                    placeholder="correo@ejemplo.com"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label
                    htmlFor="edit-rol"
                    className="text-xs flex items-center gap-1 mb-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Rol
                  </Label>
                  <Select value={userEdit.rol} onValueChange={handleRoleChange}>
                    <SelectTrigger id="edit-rol" className="h-8">
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="VENDEDOR">
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          <span>Vendedor</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label
                    htmlFor="edit-contrasena"
                    className="text-xs flex items-center gap-1 mb-1"
                  >
                    <KeyRound className="h-3 w-3" />
                    Nueva Contraseña (opcional)
                  </Label>
                  <Input
                    id="edit-contrasena"
                    name="contrasena"
                    type="password"
                    value={userEdit.contrasena || ""}
                    onChange={handleChangeEditUser}
                    placeholder="Dejar en blanco para mantener"
                    className="h-8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <Label
                  htmlFor="edit-activo"
                  className="text-xs flex items-center gap-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  Usuario Activo
                </Label>
                <Switch
                  disabled
                  id="edit-activo"
                  checked={userEdit.activo}
                  onCheckedChange={handleToggleEditActivo}
                />
              </div>

              <Separator className="my-1" />

              <div>
                <Label
                  htmlFor="edit-contrasenaConfirm"
                  className="text-xs flex items-center gap-1 text-amber-500 mb-1"
                >
                  <KeyRound className="h-3 w-3" />
                  Confirmar con tu Contraseña
                </Label>
                <Input
                  id="edit-contrasenaConfirm"
                  name="contrasenaConfirm"
                  type="password"
                  value={userEdit.contrasenaConfirm || ""}
                  onChange={handleChangeEditUser}
                  placeholder="Tu contraseña de administrador"
                  required
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Ingresa tu contraseña de administrador para confirmar los
                  cambios
                </p>
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialog(false)}
                disabled={isSubmitting}
                size="sm"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} size="sm">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-3 w-3" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
