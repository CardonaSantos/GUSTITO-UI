import {
  Home,
  Ticket,
  Wallet,
  ClipboardList,
  NotebookText,
  CoinsIcon,
  Bolt,
  ClipboardPen,
  CreditCard,
  ChevronDown,
  PackageOpen,
  Tag,
  UserPlus,
  Waypoints,
  Cpu,
  Wifi,
  Tags,
  MonitorSmartphone,
  MapIcon,
  MapPinned,
  MapPin,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  ShoppingCart,
  Package,
  Users,
  Box,
  AlertCircle,
  Clock,
  Building,
  NotebookIcon,
  NotepadText,
  FileStack,
} from "lucide-react";
import { useStore } from "../Context/ContextSucursal";
import { Link, useLocation } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { useMemo } from "react";

const menuVendedor = [
  // Sección de Ventas
  { icon: Home, label: "Home", href: "/" },
  { icon: ShoppingCart, label: "Punto de Venta", href: "/punto-venta" },
  { icon: Clock, label: "Historial de Ventas", href: "/historial/ventas" },

  // Sección de Stock
  { icon: Box, label: "Añadir Stock", href: "/adicion-stock" },
  // { icon: Tag, label: "Categorías", href: "/categorias" },

  {
    icon: ClipboardPen,
    label: "Ventas Eliminaciones",
    href: "/historial/ventas-eliminaciones",
  },
  {
    icon: FileStack,
    label: "Stock Eliminaciones",
    href: "/stock-eliminaciones",
  },
  {
    icon: NotepadText,
    label: "Historial Cambios Precio",
    href: "/historial-cambios-precio",
  },

  // Sección de Clientes
  { icon: Users, label: "Clientes", href: "/clientes-manage" },

  // Vencimientos
  { icon: AlertCircle, label: "Vencimientos", href: "/vencimientos" },

  // Sección de Caja
  {
    icon: Wallet,
    label: "Caja",
    submenu: [
      {
        icon: Wallet,
        label: "Depósitos y Egresos",
        href: "/depositos-egresos/",
      },
      { icon: ClipboardList, label: "Registrar Caja", href: "/registro-caja/" },
    ],
  },
];

const menuItemsAdmin = [
  // Sección de Ventas
  { icon: Home, label: "Home", href: "/" },
  { icon: ShoppingCart, label: "Punto de Venta", href: "/punto-venta" },
  { icon: Clock, label: "Historial de Ventas", href: "/historial/ventas" },

  // Sección de Inventario y Stock
  {
    icon: Package,
    label: "Inventario y Stock",
    submenu: [
      { icon: PackageOpen, label: "Inventario", href: "/inventario" },
      { icon: Box, label: "Añadir Stock", href: "/adicion-stock" },
      {
        icon: NotepadText,
        label: "Historial Cambios Precio",
        href: "/historial-cambios-precio",
      },
      {
        icon: FileStack,
        label: "Stock Eliminaciones",
        href: "/stock-eliminaciones",
      },
      { icon: NotebookIcon, label: "Entregas Stock", href: "/entregas-stock" },
    ],
  },

  // Sección de Categorías
  { icon: Tag, label: "Categorías", href: "/categorias" },

  // Vencimientos
  { icon: AlertCircle, label: "Vencimientos", href: "/vencimientos" },

  // Sección de Caja
  {
    icon: Wallet,
    label: "Caja",
    submenu: [
      {
        icon: Wallet,
        label: "Depósitos y Egresos",
        href: "/depositos-egresos/",
      },
      { icon: ClipboardList, label: "Registrar Caja", href: "/registro-caja/" },
      {
        icon: NotebookText,
        label: "Registros de Caja",
        href: "/registros-caja/",
      },
      {
        icon: CoinsIcon,
        label: "Saldo y Egresos",
        href: "/historial/depositos-egresos",
      },
    ],
  },

  // Gestión de Ventas y Créditos
  {
    icon: ClipboardPen,
    label: "Gestión de Ventas",
    submenu: [
      {
        icon: ClipboardPen,
        label: "Ventas Eliminaciones",
        href: "/historial/ventas-eliminaciones",
      },
    ],
  },

  // Configuración
  {
    icon: Bolt,
    label: "Config",
    href: "/config/user",
  },
];

//RUTAS CRM
const routesCrm_Admin = [
  { icon: Home, label: "Inicio", href: "/crm" },

  {
    icon: Users,
    label: "Clientes",
    submenu: [
      {
        icon: Users,
        label: "Listado de Clientes",
        href: "/crm-clientes",
      },
      {
        icon: UserPlus,
        label: "Nuevo Cliente",
        href: "/crm/crear-cliente-crm",
      },
    ],
  },

  { icon: CreditCard, label: "Facturación", href: "/crm/facturacion" },

  {
    icon: MonitorSmartphone,
    label: "Soporte",
    submenu: [
      { icon: Ticket, label: "Tickets de Soporte", href: "/crm/tickets" },
      {
        icon: Tags,
        label: "Categorías de Soporte",
        href: "/crm/tags",
      },
    ],
  },

  // { icon: Users, label: "Detalle del Cliente", href: "/crm/cliente-detalle" },

  // SERVICIOS Y GESTIÓN DE SERVICIOS
  {
    icon: Waypoints,
    label: "Servicios",
    submenu: [
      {
        icon: Cpu,
        label: "Gestión de Servicios",
        href: "/crm-servicios",
      },
      {
        icon: Wifi,
        label: "Servicios de Internet",
        href: "/crm-servicios-internet",
      },
    ],
  },

  {
    icon: MapPinned,
    label: "Facturación por Zona",
    href: "/crm-facturacion-zona",
  },

  {
    icon: MapIcon,
    label: "Rutas Cobro",
    submenu: [
      {
        icon: MapPin,
        label: "Rutas Manage",
        href: "/crm/ruta",
      },
    ],
  },
  { icon: Building, label: "Empresa", href: "/crm/empresa" },
];

const routesCrm_Otro = [
  { icon: Home, label: "Inicio", href: "/crm" },

  {
    icon: Users,
    label: "Clientes",
    submenu: [
      {
        icon: Users,
        label: "Listado de Clientes",
        href: "/crm-clientes",
      },
      {
        icon: UserPlus,
        label: "Nuevo Cliente",
        href: "/crm/crear-cliente-crm",
      },
    ],
  },

  { icon: CreditCard, label: "Facturación", href: "/crm/facturacion" },

  {
    icon: MonitorSmartphone,
    label: "Soporte",
    submenu: [
      { icon: Ticket, label: "Tickets de Soporte", href: "/crm/tickets" },
      {
        icon: Tags,
        label: "Categorías de Soporte",
        href: "/crm/tags",
      },
    ],
  },

  // { icon: Users, label: "Detalle del Cliente", href: "/crm/cliente-detalle" },

  // SERVICIOS Y GESTIÓN DE SERVICIOS
  {
    icon: Waypoints,
    label: "Servicios",
    submenu: [
      {
        icon: Cpu,
        label: "Gestión de Servicios",
        href: "/crm-servicios",
      },
      {
        icon: Wifi,
        label: "Servicios de Internet",
        href: "/crm-servicios-internet",
      },
    ],
  },

  {
    icon: MapPinned,
    label: "Facturación por Zona",
    href: "/crm-facturacion-zona",
  },

  {
    icon: MapIcon,
    label: "Rutas Cobro",
    submenu: [
      {
        icon: MapPin,
        label: "Rutas Manage",
        href: "/crm/ruta",
      },
    ],
  },
  { icon: Building, label: "Empresa", href: "/crm/empresa" },
];

export function AppSidebar() {
  const location = useLocation();
  const rolUser = useStore((state) => state.userRol);

  // Memoriza las rutas según el rol del usuario
  const allRoutes = useMemo(() => {
    if (rolUser === "ADMIN") return menuItemsAdmin;
    if (rolUser === "SUPER_ADMIN") return menuItemsAdmin;
    return menuVendedor;
  }, [rolUser]);

  // Memoriza las rutas CRM según el rol del usuario
  const crmRoutes = useMemo(() => {
    return rolUser === "ADMIN" ? routesCrm_Admin : routesCrm_Otro;
  }, [rolUser]);

  // Extrae los href de todas las rutas CRM (para ocultarlas cuando se esté en CRM)
  const hidenRoutes = useMemo(
    () =>
      routesCrm_Admin.flatMap((ruta) =>
        ruta.href ? [ruta.href] : ruta.submenu?.map((sub) => sub.href) || []
      ),
    []
  );

  // Si la ruta actual es una de las rutas CRM, mostramos solo CRM
  const displayedRoutes = useMemo(() => {
    if (
      hidenRoutes.some((ruta) => ruta && location.pathname.startsWith(ruta))
    ) {
      return crmRoutes;
    }
    return allRoutes;
  }, [location.pathname, allRoutes, crmRoutes, hidenRoutes]);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarContent>
        <div className="overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Secciones</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {displayedRoutes.map((item) => {
                  // Si el item tiene submenú, lo mostramos como un SidebarMenuSub dentro de un Collapsible
                  if (item.submenu) {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <Collapsible defaultOpen className="group/collapsible">
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton>
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span>{item.label}</span>
                              <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.submenu.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.label}>
                                  <SidebarMenuSubButton className="py-5">
                                    <Link
                                      to={subItem.href}
                                      className="flex items-center gap-2"
                                    >
                                      <TooltipProvider>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <subItem.icon className="h-4 w-4 shrink-0" />
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p>{subItem.label}</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                      <span>{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  } else {
                    return (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild>
                          <Link
                            to={item.href}
                            className="flex items-center gap-2"
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <item.icon className="h-4 w-4 shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{item.label}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
