export const ProductQkeys = {
  all: ["productos"] as const,
  list: ["productos", "list"] as const,
  one: (id: number) => ["productos", "detail", id] as const,
  categories: ["productos", "categorias"] as const,
} as const;
