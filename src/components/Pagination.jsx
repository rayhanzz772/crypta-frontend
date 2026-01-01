import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({ metadata, currentPage, onPageChange }) => {
  if (!metadata) return null;

  const { total_page, per_page, total_row } = metadata;

  // Don't show pagination if there's only one page or no data
  if (total_page <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < total_page) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (total_page <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= total_page; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(total_page - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        startPage = 2;
        endPage = 4;
      }

      // Adjust if we're near the end
      if (currentPage >= total_page - 2) {
        startPage = total_page - 3;
        endPage = total_page - 1;
      }

      // Add ellipsis before if needed
      if (startPage > 2) {
        pages.push("...");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis after if needed
      if (endPage < total_page - 1) {
        pages.push("...");
      }

      // Always show last page
      pages.push(total_page);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  // Calculate showing range
  const startItem = (currentPage - 1) * per_page + 1;
  const endItem = Math.min(currentPage * per_page, total_row);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
      {/* Showing info */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing{" "}
        <span className="font-semibold text-slate-800 dark:text-white">
          {startItem}
        </span>{" "}
        to{" "}
        <span className="font-semibold text-slate-800 dark:text-white">
          {endItem}
        </span>{" "}
        of{" "}
        <span className="font-semibold text-slate-800 dark:text-white">
          {total_row}
        </span>{" "}
        results
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all ${
            currentPage === 1
              ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
          }`}
          title="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-slate-600 dark:text-slate-400"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`min-w-[40px] px-3 py-2 rounded-lg border transition-all font-medium ${
                  currentPage === page
                    ? "bg-primary-500 border-primary-500 text-white shadow-sm"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={currentPage === total_page}
          className={`p-2 rounded-lg border transition-all ${
            currentPage === total_page
              ? "border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500"
          }`}
          title="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
