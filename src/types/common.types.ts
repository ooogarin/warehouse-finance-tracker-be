// Common type definitions used across the application

// UUID string type
export type UUID = string;

// Timestamp type (ISO 8601 string)
export type Timestamp = string;

// Base entity fields present in all database tables
export interface BaseEntity {
  id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
  deleted_at: Timestamp | null;
}

// Pagination parameters
export interface PaginationParams {
  page: number;
  limit: number;
}

// Pagination metadata in responses
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next_page: boolean;
  has_prev_page: boolean;
}

// Sort order
export type SortOrder = 'asc' | 'desc';

// Sort parameters
export interface SortParams {
  field: string;
  order: SortOrder;
}

// Standard API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    details?: {
      field: string;
      message: string;
    }[];
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// API error response
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: {
      field: string;
      message: string;
    }[];
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// Database entity with soft delete
export interface SoftDeletable {
  deleted_at: Timestamp | null;
}

// Timestamps for database entities
export interface Timestampable {
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Generic filter operators
export interface FilterOperators<T> {
  eq?: T;
  neq?: T;
  gt?: T;
  gte?: T;
  lt?: T;
  lte?: T;
  in?: T[];
  notIn?: T[];
  like?: string;
  ilike?: string;
  isNull?: boolean;
}

// Query filter for list endpoints
export type QueryFilter<T> = {
  [K in keyof T]?: T[K] | FilterOperators<T[K]>;
};

// List query parameters
export interface ListQueryParams<T = unknown> {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
  filters?: QueryFilter<T>;
}

/**
 * Money/currency amount (stored as integer cents)
 * Example: Rp 10.500 = 10500
 */
export type Money = number;

/**
 * Weight in grams (stored as integer)
 * Example: 1.5 kg = 1500
 */
export type Weight = number;

/**
 * Volume in milliliters (stored as integer)
 * Example: 1.5 L = 1500
 */
export type Volume = number;

// Percentage (0-100)
export type Percentage = number;

// JSON object type
export type JsonObject = Record<string, unknown>;

// JSON array type
export type JsonArray = unknown[];

// Any JSON value
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

// Nullable type helper
export type Nullable<T> = T | null;

// Optional type helper
export type Optional<T> = T | undefined;

// Deep partial type
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Omit undefined values from type
export type Defined<T> = T extends undefined ? never : T;
