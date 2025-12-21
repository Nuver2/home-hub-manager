import { useState, useMemo, useCallback } from 'react';

interface PaginationOptions<T> {
  data: T[];
  itemsPerPage?: number;
}

export function usePagination<T>({ data, itemsPerPage = 10 }: PaginationOptions<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = useMemo(() => Math.ceil(data.length / itemsPerPage), [data.length, itemsPerPage]);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, itemsPerPage]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const previousPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedData,
    goToPage,
    nextPage,
    previousPage,
    resetPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    totalItems: data.length,
    startIndex: (currentPage - 1) * itemsPerPage + 1,
    endIndex: Math.min(currentPage * itemsPerPage, data.length),
  };
}
