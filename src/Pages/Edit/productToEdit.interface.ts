export type Category = {
  id: number;
  nombre: string;
};

export type ProductPrice = {
  id: number; // puede ser 0 / undefined en nuevos
  precio: number;
  orden: number;
  eliminar?: boolean;
};

export type ProductToEdit = {
  id: number;
  nombre: string;
  descripcion: string;
  codigoProducto: string;
  creadoEn: string;
  actualizadoEn: string;
  precioCostoActual: number;
  categorias: Category[];
  precios: ProductPrice[];
};

export interface UpdateProductPriceDto {
  id?: number;
  precio: number;
  orden: number;
  eliminar?: boolean;
}

export interface UpdateProductDto {
  codigoProducto: string;
  nombre: string;
  descripcion?: string;
  precioCostoActual: number | string;
  categorias: number[];
  usuarioId: number;
  precios: UpdateProductPriceDto[];
}
