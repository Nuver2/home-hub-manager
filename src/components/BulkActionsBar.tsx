import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  children: ReactNode;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClear,
  children,
  className,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50",
            "bg-primary text-primary-foreground rounded-full shadow-lg",
            "px-4 py-2 flex items-center gap-3",
            className
          )}
        >
          <span className="text-sm font-medium whitespace-nowrap">
            {selectedCount} selected
          </span>
          
          <div className="h-4 w-px bg-primary-foreground/30" />
          
          <div className="flex items-center gap-1">
            {children}
          </div>
          
          <div className="h-4 w-px bg-primary-foreground/30" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
