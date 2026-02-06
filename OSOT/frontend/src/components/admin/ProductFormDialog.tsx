/**
 * Product Form Dialog with Tabs
 * Manages product creation/editing with audience target configuration
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Clock, Package, Users } from 'lucide-react';
import { AudienceTargetForm } from './AudienceTargetForm';
import type { ProductResponse } from '@/types/product';
import type { UpdateAudienceTargetDto } from '@/services/audienceTargetService';
import type { UseProductOrchestratorReturn } from '@/hooks/useProductOrchestrator';
import { cn } from '@/lib/utils';

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: ProductResponse | null;
  isEditMode?: boolean;
  children: React.ReactNode; // Product form content
  footer?: React.ReactNode; // Dialog footer with action buttons
  onProductSaved?: (product: ProductResponse) => void;
  useOrchestrator?: boolean;
  orchestrator?: UseProductOrchestratorReturn;
  onTargetDataChange?: (data: UpdateAudienceTargetDto) => void; // Callback for audience target data
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
  isEditMode = false,
  children,
  footer,
  useOrchestrator = false,
  orchestrator,
  onTargetDataChange,
}: ProductFormDialogProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  
  const isAudienceTabLocked = !useOrchestrator && !product?.id;

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-2xl font-bold">
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update product details and configure audience targeting'
              : useOrchestrator
                ? 'Fill in the product information below. You can configure audience targeting before final creation.'
                : 'Create a new product by filling in the details below.'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Orchestrator Status Indicator */}
        {useOrchestrator && orchestrator?.session && (
          <Alert className="border-blue-200 bg-blue-50 flex-shrink-0">
            <Clock className="h-4 w-4 text-blue-600" />
            <AlertDescription className="flex items-center gap-2">
              <span className="text-blue-800 font-medium">Creation Session Active:</span>
              {orchestrator.session.state === 'INITIATED' && (
                <Badge variant="secondary">Ready to Add Product</Badge>
              )}
              {orchestrator.session.state === 'PRODUCT_ADDED' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  Product Saved
                </Badge>
              )}
              {orchestrator.session.state === 'TARGET_CONFIGURED' && (
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1 inline" />
                  Target Configured
                </Badge>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-1">
          <div className="space-y-4 pb-4">
            {/* Product Details Card */}
            <Card className="border-2">
              <CardHeader 
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleSection('basic')}
              >
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-primary" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                "transition-all duration-200",
                expandedSection === 'basic' ? 'block' : 'hidden'
              )}>
                {children}
              </CardContent>
            </Card>

            {/* Audience Targeting Card */}
            <Card className={cn(
              "border-2",
              isAudienceTabLocked && "opacity-60"
            )}>
              <CardHeader 
                className={cn(
                  "cursor-pointer hover:bg-accent/50 transition-colors",
                  isAudienceTabLocked && "cursor-not-allowed"
                )}
                onClick={() => !isAudienceTabLocked && toggleSection('audience')}
              >
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-primary" />
                  Audience Targeting
                  {isAudienceTabLocked && (
                    <Badge variant="secondary" className="ml-auto">Save product first</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className={cn(
                "transition-all duration-200",
                expandedSection === 'audience' ? 'block' : 'hidden'
              )}>
                <AudienceTargetForm
                  productId={product?.id}
                  locked={isAudienceTabLocked}
                  orchestrator={useOrchestrator ? orchestrator : undefined}
                  onTargetDataChange={onTargetDataChange}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog Footer */}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
