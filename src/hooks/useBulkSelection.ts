import { useState, useCallback, useMemo } from 'react';

interface BulkSelectionOptions<T extends { id: string }> {
  items: T[];
}

export function useBulkSelection<T extends { id: string }>({ items }: BulkSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      deselectAll();
    } else {
      selectAll();
    }
  }, [selectedIds.size, items.length, selectAll, deselectAll]);

  const selectedItems = useMemo(() => {
    return items.filter(item => selectedIds.has(item.id));
  }, [items, selectedIds]);

  const isAllSelected = useMemo(() => {
    return items.length > 0 && selectedIds.size === items.length;
  }, [items.length, selectedIds.size]);

  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < items.length;
  }, [selectedIds.size, items.length]);

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelection,
    selectAll,
    deselectAll,
    toggleSelectAll,
    isAllSelected,
    isSomeSelected,
    hasSelection: selectedIds.size > 0,
  };
}
