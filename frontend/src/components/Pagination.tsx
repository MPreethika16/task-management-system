import React from 'react';
import type { Pagination as PaginationType } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ pagination, onPageChange }) => {
  const { page, totalPages, total, limit } = pagination;

  const handlePrev = () => {
    if (page > 1) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (page < totalPages) onPageChange(page + 1);
  };

  if (total === 0) return null;

  const startIdx = (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <div className="pagination-info">
        Showing {startIdx} to {endIdx} of {total} results
      </div>
      <div className="pagination-controls">
        <button
          onClick={handlePrev}
          disabled={page === 1}
          aria-label="Previous page"
          title="Previous page"
          className="icon-btn"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="pagination-current">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={page >= totalPages}
          aria-label="Next page"
          title="Next page"
          className="icon-btn"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
