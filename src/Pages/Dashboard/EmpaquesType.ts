interface SucursalLite {
  id: number;
  nombre: string;
}

interface StockEmpaque {
  id: number;
  cantidad: number;
  fechaIngreso: string; // o Date si ya lo parseas
  sucursal: SucursalLite;
}

export interface EmpaqueConStock {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  stock: StockEmpaque[];
}
