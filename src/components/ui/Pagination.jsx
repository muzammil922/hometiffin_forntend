import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [20, 40, 50, 100]

/**
 * Premium Pagination component with:
 *  - Per-page selector (20 / 40 / 50 / 100)
 *  - Page number buttons with ellipsis
 *  - First / Prev / Next / Last navigation
 *
 * Props:
 *  page          – current page (1-indexed)
 *  totalPages    – total pages
 *  total         – total record count
 *  limit         – current page size
 *  onPageChange(newPage)        – called when page changes
 *  onLimitChange(newLimit)      – called when page-size changes
 */
export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }) {
  if (!total || total === 0) return null

  const from = Math.min((page - 1) * limit + 1, total)
  const to   = Math.min(page * limit, total)

  /* Build visible page numbers with at-most-1 ellipsis gap on each side */
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = new Set([1, totalPages])
    for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) pages.add(i)
    return [...pages].sort((a, b) => a - b)
  }
  const pages = getPages()

  const NavBtn = ({ children, onClick, disabled, active = false, label }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={[
        'flex items-center justify-center h-9 min-w-[36px] px-2.5 rounded-xl text-xs font-bold transition-all duration-150 border select-none',
        active
          ? 'bg-primary text-white border-primary shadow-md scale-105'
          : disabled
            ? 'text-gray-300 border-gray-100 bg-white cursor-not-allowed'
            : 'text-gray-600 border-emerald-100 bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-primary cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-col gap-3 pt-5 border-t border-emerald-50">
      {/* Row: records info + per-page selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Records info */}
        <p className="text-[11px] text-gray-400 font-semibold">
          Showing{' '}
          <span className="text-text-dark font-bold">{from}</span>
          {' '}–{' '}
          <span className="text-text-dark font-bold">{to}</span>
          {' '}of{' '}
          <span className="text-text-dark font-bold">{total}</span>
          {' '}records
        </p>

        {/* Per-page selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap">Rows per page:</span>
          <div className="flex items-center gap-1">
            {PAGE_SIZE_OPTIONS.map(size => (
              <button
                key={size}
                onClick={() => { if (size !== limit) { onLimitChange?.(size) } }}
                className={[
                  'h-8 px-3 rounded-xl text-xs font-bold border transition-all duration-150 cursor-pointer',
                  size === limit
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-white text-gray-500 border-emerald-100 hover:bg-emerald-50 hover:text-primary hover:border-emerald-300',
                ].join(' ')}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row: page navigation (only if more than 1 page) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {/* First */}
          <NavBtn onClick={() => onPageChange(1)} disabled={page === 1} label="First page">
            <ChevronsLeft className="w-3.5 h-3.5" />
          </NavBtn>

          {/* Previous */}
          <NavBtn onClick={() => onPageChange(page - 1)} disabled={page === 1} label="Previous page">
            <ChevronLeft className="w-3.5 h-3.5" />
          </NavBtn>

          {/* Page numbers with ellipsis */}
          {pages.map((p, i) => {
            const prev = pages[i - 1]
            const showEllipsisBefore = prev && p - prev > 1
            return (
              <React.Fragment key={p}>
                {showEllipsisBefore && (
                  <span className="h-9 px-1 flex items-center justify-center text-xs text-gray-400 font-bold select-none">
                    …
                  </span>
                )}
                <NavBtn onClick={() => onPageChange(p)} active={page === p} label={`Page ${p}`}>
                  {p}
                </NavBtn>
              </React.Fragment>
            )
          })}

          {/* Next */}
          <NavBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages} label="Next page">
            <ChevronRight className="w-3.5 h-3.5" />
          </NavBtn>

          {/* Last */}
          <NavBtn onClick={() => onPageChange(totalPages)} disabled={page === totalPages} label="Last page">
            <ChevronsRight className="w-3.5 h-3.5" />
          </NavBtn>
        </div>
      )}
    </div>
  )
}
