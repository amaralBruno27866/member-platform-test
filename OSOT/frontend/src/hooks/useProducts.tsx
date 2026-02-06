/**
 * useProducts Hook
 * React Query hooks for product management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import type {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryParams,
} from '@/types/product';
import { useDelayedInvalidation } from './useDelayedInvalidation';

/**
 * Query key for products list
 */
const PRODUCTS_QUERY_KEY = 'products';

/**
 * Hook to fetch all products (Admin only)
 */
export function useProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, params],
    queryFn: () => productService.listProducts(params),
  });
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });
}

/**
 * Hook to create a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => productService.createProduct(data),
    onSuccess: () => {
      // Invalidate products list to trigger refetch (with any parameters)
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY], exact: false });
    },
  });
}

/**
 * Hook to update a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productService.updateProduct(id, data),
    onSuccess: async (_, variables) => {
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([
        [PRODUCTS_QUERY_KEY],
        [PRODUCTS_QUERY_KEY, variables.id]
      ]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: [PRODUCTS_QUERY_KEY], exact: false });
    },
  });
}

/**
 * Hook to soft delete a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: async () => {
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([[PRODUCTS_QUERY_KEY]]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: [PRODUCTS_QUERY_KEY], exact: false });
    },
  });
}

/**
 * Hook to permanently delete a product
 */
export function usePermanentDeleteProduct() {
  const queryClient = useQueryClient();
  const delayedInvalidation = useDelayedInvalidation();

  return useMutation({
    mutationFn: (id: string) => productService.permanentDeleteProduct(id),
    onSuccess: async () => {
      // Backend invalidates cache in 2-3 seconds
      await delayedInvalidation([[PRODUCTS_QUERY_KEY]]);
      // Force immediate refetch after invalidation
      await queryClient.refetchQueries({ queryKey: [PRODUCTS_QUERY_KEY], exact: false });
    },
  });
}

/**
 * Hook to fetch public products (no authentication required)
 */
export function usePublicProducts(params?: ProductQueryParams) {
  return useQuery({
    queryKey: ['public-products', params],
    queryFn: () => productService.getPublicProducts(params),
  });
}

/**
 * Hook to fetch a single public product by ID
 */
export function usePublicProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['public-products', id],
    queryFn: () => productService.getPublicProductById(id!),
    enabled: !!id,
  });
}
