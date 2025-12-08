import { ProductQkeys } from "@/Pages/Edit/productQkeys";
import {
  ProductToEdit,
  UpdateProductDto,
} from "@/Pages/Edit/productToEdit.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export function useUpdateProduct(productId: number) {
  const queryClient = useQueryClient();

  return useMutation<ProductToEdit, unknown, UpdateProductDto>({
    mutationFn: async (payload) => {
      const response = await axios.patch(
        `${API_URL}/products/actualizar/producto/${productId}`,
        payload
      );
      return response.data as ProductToEdit;
    },
    retry: 1,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ProductQkeys.one(productId),
      });
      queryClient.invalidateQueries({
        queryKey: ProductQkeys.list,
      });
    },
  });
}
