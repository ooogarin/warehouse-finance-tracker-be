# Implementation Plan - Pengelola Modal Dapur

> **Goal**: Build a production-ready Warehouse & Finance Management API for small-to-medium restaurants, cafes, and catering businesses.
> **Estimated Duration**: 8-10 weeks (1 developer)
> **Tech Stack**: Bun + Hono + PostgreSQL + TypeScript

---

## Table of Contents

1. [Phase 0: Project Setup & Infrastructure](#phase-0-project-setup--infrastructure)
2. [Phase 1: Core Infrastructure](#phase-1-core-infrastructure)
3. [Phase 2: Authentication & User Management](#phase-2-authentication--user-management)
4. [Phase 3: Merchant & Supplier Management](#phase-3-merchant--supplier-management)
5. [Phase 4: Ingredient & Inventory Management](#phase-4-ingredient--inventory-management)
6. [Phase 5: Purchase Order System](#phase-5-purchase-order-system)
7. [Phase 6: FIFO Stock Management](#phase-6-fifo-stock-management)
8. [Phase 7: Cash Flow Management](#phase-7-cash-flow-management)
9. [Phase 8: Debt Management](#phase-8-debt-management)
10. [Phase 9: Dashboard & Reporting](#phase-9-dashboard--reporting)
11. [Phase 10: Testing & Documentation](#phase-10-testing--documentation)

---

## Phase 0: Project Setup & Infrastructure

**Duration**: 2-3 days  
**Deliverable**: Project bootstrapped, development environment ready

### Tasks

#### 0.1 Initialize Project Structure

- [ ] Create project directory structure following AGENTS.md conventions
- [ ] Initialize Git repository
- [ ] Create `.gitignore` for Node.js/Bun projects

#### 0.2 Configuration Files

- [ ] `package.json` with Bun scripts (dev, test, lint, format)
- [ ] `tsconfig.json` with path aliases (`@/*`)
- [ ] `biome.json` for linting and formatting
- [ ] `bunfig.toml` for Bun configuration

#### 0.3 Environment Setup

- [ ] `.env.example` with all required variables
- [ ] `.env` for local development
- [ ] Environment validation schema (Zod)

#### 0.4 Docker Setup (Optional but recommended)

- [ ] `docker-compose.yml` for PostgreSQL
- [ ] `Dockerfile` for production builds

### Files to Create

```
├── package.json
├── tsconfig.json
├── biome.json
├── bunfig.toml
├── .env.example
├── .env
├── .gitignore
└── docker-compose.yml
```

---

## Phase 1: Core Infrastructure

**Duration**: 3-4 days  
**Deliverable**: Database connected, middleware pipeline ready

### Tasks

#### 1.1 Configuration Layer

- [ ] `src/config/env.config.ts` - Environment variables with Zod validation
- [ ] `src/config/database.config.ts` - PostgreSQL connection pool using Bun.SQL
- [ ] `src/config/logger.config.ts` - Pino logger configuration

#### 1.2 Constants & Types

- [ ] `src/constants/messages.constant.ts` - User-facing messages (Indonesian)
- [ ] `src/constants/error-codes.constant.ts` - Error code definitions
- [ ] `src/constants/roles.constant.ts` - User role definitions (owner, staff, cashier)
- [ ] `src/types/context.types.ts` - Hono context extensions
- [ ] `src/types/common.types.ts` - Shared TypeScript types

#### 1.3 Utility Functions

- [ ] `src/utils/errors.util.ts` - Custom error classes
  - `ValidationError`
  - `UnauthorizedError`
  - `ForbiddenError`
  - `NotFoundError`
  - `ConflictError`
  - `InternalError`
- [ ] `src/utils/response.util.ts` - API response formatters
  - `successResponse()`
  - `errorResponse()`
- [ ] `src/utils/database.util.ts` - DB helpers (transaction management)

#### 1.4 Middleware

- [ ] `src/middleware/error-handler.middleware.ts` - Global error handler
- [ ] `src/middleware/auth.middleware.ts` - JWT authentication
- [ ] `src/middleware/merchant.middleware.ts` - Merchant context loader
- [ ] `src/middleware/role.middleware.ts` - RBAC middleware
- [ ] `src/middleware/validation.middleware.ts` - Zod validation wrapper

#### 1.5 Database Migrations

- [ ] Migration runner script (`scripts/migrate.ts`)
- [ ] Migration 001: Initial schema
  - users table
  - merchants table
  - user_merchants table (junction)

### Files to Create

```
src/
├── config/
│   ├── env.config.ts
│   ├── database.config.ts
│   └── logger.config.ts
├── constants/
│   ├── messages.constant.ts
│   ├── error-codes.constant.ts
│   └── roles.constant.ts
├── types/
│   ├── context.types.ts
│   └── common.types.ts
├── utils/
│   ├── errors.util.ts
│   ├── response.util.ts
│   └── database.util.ts
├── middleware/
│   ├── error-handler.middleware.ts
│   ├── auth.middleware.ts
│   ├── merchant.middleware.ts
│   ├── role.middleware.ts
│   └── validation.middleware.ts
└── index.ts (basic server setup)

scripts/
└── migrate.ts

migrations/
└── 001_create_initial_schema.sql
```

---

## Phase 2: Authentication & User Management

**Duration**: 4-5 days  
**Deliverable**: Complete auth system (register, login, JWT, password reset)

### Tasks

#### 2.1 Database Schema

- [ ] Migration 002: Add auth-related tables/indexes

#### 2.2 Types

- [ ] `src/types/auth.types.ts` - Auth-related TypeScript types

#### 2.3 Validators

- [ ] `src/validators/auth.schemas.ts` - Zod schemas
  - Register schema
  - Login schema
  - Password reset schema

#### 2.4 Repository

- [ ] `src/repositories/client.ts` - DB client helper
- [ ] `src/repositories/users.repository.ts`
  - `create()`
  - `findByEmail()`
  - `findById()`
  - `update()`
  - `updatePassword()`

#### 2.5 Service

- [ ] `src/services/auth.service.ts`
  - `register()` - Hash password with Bun.password
  - `login()` - Validate credentials, generate JWT
  - `refreshToken()`
  - `changePassword()`
  - `resetPasswordRequest()`
  - `resetPassword()`

#### 2.6 Controller

- [ ] `src/controllers/auth.controller.ts`
  - `register()`
  - `login()`
  - `logout()`
  - `refresh()`
  - `me()` - Get current user
  - `updateProfile()`
  - `changePassword()`

#### 2.7 Routes

- [ ] `src/routes/public/auth.routes.ts` - Public auth endpoints
- [ ] `src/routes/v1/auth.routes.ts` - Protected auth endpoints

#### 2.8 Testing

- [ ] Unit tests for auth service
- [ ] Integration tests for auth endpoints

### API Endpoints

| Method | Endpoint              | Description       | Auth   |
| ------ | --------------------- | ----------------- | ------ |
| POST   | /auth/register        | Register new user | Public |
| POST   | /auth/login           | Login             | Public |
| POST   | /auth/refresh         | Refresh token     | Public |
| GET    | /v1/auth/me           | Get current user  | JWT    |
| PUT    | /v1/auth/profile      | Update profile    | JWT    |
| PUT    | /v1/auth/password     | Change password   | JWT    |
| POST   | /auth/forgot-password | Request reset     | Public |
| POST   | /auth/reset-password  | Reset password    | Public |

---

## Phase 3: Merchant & Supplier Management

**Duration**: 5-6 days  
**Deliverable**: Multi-tenant merchant system with supplier management

### Tasks

#### 3.1 Database Schema

- [ ] Migration 003: suppliers table
- [ ] Migration 004: merchant settings/preferences table

#### 3.2 Types

- [ ] `src/types/merchants.types.ts`
- [ ] `src/types/suppliers.types.ts`

#### 3.3 Validators

- [ ] `src/validators/merchants.schemas.ts`
- [ ] `src/validators/suppliers.schemas.ts`

#### 3.4 Repositories

- [ ] `src/repositories/merchants.repository.ts`
  - CRUD operations
  - `getAllByUserId()`
  - `getById()`
  - `create()`
  - `update()`
  - `softDelete()`
- [ ] `src/repositories/suppliers.repository.ts`
  - Similar CRUD operations
  - `getAllByMerchantId()`
  - `getDebtsBySupplier()`

#### 3.5 Services

- [ ] `src/services/merchants.service.ts`
  - Create merchant (auto-create user_merchants relation with owner role)
  - Update merchant
  - Delete merchant (soft delete)
  - Get merchant details
  - Invite user to merchant
  - Remove user from merchant
- [ ] `src/services/suppliers.service.ts`
  - CRUD for suppliers
  - Get supplier with debt summary

#### 3.6 Controllers

- [ ] `src/controllers/merchants.controller.ts`
- [ ] `src/controllers/suppliers.controller.ts`

#### 3.7 Routes

- [ ] `src/routes/v1/merchants.routes.ts`
- [ ] `src/routes/v1/suppliers.routes.ts`

### API Endpoints - Merchants

| Method | Endpoint                          | Description           | Role   |
| ------ | --------------------------------- | --------------------- | ------ |
| GET    | /v1/merchants                     | List user's merchants | Any    |
| POST   | /v1/merchants                     | Create merchant       | Any    |
| GET    | /v1/merchants/:id                 | Get merchant details  | Member |
| PUT    | /v1/merchants/:id                 | Update merchant       | Owner  |
| DELETE | /v1/merchants/:id                 | Delete merchant       | Owner  |
| POST   | /v1/merchants/:id/invite          | Invite user           | Owner  |
| DELETE | /v1/merchants/:id/members/:userId | Remove member         | Owner  |
| GET    | /v1/merchants/:id/members         | List members          | Owner  |

### API Endpoints - Suppliers

| Method | Endpoint                | Description                      |
| ------ | ----------------------- | -------------------------------- |
| GET    | /v1/suppliers           | List suppliers (with pagination) |
| POST   | /v1/suppliers           | Create supplier                  |
| GET    | /v1/suppliers/:id       | Get supplier details             |
| PUT    | /v1/suppliers/:id       | Update supplier                  |
| DELETE | /v1/suppliers/:id       | Delete supplier                  |
| GET    | /v1/suppliers/:id/debts | Get supplier debt history        |

---

## Phase 4: Ingredient & Inventory Management

**Duration**: 6-7 days  
**Deliverable**: Complete ingredient catalog with unit management

### Tasks

#### 4.1 Database Schema

- [ ] Migration 005: ingredients table
- [ ] Migration 006: ingredient_units table (unit conversions)
- [ ] Migration 007: categories table (for organizing ingredients)

#### 4.2 Types

- [ ] `src/types/ingredients.types.ts`
- [ ] `src/types/categories.types.ts`

#### 4.3 Validators

- [ ] `src/validators/ingredients.schemas.ts`
- [ ] `src/validators/categories.schemas.ts`

#### 4.4 Repositories

- [ ] `src/repositories/ingredients.repository.ts`
  - `getAllByMerchant()`
  - `getById()`
  - `create()`
  - `update()`
  - `softDelete()`
  - `updateStock()`
  - `getLowStock()`
- [ ] `src/repositories/ingredient-units.repository.ts`
  - Manage unit conversions
- [ ] `src/repositories/categories.repository.ts`

#### 4.5 Services

- [ ] `src/services/ingredients.service.ts`
  - CRUD operations
  - Stock level monitoring
  - Unit conversion logic
  - Low stock alerts
- [ ] `src/services/categories.service.ts`

#### 4.6 Controllers

- [ ] `src/controllers/ingredients.controller.ts`
- [ ] `src/controllers/categories.controller.ts`

#### 4.7 Routes

- [ ] `src/routes/v1/ingredients.routes.ts`
- [ ] `src/routes/v1/categories.routes.ts`

### Key Features

- **Unit Management**: Base unit + conversion factors (e.g., 1 box = 12 pcs)
- **Stock Alerts**: Min/max stock levels
- **Expiry Tracking**: Track expiry dates for perishable items
- **Categories**: Organize ingredients by category

### API Endpoints - Ingredients

| Method | Endpoint                  | Description                                 |
| ------ | ------------------------- | ------------------------------------------- |
| GET    | /v1/ingredients           | List ingredients (with filters, pagination) |
| POST   | /v1/ingredients           | Create ingredient                           |
| GET    | /v1/ingredients/:id       | Get ingredient details                      |
| PUT    | /v1/ingredients/:id       | Update ingredient                           |
| DELETE | /v1/ingredients/:id       | Delete ingredient                           |
| GET    | /v1/ingredients/low-stock | Get low stock alerts                        |
| POST   | /v1/ingredients/:id/units | Add unit conversion                         |
| GET    | /v1/ingredients/:id/units | Get unit conversions                        |

---

## Phase 5: Purchase Order System

**Duration**: 7-8 days  
**Deliverable**: Complete PO workflow (create, approve, receive)

### Tasks

#### 5.1 Database Schema

- [ ] Migration 008: purchase_orders table
- [ ] Migration 009: purchase_items table

#### 5.2 Types

- [ ] `src/types/purchase-orders.types.ts`

#### 5.3 Validators

- [ ] `src/validators/purchase-orders.schemas.ts`

#### 5.4 Repositories

- [ ] `src/repositories/purchase-orders.repository.ts`
  - `getAllByMerchant()`
  - `getById()` (with items)
  - `create()`
  - `update()`
  - `updateStatus()`
  - `softDelete()`
- [ ] `src/repositories/purchase-items.repository.ts`

#### 5.5 Services

- [ ] `src/services/purchase-orders.service.ts`
  - Create PO (draft status)
  - Update PO (only draft)
  - Submit PO (change status to pending)
  - Approve/Reject PO
  - Receive PO (partial or full)
  - Cancel PO
  - Calculate totals
- [ ] `src/services/purchase-orders.workflow.ts` - State machine for PO status

#### 5.6 Controllers

- [ ] `src/controllers/purchase-orders.controller.ts`

#### 5.7 Routes

- [ ] `src/routes/v1/purchase-orders.routes.ts`

### PO Status Workflow

```
DRAFT → PENDING → APPROVED → PARTIALLY_RECEIVED → RECEIVED
          ↓           ↓              ↓
        CANCELLED  REJECTED      CANCELLED
```

### API Endpoints - Purchase Orders

| Method | Endpoint                        | Description             |
| ------ | ------------------------------- | ----------------------- |
| GET    | /v1/purchase-orders             | List POs (with filters) |
| POST   | /v1/purchase-orders             | Create PO (draft)       |
| GET    | /v1/purchase-orders/:id         | Get PO details          |
| PUT    | /v1/purchase-orders/:id         | Update PO (draft only)  |
| POST   | /v1/purchase-orders/:id/submit  | Submit PO for approval  |
| POST   | /v1/purchase-orders/:id/approve | Approve PO              |
| POST   | /v1/purchase-orders/:id/reject  | Reject PO               |
| POST   | /v1/purchase-orders/:id/receive | Receive items           |
| POST   | /v1/purchase-orders/:id/cancel  | Cancel PO               |

---

## Phase 6: FIFO Stock Management

**Duration**: 7-8 days  
**Deliverable**: FIFO batch tracking, stock movement logging

### Tasks

#### 6.1 Database Schema

- [ ] Migration 010: ingredient_batches table (FIFO tracking)
- [ ] Migration 011: stock_logs table (audit trail)

#### 6.2 Types

- [ ] `src/types/stock.types.ts`
- [ ] `src/types/batches.types.ts`

#### 6.3 Validators

- [ ] `src/validators/stock.schemas.ts`

#### 6.4 Repositories

- [ ] `src/repositories/batches.repository.ts`
  - `createBatch()` - New stock arrival
  - `getAvailableBatches()` - For FIFO consumption
  - `reduceBatchQuantity()`
  - `getBatchById()`
  - `getExpiringBatches()`
- [ ] `src/repositories/stock-logs.repository.ts`
  - `logStockMovement()`
  - `getStockHistory()`

#### 6.5 Services

- [ ] `src/services/fifo.service.ts` - Core FIFO logic
  - `addStock()` - Create batch from PO receipt
  - `consumeStock()` - FIFO consumption
  - `adjustStock()` - Manual adjustment
  - `wasteStock()` - Record waste
  - `getCurrentStock()`
  - `getStockValue()`
- [ ] `src/services/stock.service.ts` - High-level stock operations

#### 6.6 Controllers

- [ ] `src/controllers/stock.controller.ts`

#### 6.7 Routes

- [ ] `src/routes/v1/stock.routes.ts`

### Key Features

- **FIFO Cost Calculation**: Accurate COGS based on batch costs
- **Batch Tracking**: Track each purchase batch separately
- **Expiry Management**: Alert on expiring/expired batches
- **Stock Movements**: Log all IN/USE/WASTE/ADJUSTMENT actions

### API Endpoints - Stock

| Method | Endpoint                        | Description                      |
| ------ | ------------------------------- | -------------------------------- |
| GET    | /v1/stock                       | Get current stock summary        |
| GET    | /v1/stock/:ingredientId         | Get stock details for ingredient |
| GET    | /v1/stock/:ingredientId/batches | Get batches for ingredient       |
| POST   | /v1/stock/consume               | Record stock usage               |
| POST   | /v1/stock/adjust                | Manual stock adjustment          |
| POST   | /v1/stock/waste                 | Record waste                     |
| GET    | /v1/stock/expiring              | Get expiring batches             |
| GET    | /v1/stock/logs                  | Get stock movement history       |

---

## Phase 7: Cash Flow Management

**Duration**: 5-6 days  
**Deliverable**: Cash transaction tracking, balance monitoring

### Tasks

#### 7.1 Database Schema

- [ ] Migration 012: cash_logs table

#### 7.2 Types

- [ ] `src/types/cash.types.ts`

#### 7.3 Validators

- [ ] `src/validators/cash.schemas.ts`

#### 7.4 Repositories

- [ ] `src/repositories/cash-logs.repository.ts`
  - `create()`
  - `getAllByMerchant()`
  - `getBalance()`
  - `getSummaryByDateRange()`

#### 7.5 Services

- [ ] `src/services/cash.service.ts`
  - `addIncome()` - Record income
  - `addExpense()` - Record expense
  - `getCurrentBalance()`
  - `getCashFlowReport()`
  - `getDailySummary()`

#### 7.6 Controllers

- [ ] `src/controllers/cash.controller.ts`

#### 7.7 Routes

- [ ] `src/routes/v1/cash.routes.ts`

### API Endpoints - Cash

| Method | Endpoint         | Description               |
| ------ | ---------------- | ------------------------- |
| GET    | /v1/cash/balance | Get current balance       |
| GET    | /v1/cash/logs    | List cash transactions    |
| POST   | /v1/cash/income  | Record income             |
| POST   | /v1/cash/expense | Record expense            |
| GET    | /v1/cash/summary | Get cash flow summary     |
| GET    | /v1/cash/report  | Generate cash flow report |

---

## Phase 8: Debt Management

**Duration**: 5-6 days  
**Deliverable**: Supplier & owner debt tracking with payments

### Tasks

#### 8.1 Database Schema

- [ ] Migration 013: debts table
- [ ] Migration 014: debt_payments table

#### 8.2 Types

- [ ] `src/types/debts.types.ts`

#### 8.3 Validators

- [ ] `src/validators/debts.schemas.ts`

#### 8.4 Repositories

- [ ] `src/repositories/debts.repository.ts`
  - `create()` - Create debt from PO
  - `getAllByMerchant()`
  - `getById()`
  - `updateStatus()`
  - `getTotalDebt()`
- [ ] `src/repositories/debt-payments.repository.ts`
  - `createPayment()`
  - `getPaymentsByDebt()`

#### 8.5 Services

- [ ] `src/services/debts.service.ts`
  - `createFromPurchaseOrder()` - Auto-create debt on PO
  - `recordPayment()`
  - `getDebtSummary()`
  - `getOverdueDebts()`
  - `getUpcomingPayments()`

#### 8.6 Controllers

- [ ] `src/controllers/debts.controller.ts`

#### 8.7 Routes

- [ ] `src/routes/v1/debts.routes.ts`

### Debt Types

- **SUPPLIER_DEBT**: Debt to suppliers (from POs)
- **OWNER_LOAN**: Owner injecting capital
- **OWNER_WITHDRAWAL**: Owner withdrawing funds

### API Endpoints - Debts

| Method | Endpoint               | Description               |
| ------ | ---------------------- | ------------------------- |
| GET    | /v1/debts              | List debts (with filters) |
| GET    | /v1/debts/:id          | Get debt details          |
| POST   | /v1/debts/:id/payments | Record payment            |
| GET    | /v1/debts/:id/payments | Get payment history       |
| GET    | /v1/debts/summary      | Get debt summary          |
| GET    | /v1/debts/overdue      | Get overdue debts         |

---

## Phase 9: Dashboard & Reporting

**Duration**: 6-7 days  
**Deliverable**: Dashboard API with insights and recommendations

### Tasks

#### 9.1 Types

- [ ] `src/types/dashboard.types.ts`
- [ ] `src/types/reports.types.ts`

#### 9.2 Services

- [ ] `src/services/dashboard.service.ts`
  - `getDashboardSummary()` - Overview metrics
  - `getCashFlowChart()` - Cash flow over time
  - `getStockAlerts()` - Low stock + expiring items
  - `getDebtAlerts()` - Overdue/upcoming debts
  - `getRecommendations()` - AI-like suggestions
- [ ] `src/services/reports.service.ts`
  - `generateStockReport()`
  - `generateFinancialReport()`
  - `generateCOGSReport()` - Cost of goods sold

#### 9.3 Controllers

- [ ] `src/controllers/dashboard.controller.ts`
- [ ] `src/controllers/reports.controller.ts`

#### 9.4 Routes

- [ ] `src/routes/v1/dashboard.routes.ts`
- [ ] `src/routes/v1/reports.routes.ts`

### Dashboard Data Points

```typescript
{
  summary: {
    currentBalance: number,
    totalDebt: number,
    stockValue: number,
    monthlyRevenue: number,
    monthlyExpense: number
  },
  alerts: {
    lowStock: Ingredient[],
    expiringBatches: Batch[],
    overdueDebts: Debt[],
    upcomingPayments: Debt[]
  },
  charts: {
    cashFlow: TimeSeriesData[],
    topExpenses: CategoryData[],
    stockTrend: TimeSeriesData[]
  },
  recommendations: string[]
}
```

### API Endpoints - Dashboard

| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| GET    | /v1/dashboard           | Get dashboard data       |
| GET    | /v1/dashboard/summary   | Get summary metrics      |
| GET    | /v1/dashboard/alerts    | Get all alerts           |
| GET    | /v1/dashboard/cash-flow | Get cash flow chart data |

### API Endpoints - Reports

| Method | Endpoint              | Description               |
| ------ | --------------------- | ------------------------- |
| GET    | /v1/reports/stock     | Generate stock report     |
| GET    | /v1/reports/financial | Generate financial report |
| GET    | /v1/reports/cogs      | Generate COGS report      |

---

## Phase 10: Testing & Documentation

**Duration**: 5-6 days (ongoing throughout)  
**Deliverable**: Comprehensive test suite and API documentation

### Tasks

#### 10.1 Unit Tests

- [ ] `tests/unit/services/auth.service.test.ts`
- [ ] `tests/unit/services/merchants.service.test.ts`
- [ ] `tests/unit/services/ingredients.service.test.ts`
- [ ] `tests/unit/services/purchase-orders.service.test.ts`
- [ ] `tests/unit/services/fifo.service.test.ts`
- [ ] `tests/unit/services/debts.service.test.ts`

#### 10.2 Integration Tests

- [ ] `tests/integration/auth.test.ts`
- [ ] `tests/integration/merchants.test.ts`
- [ ] `tests/integration/suppliers.test.ts`
- [ ] `tests/integration/ingredients.test.ts`
- [ ] `tests/integration/purchase-orders.test.ts`
- [ ] `tests/integration/stock.test.ts`
- [ ] `tests/integration/cash.test.ts`
- [ ] `tests/integration/debts.test.ts`

#### 10.3 Test Infrastructure

- [ ] `tests/fixtures/users.fixture.ts`
- [ ] `tests/fixtures/merchants.fixture.ts`
- [ ] `tests/fixtures/ingredients.fixture.ts`
- [ ] `tests/helpers/test-database.ts` - Test DB setup/teardown

#### 10.4 API Documentation

- [ ] OpenAPI/Swagger specification
- [ ] Postman collection
- [ ] README with setup instructions

#### 10.5 Scripts

- [ ] `scripts/seed.ts` - Seed database with sample data
- [ ] `scripts/reset-db.ts` - Reset database (dev only)

---

## Implementation Timeline

```
Week 1:  [Phase 0] Project Setup
         [Phase 1] Core Infrastructure

Week 2:  [Phase 2] Authentication & User Management
         [Phase 3] Merchant Management (partial)

Week 3:  [Phase 3] Merchant & Supplier Management
         [Phase 4] Ingredient Management (partial)

Week 4:  [Phase 4] Ingredient & Inventory Management
         [Phase 5] Purchase Order System (partial)

Week 5:  [Phase 5] Purchase Order System
         [Phase 6] FIFO Stock Management (partial)

Week 6:  [Phase 6] FIFO Stock Management
         [Phase 7] Cash Flow Management

Week 7:  [Phase 8] Debt Management
         [Phase 9] Dashboard & Reporting (partial)

Week 8:  [Phase 9] Dashboard & Reporting
         [Phase 10] Testing & Documentation

Week 9:  [Phase 10] Testing & Documentation
         Buffer/Polish

Week 10: Final Testing, Bug Fixes, Deployment Prep
```

---

## Database Schema Summary

```sql
-- Core entities
users
merchants
user_merchants (junction)

-- Suppliers
categories
suppliers

-- Inventory
ingredients
ingredient_units
ingredient_batches

-- Procurement
purchase_orders
purchase_items

-- Operations
stock_logs
cash_logs

-- Finance
debts
debt_payments
```

---

## Key Technical Decisions

| Decision                    | Rationale                                             |
| --------------------------- | ----------------------------------------------------- |
| **No ORM**                  | Raw SQL with Bun.SQL for full control and performance |
| **Soft Deletes**            | Data integrity, audit trail, easy recovery            |
| **UUID PKs**                | Distributed-safe, non-sequential                      |
| **JWT Auth**                | Stateless, scalable, mobile-friendly                  |
| **FIFO Costing**            | Accurate COGS for perishable inventory                |
| **Transaction per Request** | Data consistency at service layer                     |

---

## Risk Mitigation

| Risk                   | Mitigation                                  |
| ---------------------- | ------------------------------------------- |
| Complex FIFO logic     | Extensive unit testing, clear documentation |
| Database migrations    | Version-controlled, reversible migrations   |
| Multi-tenancy security | Middleware validation on every request      |
| Performance at scale   | Connection pooling, query optimization      |
| Date/time handling     | Use UTC internally, convert at boundaries   |

---

## Success Criteria

- [ ] All API endpoints return correct responses
- [ ] FIFO calculations are accurate
- [ ] All soft deletes work correctly
- [ ] JWT authentication is secure
- [ ] All tests pass (>80% coverage)
- [ ] Documentation is complete
- [ ] Performance: <200ms for typical requests

---

**Last Updated**: 2026-02-26  
**Plan Version**: 1.0
