type Stock = {
  id: number;
  cantidad: number;
  fechaIngreso: string; // En formato ISO
  fechaVencimiento: string; // En formato ISO
};

enum TipoPrecio {
  CREADO_POR_SOLICITUD = "CREADO_POR_SOLICITUD",
  ESTANDAR = "ESTANDAR",
}

enum EstadoPrecio {
  APROBADO = "APROBADO",
  PENDIENTE = "PENDIENTE",
  RECHAZADO = "RECHAZADO",
}

export interface Precios {
  id: number;
  precio: number;
  // Propiedades de Control/Metadata
  creadoPorId: number;
  estado: EstadoPrecio;
  fechaCreacion: string; // Se recomienda usar 'string' para fechas ISO-8601 en interfaces
  orden: number;
  productoId: number;
  tipo: TipoPrecio;
  usado: boolean;
}

type Producto = {
  id: number;
  nombre: string;
  descripcion: string;
  precioVenta: number;
  codigoProducto: string;
  creadoEn: string; // En formato ISO
  actualizadoEn: string; // En formato ISO
  stock: Stock[];
  precios: Precios[];
};

export type ProductosResponse = Producto;
export type ProductosCart = Producto;
export function normalizeProducto(producto: Producto): Producto {
  return {
    ...producto,
    precios: [...(producto.precios ?? [])].sort((a, b) => a.orden - b.orden),
  };
}
