/**
 * Product Service
 * Handles all product-related API calls
 */

import { api } from '@/lib/api';
import type {
  ProductResponse,
  CreateProductDto,
  UpdateProductDto,
  ProductApiResponse,
  ProductListApiResponse,
  ProductQueryParams,
} from '@/types/product';

export const productService = {
  /**
   * List all products (Admin only - includes all statuses)
   * GET /private/products
   */
  listProducts: async (params?: ProductQueryParams): Promise<ProductResponse[]> => {
    const response = await api.get<ProductListApiResponse>('/private/products', {
      params,
    });
    console.log('[ProductService] Products received from backend:', response.data.data);
    return response.data.data;
  },

  /**
   * Get product by ID (Admin only)
   * GET /private/products/:id
   */
  getProductById: async (id: string): Promise<ProductResponse> => {
    const response = await api.get<ProductApiResponse>(`/private/products/${id}`);
    return response.data.data;
  },

  /**
   * Create new product (Admin only)
   * POST /private/products
   */
  createProduct: async (data: CreateProductDto): Promise<ProductResponse> => {
    const response = await api.post<ProductApiResponse>('/private/products', data);
    return response.data.data;
  },

  /**
   * Update product (Admin only)
   * PATCH /private/products/:id
   */
  updateProduct: async (
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductResponse> => {
    const response = await api.patch<ProductApiResponse>(
      `/private/products/${id}`,
      data,
    );
    return response.data.data;
  },

  /**
   * Soft delete product (Admin only)
   * Sets status to DISCONTINUED
   * DELETE /private/products/:id
   */
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/private/products/${id}`);
  },

  /**
   * Hard delete product (Owner only)
   * Permanent deletion
   * DELETE /private/products/:id/permanent
   */
  permanentDeleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/private/products/${id}/permanent`);
  },

  /**
   * Get public products (No authentication required)
   * GET /public/products
   */
  getPublicProducts: async (
    params?: ProductQueryParams,
  ): Promise<ProductResponse[]> => {
    const response = await api.get<ProductListApiResponse>('/public/products', {
      params,
    });
    return response.data.data;
  },

  /**
   * Get public product by ID
   * GET /public/products/:id
   */
  getPublicProductById: async (id: string): Promise<ProductResponse> => {
    const response = await api.get<ProductApiResponse>(`/public/products/${id}`);
    return response.data.data;
  },
};
