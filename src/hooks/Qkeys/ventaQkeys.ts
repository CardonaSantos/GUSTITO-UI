// Ajusta la ruta si usas otra convención
export const VentaQkeys = {
  all: ["venta"] as const,

  productosBySucursal: (sucursalId: number) =>
    ["venta", "productos", sucursalId] as const,

  empaques: ["venta", "empaques"] as const,

  clientes: ["venta", "clientes"] as const,

  priceRequests: ["venta", "price-requests"] as const,

  // 🔹 Historial de ventas por sucursal
  sucursalSalesHistory: (sucursalId: number) =>
    ["venta", "historial", sucursalId] as const,
} as const;
