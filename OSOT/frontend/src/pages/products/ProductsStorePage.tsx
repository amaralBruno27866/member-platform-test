/**
 * Products Store Page (Owner Privilege)
 * E-commerce style product browsing with filters and search
 * Display only - no checkout functionality yet
 */

import { useState, useMemo, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useMembershipExpiration } from '@/hooks/useMembershipExpiration';
import { useMembershipPreferences } from '@/hooks/useMembershipPreferences';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Loader2,
  AlertCircle,
  DollarSign,
  ShoppingCart,
  Filter,
  X,
  Package,
  ArrowUpDown,
  ChevronDown,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getDirectImageUrl } from '@/lib/imageUtils';
import type { ProductResponse } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { toast } from 'sonner';

// Product Categories for filtering - MUST match backend ProductCategory enum
// Source: backend/src/classes/others/product/enums/product-category.enum.ts
const PRODUCT_CATEGORIES = [
  { value: 0, label: 'Membership' },
  { value: 1, label: 'Insurance' },
  { value: 2, label: 'Promotional' },
  { value: 3, label: 'Advertising' },
  { value: 4, label: 'Event' },
  { value: 5, label: 'Conference' },
  { value: 6, label: 'Archived Webinar' },
  { value: 7, label: 'Careers' },
  { value: 8, label: "Member's Benefits" },
  { value: 9, label: 'Donations' },
  { value: 10, label: 'General' },
];

export default function ProductsStorePage() {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 20;

  const { data: products, isLoading, error } = useProducts({ take: 100 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  // Store page always shows only active/available products
  const showActiveOnly = true;
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'newest' | 'oldest'>('newest');
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const { data: membershipExpiration } = useMembershipExpiration();
  const { data: membershipPreferences } = useMembershipPreferences();

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const canShowMembership = () => {
      // If no expiration data, user is inactive -> show membership products
      if (!membershipExpiration) return true;
      
      const status = membershipExpiration.status?.toLowerCase();
      const days = membershipExpiration.daysRemaining;
      
      // Inactive status (shouldn't happen if API returns data, but handle it)
      const isInactive = status === 'inactive';
      
      // Renewal window: active member with < 30 days remaining
      const inRenewalWindow = (status === 'active' || status === 'renewal-required') && typeof days === 'number' && days < 30;
      
      return isInactive || inRenewalWindow;
    };

    const filtered = products.filter((product) => {
      // Search filter
      const matchesSearch =
        searchQuery === '' ||
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.productCode.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === 'all' ||
        product.productCategory === PRODUCT_CATEGORIES.find((c) => c.value.toString() === selectedCategory)?.label;

      // Membership visibility rule
      const isMembershipProduct = product.productCategory?.toLowerCase() === 'membership';
      const membershipAllowed = isMembershipProduct && canShowMembership();
      if (isMembershipProduct && !membershipAllowed) {
        return false;
      }

      // Price filter
      let matchesPrice = true;
      if (priceRange !== 'all') {
        const displayPrice = getDisplayPrice(product);
        if (displayPrice) {
          switch (priceRange) {
            case 'under50':
              matchesPrice = displayPrice < 50;
              break;
            case '50to100':
              matchesPrice = displayPrice >= 50 && displayPrice < 100;
              break;
            case '100to200':
              matchesPrice = displayPrice >= 100 && displayPrice < 200;
              break;
            case 'over200':
              matchesPrice = displayPrice >= 200;
              break;
          }
        }
      }

      // Active filter (based on dates and status)
      // All products (including membership) must respect isActive (date validation)
      const matchesActive = product.productStatus === 'Available' && (product.isActive !== false);

      return matchesSearch && matchesCategory && matchesPrice && matchesActive;
    });

    // Sort products
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.productName.localeCompare(b.productName);
        case 'name-desc':
          return b.productName.localeCompare(a.productName);
        case 'price-asc':
          return (getDisplayPrice(a) || 0) - (getDisplayPrice(b) || 0);
        case 'price-desc':
          return (getDisplayPrice(b) || 0) - (getDisplayPrice(a) || 0);
        case 'newest':
          return (b.productId || '').localeCompare(a.productId || '');
        case 'oldest':
          return (a.productId || '').localeCompare(b.productId || '');
        default:
          return 0;
      }
    });
  }, [products, searchQuery, selectedCategory, priceRange, sortBy, membershipExpiration]);

  // Pagination calculations
  const totalProducts = filteredProducts?.length || 0;
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const endIndex = startIndex + PRODUCTS_PER_PAGE;
  
  // Get paginated products
  const paginatedProducts = useMemo(() => {
    return filteredProducts?.slice(startIndex, endIndex) || [];
  }, [filteredProducts, startIndex, endIndex]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, priceRange, showActiveOnly, sortBy]);

  const handleViewProduct = (product: ProductResponse) => {
    setSelectedProduct(product);
    setShowProductDialog(true);
  };

  const handleAddToCart = (product: ProductResponse) => {
    // TODO: Implement add to cart functionality
    // This will integrate with your cart management system
    console.log('Add to cart:', product);
    toast.success(`${product.productName} added to cart!`);
  };

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  // Get display price (applicable price, then general, then highest available)
  const getDisplayPrice = (product: ProductResponse): number | undefined => {
    const prices = product.prices || {};

    // Prefer applicablePrice if it is defined (including 0)
    if (product.applicablePrice !== null && product.applicablePrice !== undefined) {
      return product.applicablePrice;
    }

    // Otherwise use general price if present (including 0)
    if (typeof prices.general === 'number') {
      return prices.general;
    }

    // Fallback: highest defined category price (including 0)
    const allPrices: number[] = Object.values(prices).filter((value): value is number => typeof value === 'number');
    if (allPrices.length > 0) {
      return Math.max(...allPrices);
    }

    return undefined;
  };

  // Compute total price (base + tax + shipping)
  const getTotalPrice = (product: ProductResponse): number | undefined => {
    const basePrice = getDisplayPrice(product);
    if (basePrice === undefined) return undefined;

    const taxes = typeof product.taxes === 'number' ? product.taxes : 0;
    const shipping = typeof product.shipping === 'number' ? product.shipping : 0;

    const taxAmount = basePrice * (taxes / 100);
    return basePrice + taxAmount + shipping;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange('all');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'all' || priceRange !== 'all' || sortBy !== 'newest';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <CardTitle>Error Loading Products</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Products Store</h1>
        <p className="text-muted-foreground">
          Browse our products and services
        </p>
      </div>

      {/* Filters Section */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-9"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium whitespace-nowrap">
                Page {currentPage}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-9"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Desktop: Search and Filters in same row, Mobile: Stacked */}
              {/* Search - Takes available space on desktop */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filter Buttons - Compact on desktop, wraps on mobile */}
              <div className="flex flex-wrap gap-2 md:items-end">
                {/* Category Dropdown Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Layers className="h-4 w-4" />
                      <span className="hidden sm:inline">Category:</span>
                      <span className="font-semibold">
                        {selectedCategory === 'all'
                          ? 'All'
                          : PRODUCT_CATEGORIES.find((c) => c.value.toString() === selectedCategory)?.label || 'All'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Select Category</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                      All Categories
                    </DropdownMenuItem>
                    {PRODUCT_CATEGORIES.map((category) => (
                      <DropdownMenuItem
                        key={category.value}
                        onClick={() => setSelectedCategory(category.value.toString())}
                      >
                        {category.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Price Range Dropdown Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">Price:</span>
                      <span className="font-semibold">
                        {priceRange === 'all' && 'All'}
                        {priceRange === 'under50' && '<$50'}
                        {priceRange === '50to100' && '$50-100'}
                        {priceRange === '100to200' && '$100-200'}
                        {priceRange === 'over200' && '>$200'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Select Price Range</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setPriceRange('all')}>
                      All Prices
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriceRange('under50')}>
                      Under $50
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriceRange('50to100')}>
                      $50 - $100
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriceRange('100to200')}>
                      $100 - $200
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setPriceRange('over200')}>
                      Over $200
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort By Dropdown Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Sort:</span>
                      <span className="font-semibold">
                        {sortBy === 'newest' && 'Newest'}
                        {sortBy === 'oldest' && 'Oldest'}
                        {sortBy === 'name-asc' && 'A-Z'}
                        {sortBy === 'name-desc' && 'Z-A'}
                        {sortBy === 'price-asc' && 'Price ↑'}
                        {sortBy === 'price-desc' && 'Price ↓'}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('newest')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                      Oldest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name-asc')}>
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('name-desc')}>
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price-asc')}>
                      Price (Low-High)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('price-desc')}>
                      Price (High-Low)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
        </p>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50" />
            <div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more products.'
                  : 'No products are currently available.'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => {
              const isMembershipProduct = product.productCategory?.toLowerCase() === 'membership';
              
              // Determine CTA label for membership products
              let membershipCtaLabel = 'Add to Cart';
              if (isMembershipProduct) {
                // If no preferences record exists, user never had membership -> Apply
                // If preferences exists, user can renew
                membershipCtaLabel = membershipPreferences === null 
                  ? 'Apply for a membership' 
                  : 'Renew membership';
              }

              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => handleViewProduct(product)}
                  onAddToCart={handleAddToCart}
                  addToCartLabel={membershipCtaLabel}
                  isAdmin={false}
                />
              );
            })}
          </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalProducts)} of {totalProducts} products
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </>
      )}

      {/* Product Details Dialog */}
      {selectedProduct && (
        <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedProduct.productName}</DialogTitle>
              <DialogDescription>{selectedProduct.productCode}</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Product Image */}
              {selectedProduct.productPicture && (
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <img
                    src={getDirectImageUrl(selectedProduct.productPicture)}
                    alt={selectedProduct.productName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {selectedProduct.productDescription}
                </p>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="font-medium">{selectedProduct.productCategory}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">{selectedProduct.productStatus}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">GL Code</Label>
                  <p className="font-medium">{selectedProduct.productGlCode}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Inventory</Label>
                  <p className="font-medium">
                    {selectedProduct.inventory || 'Unlimited'}
                    {selectedProduct.lowStock && (
                      <Badge variant="secondary" className="ml-2 bg-brand-100 text-brand-700">
                        Low Stock
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-sm font-semibold">Pricing</h3>
                {(() => {
                  const displayPrice = getDisplayPrice(selectedProduct);
                  const totalPrice = getTotalPrice(selectedProduct) ?? (typeof selectedProduct.totalPrice === 'number' ? selectedProduct.totalPrice : undefined);
                  return displayPrice !== undefined ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-primary">
                          {formatPrice(displayPrice)}
                        </span>
                        {selectedProduct.isGeneralPrice && (
                          <Badge variant="secondary">General Price</Badge>
                        )}
                        {selectedProduct.membershipCategory !== undefined && !selectedProduct.isGeneralPrice && (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Member Price
                          </Badge>
                        )}
                      </div>
                      {selectedProduct.taxes > 0 && (
                        <p className="text-sm text-muted-foreground">
                          + {selectedProduct.taxes}% tax
                        </p>
                      )}
                      {selectedProduct.shipping && selectedProduct.shipping > 0 && (
                        <p className="text-sm text-muted-foreground">
                          + {formatPrice(selectedProduct.shipping)} shipping
                        </p>
                      )}
                      {totalPrice !== undefined && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Total Price</p>
                          <p className="text-xl font-semibold">{formatPrice(totalPrice)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Price not available for your membership category</p>
                  );
                })()}

                {selectedProduct.isExclusive && !selectedProduct.userHasAccess && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm text-purple-700">
                      This product is exclusive to specific membership categories.
                    </p>
                  </div>
                )}
              </div>

              {/* Availability Period */}
              {(selectedProduct.startDate || selectedProduct.endDate) && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold">Availability Period</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedProduct.startDate && (
                      <div>
                        <Label className="text-muted-foreground">Start Date</Label>
                        <p className="font-medium">{formatDate(selectedProduct.startDate)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Product available from this date
                        </p>
                      </div>
                    )}
                    {selectedProduct.endDate && (
                      <div>
                        <Label className="text-muted-foreground">End Date</Label>
                        <p className="font-medium">{formatDate(selectedProduct.endDate)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Product expires after this date
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedProduct.isActive !== undefined && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-medium px-3 py-1.5 rounded-full ${
                            selectedProduct.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {selectedProduct.isActive ? '✓ Currently Active' : '✗ Not Active'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {selectedProduct.isActive
                            ? 'Product is within availability period'
                            : 'Product is outside availability period'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedProduct.startDate && !selectedProduct.endDate && (
                <div className="space-y-3 border-t pt-4">
                  <h3 className="text-sm font-semibold">Availability Period</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 font-medium">
                      ∞ Always Available
                    </span>
                    <span className="text-muted-foreground">No time restrictions</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowProductDialog(false)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    !selectedProduct.userHasAccess ||
                    selectedProduct.applicablePrice === null ||
                    selectedProduct.isActive === false ||
                    !selectedProduct.inStock
                  }
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart (Coming Soon)
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
