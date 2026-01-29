import {
  Home,
  ShoppingCart,
  Clock,
  Box,
  Users,
  AlertCircle,
  Wallet,
  ClipboardList,
  NotepadText,
  FileStack,
  ClipboardPen,
  PackageOpen,
  Package,
  Tag,
  CoinsIcon,
  NotebookIcon,
  NotebookText,
  Building,
  SendToBack,
  Bolt,
  ChevronDown,
  Goal,
  Target,
  ChartBarBig,
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

import { useStore } from "@/components/Context/ContextSucursal";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useMemo } from "react";

const menuVendedor = [
  { icon: Home, label: "Home", href: "/" },
  { icon: ShoppingCart, label: "Punto de Venta", href: "/punto-venta" },
  { icon: Clock, label: "Historial de Ventas", href: "/historial/ventas" },
  { icon: Box, label: "Añadir Stock", href: "/adicion-stock" },
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
  { icon: Users, label: "Clientes", href: "/clientes-manage" },
  { icon: AlertCircle, label: "Vencimientos", href: "/vencimientos" },
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
  { icon: Home, label: "Home", href: "/" },
  { icon: ChartBarBig, label: "Análisis ", href: "/analisis" },

  { icon: ShoppingCart, label: "Punto de Venta", href: "/punto-venta" },
  { icon: Clock, label: "Historial de Ventas", href: "/historial/ventas" },
  {
    icon: Package,
    label: "Inventario y Stock",
    submenu: [
      { icon: PackageOpen, label: "Inventario", href: "/inventario" },
      {
        icon: Package,
        label: "Inventario Empaques",
        href: "/inventario-empaques",
      },
      { icon: Box, label: "Añadir Stock", href: "/adicion-stock" },
      { icon: Users, label: "Proveedores", href: "/agregar-proveedor" },
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
  { icon: Tag, label: "Categorías", href: "/categorias" },
  { icon: AlertCircle, label: "Vencimientos", href: "/vencimientos" },
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
        label: "Historial Movimientos",
        href: "/historial/depositos-egresos",
      },
    ],
  },
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

  {
    icon: Goal,
    label: "Metas",
    submenu: [
      {
        icon: Goal,
        label: "Metas",
        href: "/metas",
      },

      {
        icon: Target,
        label: "Mis metas",
        href: "/mis-metas",
      },
    ],
  },

  { icon: SendToBack, label: "Transferencia", href: "/transferencia" },
  { icon: Building, label: "Sucursal", href: "/sucursal" },
  { icon: Bolt, label: "Config", href: "/config/user" },
];

export function AppSidebar() {
  const rolUser = useStore((state) => state.userRol);
  const displayedRoutes = useMemo(() => {
    if (rolUser === "ADMIN" || rolUser === "SUPER_ADMIN") return menuItemsAdmin;
    return menuVendedor;
  }, [rolUser]);

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarContent>
        <div className="overflow-y-auto">
          <SidebarGroup>
            <SidebarGroupLabel>Secciones</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {displayedRoutes.map((item) => {
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
