import type { ParsedQs } from "qs";

const getPagination = (query: ParsedQs) => {
  const page = Math.max(parseInt(String(query.page), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(query.limit), 10) || 20, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const getPagingData = <T>(count: number, rows: T[], page: number, limit: number) => ({
  total: count,
  page,
  limit,
  totalPages: Math.ceil(count / limit),
  items: rows,
});

export { getPagination, getPagingData };