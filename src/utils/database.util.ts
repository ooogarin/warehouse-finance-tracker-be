import type { Connection } from '@/config/database.config';

// Database utility functions

// Build ORDER BY clause
export const buildOrderBy = (field: string, order: 'asc' | 'desc' = 'desc'): string => {
  const validFields = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field);
  if (!validFields) {
    throw new Error(`Invalid order by field: ${field}`);
  }
  return `${field} ${order.toUpperCase()}`;
};

// Build pagination LIMIT and OFFSET
export const buildPagination = (page: number, limit: number): { limit: number; offset: number } => {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit));
  const offset = (validPage - 1) * validLimit;
  return { limit: validLimit, offset };
};

// Build ILIKE search condition
export const buildSearchCondition = (column: string, searchTerm: string): { condition: string; value: string } => {
  const validColumn = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column);
  if (!validColumn) {
    throw new Error(`Invalid column name: ${column}`);
  }
  return {
    condition: `${column} ILIKE $1`,
    value: `%${searchTerm}%`,
  };
};

// Convert camelCase to snake_case
export const toSnakeCase = (str: string): string => {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
};

// Convert snake_case to camelCase
export const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

// Transform object keys from snake_case to camelCase
export const keysToCamelCase = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = value;
  }
  return result;
};

// Transform object keys from camelCase to snake_case
export const keysToSnakeCase = <T extends Record<string, unknown>>(obj: T): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = toSnakeCase(key);
    result[snakeKey] = value;
  }
  return result;
};

// Execute a batch of queries in a single transaction
export const executeBatch = async <T>(_connection: Connection, queries: (() => Promise<T>)[]): Promise<T[]> => {
  const results: T[] = [];
  for (const query of queries) {
    const result = await query();
    results.push(result);
  }
  return results;
};

// Check if a record exists
export const recordExists = async (connection: Connection, table: string, conditions: Record<string, unknown>): Promise<boolean> => {
  const keys = Object.keys(conditions);
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  const _values = Object.values(conditions);

  const result = await connection`
    SELECT 1 
    FROM ${connection.unsafe(table)} 
    WHERE ${connection.unsafe(whereClause)}
    LIMIT 1
  `;

  return result.length > 0;
};

// Generate UUID v4
// Uses Bun's crypto.randomUUID()
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

// Format date for database (ISO 8601)
export const formatDate = (date: Date = new Date()): string => {
  return date.toISOString();
};

// Parse database date string to Date object
export const parseDate = (dateStr: string): Date => {
  return new Date(dateStr);
};

// Build IN clause with parameter placeholders
// Returns: { clause: "id IN ($1, $2, $3)", params: [1, 2, 3] }
export const buildInClause = (column: string, values: unknown[], startIndex = 1): { clause: string; params: unknown[] } => {
  const validColumn = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(column);
  if (!validColumn) {
    throw new Error(`Invalid column name: ${column}`);
  }

  if (values.length === 0) {
    return { clause: '1=0', params: [] }; // Always false
  }

  const placeholders = values.map((_, i) => `$${startIndex + i}`).join(', ');
  return {
    clause: `${column} IN (${placeholders})`,
    params: values,
  };
};
