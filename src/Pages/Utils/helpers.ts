export const sortPrecios = (precios: { id: number; precio: number }[]) =>
  [...precios] // copia para no mutar props
    .filter((p) => p.precio > 0) // opcional
    .sort((a, b) => a.precio - b.precio); // o por fechaCreacion / indice
