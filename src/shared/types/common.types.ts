// Pagination metadata in responses
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
}

interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  meta: ApiResponseMeta;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error: ApiErrorPayload;
  meta: ApiResponseMeta;
  data?: never;
  pagination?: never;
}

// Standard API response wrapper
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
