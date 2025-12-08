import { ProductQkeys } from "@/Pages/Edit/productQkeys";
import { useApiQuery } from "../hooks/useQueryHooks";
import { Category, ProductToEdit } from "@/Pages/Edit/productToEdit.interface";

export function useGetProduct(productId?: number | null) {
  return useApiQuery<ProductToEdit>(
    ProductQkeys.one(productId ?? 0),
    productId ? `products/product/get-one-product/${productId}` : "",
    undefined,
    {
      enabled: !!productId,
      staleTime: 0,
      gcTime: 1000 * 60,
      refetchOnWindowFocus: "always",
      refetchOnMount: "always",
      refetchOnReconnect: "always",
      retry: 1,
    }
  );
}

export function useGetCategories() {
  return useApiQuery<Category[]>(
    ProductQkeys.categories,
    "categoria",
    undefined,
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
    }
  );
}
