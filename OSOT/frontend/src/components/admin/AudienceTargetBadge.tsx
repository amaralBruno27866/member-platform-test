/**
 * Audience Target Badge
 * Visual indicator showing if product is public or members-only
 */

import { Globe2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudienceTargetResponse } from '@/services/audienceTargetService';
import { isPublicProduct, getActiveFiltersCount } from '@/services/audienceTargetUtils';

interface AudienceTargetBadgeProps {
  target: AudienceTargetResponse | null | undefined;
  className?: string;
  showCount?: boolean;
}

export function AudienceTargetBadge({ target, className, showCount = false }: AudienceTargetBadgeProps) {
  const isPublic = isPublicProduct(target);
  const filtersCount = getActiveFiltersCount(target);
  
  if (isPublic) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          'bg-green-100 text-green-700',
          className
        )}
        title="This product is visible to everyone"
      >
        <Globe2 className="w-3.5 h-3.5" />
        Public
      </span>
    );
  }
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        'bg-blue-100 text-blue-700',
        className
      )}
      title={`Restricted to members matching ${filtersCount} filter${filtersCount > 1 ? 's' : ''}`}
    >
      <Users className="w-3.5 h-3.5" />
      Members Only
      {showCount && filtersCount > 0 && (
        <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-blue-200 text-blue-800 font-semibold">
          {filtersCount}
        </span>
      )}
    </span>
  );
}
