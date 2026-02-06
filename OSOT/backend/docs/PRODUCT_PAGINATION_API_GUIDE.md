# Product Pagination API Guide

**Last Updated**: December 11, 2025  
**Version**: 1.0  
**Target Audience**: Frontend Developers

---

## Overview

The Product API now supports **e-commerce style pagination** with **Redis caching** for optimal performance. This guide covers how to consume the paginated endpoints and handle the new response format.

---

## Key Features

✅ **Pagination**: 12 items per page by default (configurable)  
✅ **Metadata**: Complete pagination info (totalPages, hasNextPage, etc.)  
✅ **Performance**: Redis cache (5-minute TTL) reduces Dataverse queries by 60x  
✅ **Auto-invalidation**: Cache clears automatically on product updates

---

## Endpoints

### 1. List Products (Admin) - Paginated

**Endpoint**: `GET /private/products`  
**Authentication**: Required (JWT)  
**Permission**: Admin only

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `take` | number | 12 | Items per page (limit) |
| `skip` | number | 0 | Items to skip (offset) |
| `productStatus` | enum | - | Filter by status (0=DRAFT, 1=AVAILABLE, 2=DISCONTINUED) |
| `productCategory` | enum | - | Filter by category |
| `orderBy` | string | - | Sort order (e.g., "osot_product_code asc") |

#### Request Example

```typescript
// Page 1 (items 0-11)
GET /private/products?take=12&skip=0

// Page 2 (items 12-23)
GET /private/products?take=12&skip=12

// Page 3 (items 24-35)
GET /private/products?take=12&skip=24

// Filter by status
GET /private/products?productStatus=1&take=12&skip=0

// Custom page size
GET /private/products?take=20&skip=0
```

#### Response Format

```typescript
interface ProductResponse {
  data: ProductWithPrice[];
  meta: {
    currentPage: number;        // Current page number (1-based)
    itemsPerPage: number;       // Items per page (limit)
    totalItems: number;         // Total products in catalog
    totalPages: number;         // Total pages available
    hasNextPage: boolean;       // True if more pages exist
    hasPreviousPage: boolean;   // True if previous pages exist
    skip: number;               // Items skipped (offset)
    take: number;               // Items returned (limit)
  };
}
```

#### Response Example

```json
{
  "data": [
    {
      "productId": "c2a63050-09d6-f011-8544-002248b106dc",
      "productCode": "OT_PR_MMEMBERSHIP_2026_FULL",
      "productDescription": "OT Practicing - Membership 2026 - full period",
      "productStatus": 1,
      "productCategory": 0,
      "generalPrice": 349.00,
      "otActivePrice": 349.00,
      "otaActivePrice": null,
      "displayPrice": 349.00,
      "priceField": "osot_general_price",
      "isGeneralPrice": true,
      "canPurchase": true
    }
    // ... 11 more products
  ],
  "meta": {
    "currentPage": 1,
    "itemsPerPage": 12,
    "totalItems": 45,
    "totalPages": 4,
    "hasNextPage": true,
    "hasPreviousPage": false,
    "skip": 0,
    "take": 12
  }
}
```

---

## Frontend Implementation Examples

### React/Next.js Example

```typescript
import { useState, useEffect } from 'react';

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface ProductWithPrice {
  productId: string;
  productCode: string;
  productDescription: string;
  displayPrice: number | null;
  canPurchase: boolean;
  // ... other fields
}

function ProductCatalog() {
  const [products, setProducts] = useState<ProductWithPrice[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 12;

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const skip = (page - 1) * itemsPerPage;
      const response = await fetch(
        `/private/products?take=${itemsPerPage}&skip=${skip}`,
        {
          headers: {
            Authorization: `Bearer ${yourJwtToken}`,
          },
        }
      );
      
      const data = await response.json();
      setProducts(data.data);
      setMeta(data.meta);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  return (
    <div>
      {/* Product Grid */}
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>

      {/* Pagination Controls */}
      {meta && (
        <div className="pagination">
          <button
            disabled={!meta.hasPreviousPage || loading}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>

          <span>
            Page {meta.currentPage} of {meta.totalPages}
          </span>

          <button
            disabled={!meta.hasNextPage || loading}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>

          <div className="info">
            Showing {products.length} of {meta.totalItems} products
          </div>
        </div>
      )}
    </div>
  );
}
```

### Vue.js Example

```typescript
<template>
  <div>
    <!-- Product Grid -->
    <div class="product-grid">
      <ProductCard
        v-for="product in products"
        :key="product.productId"
        :product="product"
      />
    </div>

    <!-- Pagination -->
    <div v-if="meta" class="pagination">
      <button
        :disabled="!meta.hasPreviousPage || loading"
        @click="previousPage"
      >
        Previous
      </button>

      <span>Page {{ meta.currentPage }} of {{ meta.totalPages }}</span>

      <button
        :disabled="!meta.hasNextPage || loading"
        @click="nextPage"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const products = ref([]);
const meta = ref(null);
const currentPage = ref(1);
const loading = ref(false);
const itemsPerPage = 12;

const fetchProducts = async (page: number) => {
  loading.value = true;
  try {
    const skip = (page - 1) * itemsPerPage;
    const response = await fetch(
      `/private/products?take=${itemsPerPage}&skip=${skip}`,
      {
        headers: {
          Authorization: `Bearer ${yourJwtToken}`,
        },
      }
    );
    
    const data = await response.json();
    products.value = data.data;
    meta.value = data.meta;
  } catch (error) {
    console.error('Failed to fetch products:', error);
  } finally {
    loading.value = false;
  }
};

const nextPage = () => {
  if (meta.value?.hasNextPage) {
    currentPage.value++;
    fetchProducts(currentPage.value);
  }
};

const previousPage = () => {
  if (meta.value?.hasPreviousPage) {
    currentPage.value--;
    fetchProducts(currentPage.value);
  }
};

onMounted(() => {
  fetchProducts(currentPage.value);
});
</script>
```

### Angular Example

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

@Component({
  selector: 'app-product-catalog',
  template: `
    <div class="product-grid">
      <app-product-card
        *ngFor="let product of products"
        [product]="product"
      ></app-product-card>
    </div>

    <div *ngIf="meta" class="pagination">
      <button
        [disabled]="!meta.hasPreviousPage || loading"
        (click)="previousPage()"
      >
        Previous
      </button>

      <span>Page {{ meta.currentPage }} of {{ meta.totalPages }}</span>

      <button
        [disabled]="!meta.hasNextPage || loading"
        (click)="nextPage()"
      >
        Next
      </button>
    </div>
  `,
})
export class ProductCatalogComponent implements OnInit {
  products: any[] = [];
  meta: PaginationMeta | null = null;
  currentPage = 1;
  loading = false;
  itemsPerPage = 12;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchProducts(this.currentPage);
  }

  fetchProducts(page: number) {
    this.loading = true;
    const skip = (page - 1) * this.itemsPerPage;
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getToken()}`,
    });

    this.http
      .get(`/private/products?take=${this.itemsPerPage}&skip=${skip}`, {
        headers,
      })
      .subscribe({
        next: (data: any) => {
          this.products = data.data;
          this.meta = data.meta;
          this.currentPage = page;
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to fetch products:', error);
          this.loading = false;
        },
      });
  }

  nextPage() {
    if (this.meta?.hasNextPage) {
      this.fetchProducts(this.currentPage + 1);
    }
  }

  previousPage() {
    if (this.meta?.hasPreviousPage) {
      this.fetchProducts(this.currentPage - 1);
    }
  }

  getToken(): string {
    // Return your JWT token
    return localStorage.getItem('jwt_token') || '';
  }
}
```

---

## Best Practices

### 1. Cache Awareness

**Cache Duration**: 5 minutes  
**Behavior**: First request queries Dataverse, subsequent requests hit cache

```typescript
// User A requests products → Cache MISS → Query Dataverse → Cache for 5 min
// User B requests products (within 5 min) → Cache HIT → Instant response
// After 5 minutes → Cache expires → Next request queries Dataverse again
```

**Implications**:
- ✅ Super fast response times (5ms vs 300ms)
- ⚠️ Product changes may take up to 5 minutes to appear
- ✅ Updates via API invalidate cache immediately

### 2. Pagination Strategy

**Recommended approach**:
```typescript
// ✅ Good: Use skip/take for pagination
GET /private/products?take=12&skip=0   // Page 1
GET /private/products?take=12&skip=12  // Page 2
GET /private/products?take=12&skip=24  // Page 3

// ❌ Avoid: Large skip values (performance)
GET /private/products?take=12&skip=10000 // Slow
```

### 3. Loading States

Always show loading indicators during fetch:

```typescript
const [loading, setLoading] = useState(false);

// Show spinner while loading
{loading && <Spinner />}

// Disable buttons while loading
<button disabled={loading || !meta.hasNextPage}>Next</button>
```

### 4. Error Handling

```typescript
try {
  const response = await fetch('/private/products');
  
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      router.push('/login');
    } else if (response.status === 403) {
      // Forbidden - user lacks permission
      showError('Admin access required');
    } else {
      // Other errors
      showError('Failed to load products');
    }
    return;
  }
  
  const data = await response.json();
  // Handle data
} catch (error) {
  // Network error
  showError('Network error. Please try again.');
}
```

### 5. Optimistic Updates

When admin updates a product, update local state immediately:

```typescript
const updateProduct = async (productId: string, updates: any) => {
  // Optimistic update
  setProducts(products.map(p => 
    p.productId === productId ? { ...p, ...updates } : p
  ));
  
  try {
    await fetch(`/private/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    // Success - cache invalidated automatically
  } catch (error) {
    // Revert on error
    fetchProducts(currentPage);
  }
};
```

---

## Migration from Old API

### Before (Non-Paginated)

```typescript
// Old response format
{
  data: ProductWithPrice[]  // All products at once
}
```

### After (Paginated)

```typescript
// New response format
{
  data: ProductWithPrice[],  // Current page only
  meta: {
    currentPage: number,
    totalPages: number,
    hasNextPage: boolean,
    // ... more metadata
  }
}
```

### Migration Checklist

- [ ] Update API call to include `take` and `skip` parameters
- [ ] Handle new `meta` object in response
- [ ] Implement pagination UI (Previous/Next buttons)
- [ ] Add loading states
- [ ] Test with different page sizes
- [ ] Handle edge cases (empty results, last page, etc.)

---

## Performance Metrics

### Without Cache
- **First request**: ~300ms (Dataverse query)
- **Subsequent requests**: ~300ms each (no caching)
- **Queries per hour**: ~720 (assuming 1 request/5 seconds)

### With Cache (Current Implementation)
- **First request**: ~300ms (Dataverse query + cache)
- **Subsequent requests**: ~5ms (Redis cache hit)
- **Queries per hour**: ~12 (cache expires every 5 minutes)
- **Performance improvement**: **60x fewer queries**, **60x faster response**

---

## Common Issues

### 1. Empty Product List

```json
{
  "data": [],
  "meta": {
    "totalItems": 0,
    "currentPage": 1,
    "totalPages": 0
  }
}
```

**Causes**:
- No products in database
- Filter excludes all products
- Products were deleted

**Solution**: Check filters and product status

### 2. Stale Data After Update

**Symptom**: Product update not reflected immediately

**Causes**:
- Product updated via Dataverse (outside API)
- Cache not invalidated

**Solution**: 
- Updates via API invalidate cache automatically
- For external updates, wait 5 minutes or contact admin to clear cache

### 3. Page Number Mismatch

**Issue**: Using `page` parameter instead of `skip`

```typescript
// ❌ Wrong
GET /private/products?page=2

// ✅ Correct
GET /private/products?take=12&skip=12
```

---

## Support

For questions or issues:
- **Backend Team**: [Contact Info]
- **Documentation**: `/docs` folder
- **Swagger UI**: `http://localhost:3000/api-docs`

---

**Document Status**: ✅ Production Ready  
**Breaking Changes**: Yes (pagination added to response)  
**Migration Required**: Yes (update frontend pagination logic)
