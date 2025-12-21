import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled }: PullToRefreshProps) {
  const { containerRef, isPulling, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh,
    disabled,
  });

  return (
    <div ref={containerRef} className="relative">
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-opacity duration-200",
          (isPulling || isRefreshing) && pullDistance > 10 ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: Math.max(8, pullDistance - 40),
        }}
      >
        <div className={cn(
          "w-10 h-10 rounded-full bg-background border shadow-lg flex items-center justify-center",
          isRefreshing && "animate-spin"
        )}>
          <RefreshCw
            className={cn(
              "h-5 w-5 text-primary transition-transform duration-200",
              !isRefreshing && "transition-transform"
            )}
            style={{
              transform: !isRefreshing ? `rotate(${pullProgress * 180}deg)` : undefined,
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform: isPulling && !isRefreshing ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
