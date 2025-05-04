import { useState, useMemo } from 'react';

interface PaginationOptions {
  totalItems: number;
  initialPage?: number;
  itemsPerPage?: number;
  maxPages?: number;
}

interface PaginationResult {
  currentPage: number;
  totalPages: number;
  pageItems: number[];
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  startIndex: number;
  endIndex: number;
  setItemsPerPage: (value: number) => void;
  itemsPerPage: number;
}

/**
 * Custom hook for handling pagination logic.
 * 
 * @param options Pagination configuration options
 * @returns Object with pagination state and control functions
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  itemsPerPage: initialItemsPerPage = 10,
  maxPages = 5
}: PaginationOptions): PaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Recalculate when dependencies change
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Adjust current page if it's out of bounds after changing items per page
    const adjustedCurrentPage = Math.min(currentPage, totalPages || 1);
    if (adjustedCurrentPage !== currentPage) {
      setCurrentPage(adjustedCurrentPage);
    }

    // Calculate visible page numbers
    let startPage = Math.max(1, adjustedCurrentPage - Math.floor(maxPages / 2));
    const endPage = Math.min(totalPages, startPage + maxPages - 1);
    
    // Adjust startPage if endPage is maxPages or less
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // Generate array of page numbers to display
    const pageItems = Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
    
    // Calculate start and end indices for the items on the current page
    const startIndex = (adjustedCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage - 1, totalItems - 1);
    
    return {
      totalPages,
      pageItems,
      startIndex,
      endIndex,
      adjustedCurrentPage
    };
  }, [totalItems, currentPage, itemsPerPage, maxPages]);

  // Navigation functions
  const nextPage = () => {
    if (currentPage < paginationData.totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, paginationData.totalPages));
    setCurrentPage(pageNumber);
  };

  return {
    currentPage: paginationData.adjustedCurrentPage,
    totalPages: paginationData.totalPages,
    pageItems: paginationData.pageItems,
    nextPage,
    prevPage,
    goToPage,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    setItemsPerPage,
    itemsPerPage
  };
} 