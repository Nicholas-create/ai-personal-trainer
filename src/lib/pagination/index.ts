/**
 * Pagination utilities for Firestore queries
 */

export interface PaginationOptions {
  /** Number of items per page */
  pageSize: number;
  /** Cursor for the next page (last document ID from previous page) */
  cursor?: string;
}

export interface PaginatedResult<T> {
  /** The items on this page */
  items: T[];
  /** Cursor for the next page (null if no more pages) */
  nextCursor: string | null;
  /** Whether there are more items */
  hasMore: boolean;
  /** Total count (only if requested) */
  totalCount?: number;
}

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/**
 * Validate and normalize pagination options
 */
export function normalizePaginationOptions(
  options?: Partial<PaginationOptions>
): PaginationOptions {
  const pageSize = Math.min(
    Math.max(options?.pageSize || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );

  return {
    pageSize,
    cursor: options?.cursor,
  };
}

/**
 * Create a paginated result from an array of items
 * @param items - Items fetched (should include 1 extra for hasMore detection)
 * @param pageSize - Requested page size
 * @param getItemId - Function to get the ID of an item (for cursor)
 */
export function createPaginatedResult<T>(
  items: T[],
  pageSize: number,
  getItemId: (item: T) => string,
  totalCount?: number
): PaginatedResult<T> {
  const hasMore = items.length > pageSize;
  const pageItems = hasMore ? items.slice(0, pageSize) : items;
  const lastItem = pageItems[pageItems.length - 1];
  const nextCursor = hasMore && lastItem ? getItemId(lastItem) : null;

  return {
    items: pageItems,
    nextCursor,
    hasMore,
    totalCount,
  };
}
