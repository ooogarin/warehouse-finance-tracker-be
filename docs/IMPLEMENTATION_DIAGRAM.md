# Implementation Plan - Visual Diagram

## Phase Dependencies

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 0: PROJECT SETUP                          │
│                    (Bootstrap, Config, Environment)                     │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PHASE 1: CORE INFRASTRUCTURE                      │
│              (Database, Middleware, Error Handling, Utils)              │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ▼                                       ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│   PHASE 2: AUTHENTICATION     │       │    PHASE 3a: MERCHANTS        │
│   (Register, Login, JWT)      │◄──────┤    (Multi-tenancy base)       │
│                               │       │                               │
└───────────────┬───────────────┘       └───────────────────────────────┘
                │                                       │
                │                                       ▼
                │                       ┌───────────────────────────────┐
                │                       │    PHASE 3b: SUPPLIERS        │
                │                       │    (Supplier management)      │
                │                       └───────────────────────────────┘
                │                                       │
                └───────────────────┬───────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   PHASE 4: INGREDIENT MANAGEMENT                        │
│            (Catalog, Units, Categories, Stock Levels)                   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     PHASE 5: PURCHASE ORDER SYSTEM                      │
│              (PO workflow, Approval, Status management)                 │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
              ┌───────────────────┴───────────────────┐
              │                                       │
              ▼                                       ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│   PHASE 6: FIFO STOCK MGMT    │       │    PHASE 7: CASH FLOW         │
│   (Batch tracking, COGS)      │       │    (Income, Expense tracking) │
│                               │       │                               │
└───────────────┬───────────────┘       └───────────────┬───────────────┘
                │                                       │
                │                                       │
                └───────────────────┬───────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PHASE 8: DEBT MANAGEMENT                          │
│               (Supplier debts, Owner loans/withdrawals)                 │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 9: DASHBOARD & REPORTING                       │
│              (Analytics, Insights, Charts, Alerts)                      │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    PHASE 10: TESTING & DOCUMENTATION                    │
│                 (Unit tests, Integration tests, Docs)                   │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Route     │────▶│  Controller │────▶│   Service   │
│  (Request)  │     │  (Hono)     │     │  (Extract)  │     │  (Business) │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │◄────│   Error     │◄────│  Response   │◄────│ Repository  │
│  (Response) │     │  Handler    │     │   (JSON)    │     │   (SQL)     │
└─────────────┘     └─────────────┘     └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │ PostgreSQL  │
                                                            │  (Bun.SQL)  │
                                                            └─────────────┘
```

## Entity Relationship Overview

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│     users       │◄───────►│  user_merchants │◄───────►│    merchants    │
│   (auth)        │    M:N  │   (junction)    │   M:N   │  (multi-tenant) │
└─────────────────┘         └─────────────────┘         └───────┬─────────┘
                                                                │
                    ┌────────────┬────────────┬─────────────────┼────────────┐
                    │            │            │                 │            │
                    ▼            ▼            ▼                 ▼            ▼
            ┌───────────┐ ┌───────────┐ ┌───────────┐    ┌───────────┐ ┌───────────┐
            │ suppliers │ │categories │ │ingredients│    │cash_logs  │ │  debts    │
            │           │ │           │ │           │    │           │ │           │
            └───────────┘ └───────────┘ └─────┬─────┘    └───────────┘ └─────┬─────┘
                                              │                              │
                                              ▼                              ▼
                                        ┌───────────┐                   ┌───────────┐
                                        │  batches  │                   │debt_pays  │
                                        │  (FIFO)   │                   │           │
                                        └───────────┘                   └───────────┘
                                              │
                                              ▼
                                        ┌───────────┐
                                        │stock_logs │
                                        │ (audit)   │
                                        └───────────┘
                                              │
                                              ▼
                                        ┌───────────┐
                                        │purchase_* │
                                        │ (orders)  │
                                        └───────────┘
```

## Request Flow Example (Create Purchase Order)

```
1. Client Request
   POST /v1/purchase-orders
   Authorization: Bearer <JWT>
   X-Merchant-ID: <merchant-uuid>
   Body: { supplierId, items: [...] }

         │
         ▼
2. Route Layer (Hono)
   └─▶ auth.middleware.ts      → Validate JWT
   └─▶ merchant.middleware.ts  → Load merchant context
   └─▶ validation.middleware.ts → Validate body with Zod
   └─▶ purchaseOrdersController.create()

         │
         ▼
3. Controller
   └─▶ Extract: userId, merchantId, body
   └─▶ Call: purchaseOrdersService.create(data)

         │
         ▼
4. Service
   └─▶ Validate supplier exists
   └─▶ Validate ingredients belong to merchant
   └─▶ Calculate totals
   └─▶ Start Transaction
   └─▶ Call: purchaseOrdersRepository.create()
   └─▶ Call: purchaseItemsRepository.createMany()
   └─▶ Commit Transaction
   └─▶ Return raw PO data

         │
         ▼
5. Controller (continued)
   └─▶ Call: successResponse({ data: poData, statusCode: 201 })

         │
         ▼
6. Response
   HTTP 201 Created
   {
     "success": true,
     "data": { "id": "...", "status": "DRAFT", ... },
     "meta": { "requestId": "...", "timestamp": "..." }
   }
```

## Testing Strategy Overview

```
┌───────────────────────────────────────────────────────────────────────┐
│                         TEST PYRAMID                                  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│     ┌─────────────────────────────────────────────────────────┐       │
│     │                  E2E Tests (10%)                        │       │
│     │            (Full API flows, Happy paths)                │       │
│     └─────────────────────────────────────────────────────────┘       │
│                              ▲                                        │
│     ┌────────────────────────┴─────────────────────────┐              │
│     │              Integration Tests (30%)             │              │
│     │     (Multi-layer testing, Database involved)     │              │
│     └──────────────────────────────────────────────────┘              │
│                              ▲                                        │
│     ┌────────────────────────┴─────────────────────────┐              │
│     │                Unit Tests (60%)                  │              │
│     │     (Services, Utilities, Business logic)        │              │
│     └──────────────────────────────────────────────────┘              │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

Test Database: warehouse_test
- Isolated from development/production
- Reset before each test run
- Fixtures for consistent test data
```

## Deployment Pipeline (Future)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   Code   │───▶│   Lint   │───▶│   Test   │───▶│  Build   │───▶│  Deploy  │
│  Push    │    │  Check   │    │   Run    │    │  Image   │    │  Cloud   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │               │
     │               │               │               │               │
     ▼               ▼               ▼               ▼               ▼
  GitHub         Biome CI      Bun Test           Docker          Fly.io/
  Actions        (Linting)  (Unit + Integration)  (Build)         Railway/
                                                                  Render
```
