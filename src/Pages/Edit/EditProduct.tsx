import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import SelectM from "react-select";
import { toast } from "sonner";

import { useStore } from "@/components/Context/ContextSucursal";

import {
  useGetProduct,
  useGetCategories,
} from "@/hooks/useHooks/useProductQueries";
import { useUpdateProduct } from "@/hooks/useHooks/useProductMutations";
import {
  Category,
  ProductPrice,
  ProductToEdit,
  UpdateProductDto,
} from "./productToEdit.interface";

type PriceForm = ProductPrice; // alias mental

export default function ProductEditForm() {
  const { id } = useParams();
  const productId = Number(id);
  const usuarioId = useStore((state) => state.userId) ?? 0;

  const { data: product, isLoading: isLoadingProduct } = useGetProduct(
    Number.isNaN(productId) ? undefined : productId
  );
  const { data: categories = [], isLoading: isLoadingCategories } =
    useGetCategories();

  const { mutateAsync: updateProduct, isPending: isUpdating } =
    useUpdateProduct(productId);

  const [formData, setFormData] = useState<ProductToEdit | null>(null);

  // Inicializar formData cuando llega el producto
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        precios: product.precios.map((p) => ({
          id: p.id,
          precio: p.precio,
          orden: p.orden ?? 1,
        })),
      });
    }
  }, [product]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  // Actualizar precio
  const handlePriceValueChange =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const value = raw === "" ? "" : Number(raw);

      setFormData((prev) => {
        if (!prev) return prev;
        const updated = [...prev.precios];
        const current = updated[index];

        if (!current) return prev;

        updated[index] = {
          ...current,
          precio: typeof value === "number" && !Number.isNaN(value) ? value : 0,
        };

        return { ...prev, precios: updated };
      });
    };

  // Actualizar orden
  const handlePriceOrderChange =
    (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = Number(e.target.value);
      setFormData((prev) => {
        if (!prev) return prev;
        const updated = [...prev.precios];
        const current = updated[index];
        if (!current) return prev;

        updated[index] = {
          ...current,
          orden: Number.isNaN(value) ? current.orden : value,
        };

        return { ...prev, precios: updated };
      });
    };

  // Marcar/eliminar un precio
  const handleDeletePrice = (index: number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const updated = [...prev.precios];
      const price = updated[index];
      if (!price) return prev;

      if (price.id) {
        // existe en la BD → marcar para eliminar
        updated[index] = {
          ...price,
          eliminar: true,
        };
      } else {
        // nuevo aún no en BD → lo quitamos de la lista
        updated.splice(index, 1);
      }

      return { ...prev, precios: updated };
    });
  };

  // Añadir un nuevo precio
  const handleAddPrice = () => {
    setFormData((prev) => {
      if (!prev) return prev;
      const nextOrden =
        prev.precios.length > 0
          ? Math.max(...prev.precios.map((p) => p.orden ?? 0)) + 1
          : 1;

      const nuevoPrecio: PriceForm = {
        id: 0,
        precio: 0,
        orden: nextOrden,
      };

      return {
        ...prev,
        precios: [...prev.precios, nuevoPrecio],
      };
    });
  };

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (!formData.nombre || !formData.nombre.trim()) {
      toast.error("El nombre del producto es obligatorio.");
      return;
    }

    if (!formData.codigoProducto || !formData.codigoProducto.trim()) {
      toast.error("El código del producto es obligatorio.");
      return;
    }

    const costo = Number(formData.precioCostoActual);
    if (Number.isNaN(costo) || costo < 0) {
      toast.error("El precio de costo debe ser un número mayor o igual a 0.");
      return;
    }

    if (!formData.categorias || formData.categorias.length === 0) {
      toast.error("Debes seleccionar al menos una categoría.");
      return;
    }

    const preciosActivos = formData.precios.filter((p) => !p.eliminar);

    if (preciosActivos.length === 0) {
      toast.error("Debes definir al menos un precio para el producto.");
      return;
    }

    const invalidPrice = preciosActivos.find((p) => {
      const valor = Number(p.precio);
      return Number.isNaN(valor) || valor <= 0;
    });

    if (invalidPrice) {
      toast.error("Todos los precios deben ser números mayores a 0.");
      return;
    }

    const invalidOrder = preciosActivos.find((p) => {
      const orden = Number(p.orden);
      return Number.isNaN(orden) || orden < 1 || !Number.isInteger(orden);
    });

    if (invalidOrder) {
      toast.error(
        "Todos los órdenes de los precios deben ser números enteros mayores o iguales a 1."
      );
      return;
    }

    const ordenes = preciosActivos.map((p) => Number(p.orden));
    const hasDuplicateOrders = new Set(ordenes).size !== ordenes.length;

    if (hasDuplicateOrders) {
      toast.error("Los órdenes de los precios no pueden repetirse.");
      return;
    }

    // ---------- Construir payload limpio ----------
    const payload: UpdateProductDto = {
      codigoProducto: formData.codigoProducto.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion?.trim(),
      precioCostoActual: costo,
      categorias: formData.categorias.map((c) => c.id),
      usuarioId,
      precios: formData.precios.map((p) => ({
        id: p.id || undefined,
        precio: Number(p.precio),
        orden: Number(p.orden ?? 1),
        eliminar: p.eliminar ?? false,
      })),
    };

    // ---------- Llamada con toast.promise ----------
    await toast.promise(updateProduct(payload), {
      loading: "Actualizando producto...",
      success: "Producto actualizado exitosamente.",
      error: "Error al actualizar el producto.",
    });
  };

  if (isLoadingProduct || !formData) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">Cargando producto...</p>
      </div>
    );
  }

  // Precios visibles (no eliminados)
  const visiblePrices = formData.precios.filter((p) => !p.eliminar);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-lg bg-card p-6 shadow-xl"
    >
      <h2 className="text-center text-xl font-bold">Edición de Producto</h2>

      {/* Nombre */}
      <div className="space-y-1">
        <Label htmlFor="nombre">Nombre del Producto</Label>
        <Input
          id="nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Descripción */}
      <div className="space-y-1">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleInputChange}
          rows={3}
        />
      </div>

      {/* Precio Costo */}
      <div className="space-y-1">
        <Label htmlFor="precioCostoActual">Precio Costo</Label>
        <Input
          type="number"
          id="precioCostoActual"
          name="precioCostoActual"
          value={formData.precioCostoActual}
          onChange={handleInputChange}
        />
      </div>

      {/* Precios dinámicos */}
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Precios del producto</Label>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={handleAddPrice}
          >
            Añadir precio
          </Button>
        </div>

        {visiblePrices.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No hay precios definidos. Agrega al menos uno.
          </p>
        )}

        <div className="space-y-2">
          {visiblePrices.map((precio, visibleIndex) => {
            // Necesitamos el índice real en el array original
            const realIndex = formData.precios.findIndex((p) => p === precio);

            return (
              <div
                key={precio.id ?? `new-${visibleIndex}`}
                className="flex flex-col gap-2 rounded-md bg-muted p-2 sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Label className="text-xs">Precio</Label>
                    <Input
                      type="number"
                      value={precio.precio}
                      onChange={handlePriceValueChange(realIndex)}
                      step="0.01"
                      min="0"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <Label className="text-xs">Orden</Label>
                    <Input
                      type="number"
                      value={precio.orden}
                      onChange={handlePriceOrderChange(realIndex)}
                      min={1}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeletePrice(realIndex)}
                    className="h-8"
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Código de producto */}
      <div className="space-y-1">
        <Label htmlFor="codigoProducto">Código del Producto</Label>
        <Input
          id="codigoProducto"
          name="codigoProducto"
          value={formData.codigoProducto}
          onChange={handleInputChange}
          required
        />
      </div>

      {/* Categorías */}
      <div className="space-y-1">
        <Label>Categorías</Label>
        <SelectM
          placeholder={
            isLoadingCategories ? "Cargando categorías..." : "Seleccionar..."
          }
          isMulti
          name="categorias"
          isDisabled={isLoadingCategories}
          options={categories.map((categoria: Category) => ({
            value: categoria.id,
            label: categoria.nombre,
          }))}
          className="basic-multi-select text-black"
          classNamePrefix="select"
          onChange={(selectedOptions) => {
            setFormData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                categorias: selectedOptions.map((option) => ({
                  id: option.value,
                  nombre: option.label,
                })),
              };
            });
          }}
          value={formData.categorias.map((cat) => ({
            value: cat.id,
            label:
              categories.find((c) => c.id === cat.id)?.nombre || cat.nombre,
          }))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isUpdating}>
        {isUpdating ? "Actualizando..." : "Actualizar Producto"}
      </Button>
    </form>
  );
}
