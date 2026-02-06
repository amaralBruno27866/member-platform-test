/**
 * Product Management Tabs Component
 * Tabs for Product Details and Audience Targeting
 */

import { Lock, LockOpen, Package, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProductTab = 'details' | 'audience';

interface ProductTabsProps {
  activeTab: ProductTab;
  onTabChange: (tab: ProductTab) => void;
  isAudienceTabLocked: boolean;
}

export function ProductTabs({ activeTab, onTabChange, isAudienceTabLocked }: ProductTabsProps) {
  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8" aria-label="Tabs">
        <button
          onClick={() => onTabChange('details')}
          className={cn(
            'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm',
            activeTab === 'details'
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          <Package className="h-5 w-5" />
          Product Details
        </button>

        <button
          onClick={() => !isAudienceTabLocked && onTabChange('audience')}
          disabled={isAudienceTabLocked}
          className={cn(
            'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all',
            activeTab === 'audience' && !isAudienceTabLocked
              ? 'border-brand-500 text-brand-600'
              : 'border-transparent',
            isAudienceTabLocked
              ? 'text-gray-400 cursor-not-allowed opacity-60'
              : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
          )}
        >
          <Users className="h-5 w-5" />
          Audience Target
          {isAudienceTabLocked ? (
            <Lock className="h-4 w-4" />
          ) : (
            <LockOpen className="h-4 w-4" />
          )}
        </button>
      </nav>
    </div>
  );
}

interface ProductTabPanelProps {
  value: ProductTab;
  activeTab: ProductTab;
  children: React.ReactNode;
}

export function ProductTabPanel({ value, activeTab, children }: ProductTabPanelProps) {
  if (value !== activeTab) return null;
  
  return (
    <div className="py-6">
      {children}
    </div>
  );
}
