/**
 * Migration 001: Create All Enums
 */

import type { SQL } from 'bun';

export const up = async (transaction: SQL): Promise<void> => {
  // User roles
  await transaction`CREATE TYPE user_role AS ENUM ('owner', 'staff', 'cashier')`;

  // Merchant types
  await transaction`CREATE TYPE merchant_type AS ENUM ('restaurant', 'cafe', 'catering', 'other')`;

  // Ingredient categories
  await transaction`
    CREATE TYPE ingredient_category AS ENUM (
      'vegetables',
      'meat',
      'seafood',
      'spices',
      'oil',
      'grains',
      'liquid',
      'other'
    )
  `;

  // Stock usage types
  await transaction`
    CREATE TYPE stock_usage_type AS ENUM (
      'usage',
      'waste'
    )
  `;

  // Stock adjustment flow types
  await transaction`
    CREATE TYPE stock_adjustment_flow_type AS ENUM (
      'in',
      'out'
    )
  `;

  // Stock log flow types
  await transaction`
    CREATE TYPE stock_log_flow_type AS ENUM (
      'in',
      'out'
    )
  `;

  // Stock log reference types
  await transaction`
    CREATE TYPE stock_log_reference_type AS ENUM (
      'purchase',
      'usage',
      'waste',
      'adjustment'
    )
  `;

  // Cash log flow types
  await transaction`CREATE TYPE cash_log_flow_type AS ENUM ('in', 'out')`;

  // Cash log categories
  await transaction`
    CREATE TYPE cash_log_category AS ENUM (
      'sales_revenue',
      'capital_injection',
      'debt_repayment_in',
      'other_in',
      'purchase_payment',
      'debt_payment_out',
      'owner_withdrawal',
      'salary',
      'utilities',
      'rent',
      'maintenance',
      'other_out'
    )
  `;

  // Cash log reference types
  await transaction`CREATE TYPE cash_log_reference_type AS ENUM ('purchase_order', 'debt_payment')`;

  // Debt creditor types
  await transaction`CREATE TYPE debt_creditor_type AS ENUM ('owner', 'supplier', 'other')`;

  // Debt statuses
  await transaction`CREATE TYPE debt_status AS ENUM ('unpaid', 'partial', 'paid')`;

  // Debt payment methods
  await transaction`CREATE TYPE debt_payment_method AS ENUM ('cash', 'transfer', 'other')`;
};

export const down = async (transaction: SQL): Promise<void> => {
  // Reverse order: drop last created first
  await transaction`DROP TYPE IF EXISTS debt_payment_method CASCADE`;
  await transaction`DROP TYPE IF EXISTS debt_status CASCADE`;
  await transaction`DROP TYPE IF EXISTS debt_creditor_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS cash_log_reference_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS cash_log_category CASCADE`;
  await transaction`DROP TYPE IF EXISTS cash_log_flow_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS stock_log_reference_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS stock_log_flow_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS stock_adjustment_flow_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS stock_usage_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS ingredient_category CASCADE`;
  await transaction`DROP TYPE IF EXISTS merchant_type CASCADE`;
  await transaction`DROP TYPE IF EXISTS user_role CASCADE`;
};
