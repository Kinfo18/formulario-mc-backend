export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(String(query.limit ?? '20'), 10) || 20));
  return { page, limit };
}

export function buildMeta(total: number, { page, limit }: PaginationParams): PaginationMeta {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
