/**
 * ProductCard - Reusable Card Component
 * Displays product in a Magic the Gathering-style card format (portrait mode)
 * Works for both admin and user-facing interfaces
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit, Trash2, Eye, FileText, ShoppingCart } from 'lucide-react';
import type { ProductResponse } from '@/types/product';
import { getDirectImageUrl } from '@/lib/imageUtils';
import { getDisplayPrice, isVisibleInStore, countAdditionalPrices } from '@/utils/productUtils';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: ProductResponse;
  onClick?: (product: ProductResponse) => void;
  onEdit?: (product: ProductResponse) => void;
  onDelete?: (product: ProductResponse) => void;
  onGeneratePDF?: (product: ProductResponse) => void;
  onAddToCart?: (product: ProductResponse) => void;
  addToCartLabel?: string;
  isAdmin?: boolean; // Show admin action buttons
  className?: string;
}

export function ProductCard({
  product,
  onClick,
  onEdit,
  onDelete,
  onGeneratePDF,
  onAddToCart,
  addToCartLabel,
  isAdmin = false,
  className,
}: ProductCardProps) {
  return (
    <Card
      className={cn(
        'overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group flex flex-col h-[580px] border-2 border-border hover:border-[3px] hover:border-brand-400 hover:bg-green-50',
        className
      )}
      onClick={() => onClick?.(product)}
    >
      {/* Product Image - Portrait (340px) */}
      <div className="relative h-[340px] bg-muted overflow-hidden flex-shrink-0 border-b-2 border-border">
        {product.productPicture ? (
          <img
            src={getDirectImageUrl(product.productPicture)}
            alt={product.productName}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Failed to load image:', product.productPicture);
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Status Badges - Top Left (Admin Only) */}
        {isAdmin && (
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.activeMembershipOnly && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Members
              </Badge>
            )}
            {product.productStatus === 'Draft' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Draft
              </Badge>
            )}
            {product.productStatus === 'Discontinued' && (
              <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                Discontinued
              </Badge>
            )}
            {product.productStatus === 'Out of Stock' && (
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Out of Stock
              </Badge>
            )}
            {isVisibleInStore(product) && (
              <Badge variant="secondary" className="bg-brand-100 text-brand-800">
                👁️ Public
              </Badge>
            )}
          </div>
        )}

        {/* Price Tag - Top Right */}
        {product.prices.general && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
            <p className="text-sm font-bold text-primary">${product.prices.general.toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Product Info Header */}
      <CardHeader className="space-y-1 py-3 flex-shrink-0">
        <CardTitle
          className="text-base line-clamp-1 group-hover:text-primary transition-colors"
          title={product.productName}
        >
          {product.productName}
        </CardTitle>
        <p
          className="text-xs text-muted-foreground line-clamp-1"
          title={product.productDescription || 'No description'}
        >
          {product.productDescription || 'No description available'}
        </p>
      </CardHeader>

      {/* Product Info Content */}
      <CardContent className="space-y-3 py-3 flex-1 flex flex-col">
        {/* Category & Code */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground h-5">
          <span className="truncate font-medium">{product.productCategory}</span>
          <span className="flex-shrink-0">•</span>
          <span className="truncate font-mono text-xs">{product.productCode}</span>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Pricing Section */}
        <div className="pt-1">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-bold text-green-600">
                ${getDisplayPrice(product.prices).toFixed(2)}
              </span>
              {isAdmin && (
                <span className="text-xs text-muted-foreground ml-2">
                  {product.prices.general !== undefined && product.prices.general !== null ? 'General' : 'Highest'}
                </span>
              )}
            </div>
            {isAdmin && (() => {
              const hasGeneralPrice = product.prices.general !== undefined && product.prices.general !== null;
              const otherPricesCount = countAdditionalPrices(product.prices, hasGeneralPrice);
              if (otherPricesCount > 0) {
                return (
                  <span className="text-xs text-brand-600 font-medium">
                    +{otherPricesCount} more
                  </span>
                );
              }
              return null;
            })()}
          </div>
          {product.inventory !== undefined && product.inventory !== null && (
            <div className="text-xs text-muted-foreground mt-1">
              Stock: {product.inventory === 0 ? 'Unlimited' : product.inventory}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isAdmin && onAddToCart && (
          <div className="mt-auto">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart(product);
              }}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {addToCartLabel || 'Add to Cart'}
            </Button>
          </div>
        )}

        {isAdmin && (
          <div className="mt-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={(e) => {
                e.stopPropagation();
                onClick?.(product);
              }}
              title="View product details"
            >
              <Eye className="w-4 h-4" />
            </Button>
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                title="Edit product"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {onGeneratePDF && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onGeneratePDF(product);
                }}
                title="Generate PDF report"
              >
                <FileText className="w-4 h-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                title="Delete product"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
