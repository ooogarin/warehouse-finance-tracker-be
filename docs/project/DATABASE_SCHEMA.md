# Database Schema - Aplikasi Manajemen Stok & Keuangan Resto (V1.0)

## 1. Master Tables

### `users`

#### Create Type

```sql
CREATE TYPE user_role AS ENUM (
    'owner',
    'staff',
    'cashier'
);
```

#### Create Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'owner',
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);

```

#### Create Index

```sql
CREATE UNIQUE INDEX idx_users_email_unique
    ON users(email)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_users_deleted_at
    ON users(deleted_at)
    WHERE deleted_at IS NULL;

```

---

### `merchants`

#### Create Type

```sql
CREATE TYPE merchant_type AS ENUM (
    'restaurant',
    'cafe',
    'catering',
    'other'
);
```

#### Create Table

```sql
CREATE TABLE merchants (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type merchant_type DEFAULT 'restaurant',
    address TEXT,
    phone VARCHAR(20),
    cash_balance DECIMAL(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL
);
```

#### Create Index

```sql
CREATE INDEX idx_merchants_deleted_at
    ON merchants(deleted_at)
    WHERE deleted_at IS NULL;
```

---

### `user_merchants`

#### Create Table

```sql
CREATE TABLE user_merchants (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT unique_user_merchant UNIQUE(user_id, merchant_id),
    CONSTRAINT fk_user_merchants_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_merchants_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
);
```

#### Create Index

```sql
CREATE INDEX idx_user_merchants_merchant_id
    ON user_merchants(merchant_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_user_merchants_user_id
    ON user_merchants(user_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_user_merchants_merchant_user
    ON user_merchants(merchant_id, user_id)
    WHERE deleted_at IS NULL;
```

---

### `suppliers`

#### Create Table

```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_suppliers_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
);

```

#### Create Index

```sql
CREATE INDEX idx_suppliers_merchant_id
    ON suppliers(merchant_id)
    WHERE deleted_at IS NULL;
```

---

### `ingredients`

#### Create Type

```sql
CREATE TYPE ingredient_category AS ENUM (
    'vegetables',
    'meat',
    'seafood',
    'spices',
    'oil',
    'grains',
    'liquid',
    'other'
);
```

#### Create Table

```sql
CREATE TABLE ingredients (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    category ingredient_category DEFAULT 'other',
    base_unit VARCHAR(50) NOT NULL,
    stock_quantity DECIMAL(12,3) NOT NULL DEFAULT 0,
    min_stock DECIMAL(12,3) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_stock_positive CHECK (stock_quantity >= 0),
    CONSTRAINT fk_ingredients_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
);
```

#### Create Index

```sql
CREATE UNIQUE INDEX idx_ingredients_merchant_name_unique
    ON ingredients(merchant_id, name);

CREATE INDEX idx_ingredients_merchant_category
    ON ingredients(merchant_id, category);

CREATE INDEX idx_ingredients_merchant_stock
    ON ingredients(merchant_id, stock_quantity)
    WHERE stock_quantity <= min_stock;

```

---

### `ingredient_units`

#### Create Table

```sql
CREATE TABLE ingredient_units (
    id UUID PRIMARY KEY,
    ingredient_id UUID NOT NULL,
    unit_name VARCHAR(50) NOT NULL,
    conversion_factor DECIMAL(12,3) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    description VARCHAR(200),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_ingredient_unit UNIQUE(ingredient_id, unit_name),
    CONSTRAINT check_conversion_positive CHECK (conversion_factor > 0),
    CONSTRAINT fk_ingredient_units_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
);
```

#### Create Index

```sql
CREATE UNIQUE INDEX idx_ingredient_units_merchant_name_unique
    ON ingredient_units(ingredient_id, unit_name);

CREATE INDEX idx_ingredient_units_ingredient_id
    ON ingredient_units(ingredient_id)
    WHERE deleted_at IS NULL;
```

---

### `ingredient_batches`

#### Create Table

```sql
CREATE TABLE ingredient_batches (
    id UUID PRIMARY KEY,
    ingredient_id UUID NOT NULL,
    qty_initial DECIMAL(12,3) NOT NULL,
    qty_remaining DECIMAL(12,3) NOT NULL,
    cost_per_unit DECIMAL(12,3) NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT check_qty_positive CHECK (qty_initial > 0),
    CONSTRAINT check_qty_remaining_positive CHECK (qty_remaining >= 0),
    CONSTRAINT check_cost_per_unit_positive CHECK (cost_per_unit > 0),
    CONSTRAINT fk_ingredient_batches_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT
);
```

#### Create Index

```sql
CREATE INDEX idx_ingredient_batches_fifo
    ON ingredient_batches(ingredient_id, purchase_date)
    WHERE deleted_at IS NULL AND qty_remaining > 0;
```

---

## 2. Transaction Tables

### `purchase_orders`

#### Create Table

```sql
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    supplier_id UUID,
    invoice_number VARCHAR(50) NOT NULL,
    total_amount DECIMAL(15,3) NOT NULL,
    paid_cash DECIMAL(15,3) NOT NULL DEFAULT 0,
    paid_owner DECIMAL(15,3) NOT NULL DEFAULT 0,
    debt_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT check_payment_balance
        CHECK (paid_cash + paid_owner + debt_amount = total_amount),
    CONSTRAINT check_amounts_positive
        CHECK (paid_cash >= 0 AND paid_owner >= 0 AND debt_amount >= 0),
    CONSTRAINT fk_purchase_orders_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_orders_suppliers FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

```

#### Create Index

```sql
CREATE INDEX idx_purchase_orders_merchant_date
    ON purchase_orders(merchant_id, purchase_date DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_purchase_orders_merchant_invoice
    ON purchase_orders(merchant_id, invoice_number)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_purchase_orders_merchant_supplier_date
    ON purchase_orders(merchant_id, supplier_id, purchase_date DESC)
    WHERE deleted_at IS NULL;
```

---

### `purchase_order_items`

#### Create Table

```sql
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY,
    purchase_order_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    quantity DECIMAL(12,3) NOT NULL, -- 2
    ingredient_unit_id UUID NOT NULL, -- kg
    unit_price DECIMAL(15,3) NOT NULL, -- 12000
    subtotal DECIMAL(15,3) GENERATED ALWAYS AS (quantity * unit_price) STORED, -- 24000
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_price_positive CHECK (unit_price >= 0),
    CONSTRAINT fk_purchase_order_items_purchase_orders FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_items_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_purchase_order_items_ingredient_units FOREIGN KEY (ingredient_unit_id) REFERENCES ingredient_units(id) ON DELETE RESTRICT
);

```

#### Create Index

```sql
CREATE INDEX idx_purchase_order_items_purchase_order_id
    ON purchase_order_items(purchase_order_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_purchase_order_items_ingredient_id
    ON purchase_order_items(ingredient_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_purchase_order_items_purchase_order_ingredient
    ON purchase_order_items(purchase_order_id, ingredient_id)
    WHERE deleted_at IS NULL;
```

---

### `stock_usages`

#### Create Type

```sql
CREATE TYPE stock_usage_type AS ENUM (
    'usage',      -- Barang dipakai
    'waste'       -- Barang rusak/expired
);
```

#### Create Table

```sql
CREATE TABLE stock_usages (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    usage_date TIMESTAMPTZ NOT NULL,
    type stock_usage_type NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_stock_usages_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
);

```

#### Create Index

```sql
CREATE INDEX idx_stock_usages_merchant_date
    ON stock_usages(merchant_id, usage_date DESC)
    WHERE deleted_at IS NULL;
```

---

### `stock_usage_items`

#### Create Table

```sql
CREATE TABLE stock_usage_items (
    id UUID PRIMARY KEY,
    stock_usage_id UUID NOT NULL,
    ingredient_id UUID NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    ingredient_unit_id UUID NOT NULL,
    unit_price DECIMAL(15,3) NOT NULL,
    subtotal DECIMAL(15,3) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_price_positive CHECK (unit_price >= 0),
    CONSTRAINT fk_stock_usage_items_stock_usages FOREIGN KEY (stock_usage_id) REFERENCES stock_usages(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_usage_items_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_usage_items_ingredient_units FOREIGN KEY (ingredient_unit_id) REFERENCES ingredient_units(id) ON DELETE RESTRICT
);

```

#### Create Index

```sql
CREATE INDEX idx_stock_usage_items_stock_usage_id
    ON stock_usage_items(stock_usage_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_stock_usage_items_ingredient_id
    ON stock_usage_items(ingredient_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_stock_usage_items_stock_usage_ingredient
    ON stock_usage_items(stock_usage_id, ingredient_id)
    WHERE deleted_at IS NULL;
```

---

### `stock_adjustments`

#### Create Table
```sql
CREATE TABLE stock_adjustments (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    adjustment_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT fk_stock_adjustments_merchants FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT
);
```

#### Create Index
```sql
CREATE INDEX idx_stock_adjustments_merchant_date
    ON stock_adjustments(merchant_id, adjustment_date DESC)
    WHERE deleted_at IS NULL;
```

---

### `stock_adjustment_items`

#### Create Type
```sql
CREATE TYPE stock_adjustment_flow_type AS ENUM (
    'in',   -- Koreksi tambah (stok fisik lebih dari sistem)
    'out'   -- Koreksi kurang (stok fisik kurang dari sistem)
);
```

#### Create Table
```sql
CREATE TABLE stock_adjustment_items (
    id UUID PRIMARY KEY,
    stock_adjustment_id UUID NOT NULL,
    flow_type stock_adjustment_flow_type NOT NULL,
    ingredient_id UUID NOT NULL,
    quantity DECIMAL(12,3) NOT NULL,
    ingredient_unit_id UUID NOT NULL,
    unit_price DECIMAL(15,3) NOT NULL,
    subtotal DECIMAL(15,3) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT check_quantity_positive CHECK (quantity > 0),
    CONSTRAINT check_price_positive CHECK (unit_price >= 0),
    CONSTRAINT fk_stock_adjustment_items_stock_adjustments FOREIGN KEY (stock_adjustment_id) REFERENCES stock_adjustments(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_adjustment_items_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_adjustment_items_ingredient_units FOREIGN KEY (ingredient_unit_id) REFERENCES ingredient_units(id) ON DELETE RESTRICT
);
```

#### Create Index
```sql
CREATE INDEX idx_stock_adjustment_items_stock_adjustment_id
    ON stock_adjustment_items(stock_adjustment_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_stock_adjustment_items_ingredient_id
    ON stock_adjustment_items(ingredient_id)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_stock_adjustment_items_stock_adjustment_ingredient
    ON stock_adjustment_items(stock_adjustment_id, ingredient_id)
    WHERE deleted_at IS NULL;
```

---

## 3. Log Tables

### `stock_logs`

#### Create Type

```sql
CREATE TYPE stock_log_flow_type AS ENUM (
    'in',
    'out'
);
```

```sql
CREATE TYPE stock_log_reference_type AS ENUM (
    -- IN
    'purchase',     -- Pembelian

    -- OUT
    'usage',        -- Penggunaan
    'waste',        -- Terbuang

    -- ADJUST
    'adjustment'    -- Penyesuaian
);
```

#### Create Table

```sql
CREATE TABLE stock_logs (
    id UUID PRIMARY KEY,
    ingredient_id UUID NOT NULL,
    flow_type stock_log_flow_type NOT NULL,
    base_unit_quantity DECIMAL(12,3) NOT NULL,
    base_unit_price DECIMAL(15,3) NOT NULL,
    total_amount DECIMAL(15,3) GENERATED ALWAYS AS (base_unit_quantity * base_unit_price) STORED,
    notes TEXT,
    balance_after DECIMAL(15,3),
    reference_id UUID,
    reference_type stock_log_reference_type NOT NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_base_unit_quantity_positive CHECK (base_unit_quantity > 0),
    CONSTRAINT fk_stock_logs_ingredients FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE RESTRICT,
    CONSTRAINT fk_stock_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Create Index

```sql
CREATE INDEX idx_stock_logs_ingredient
    ON stock_logs(ingredient_id, created_at DESC);
CREATE INDEX idx_stock_logs_flow_type
    ON stock_logs(flow_type);
CREATE INDEX idx_stock_logs_reference_type
    ON stock_logs(reference_type, reference_id);
```

---

### `cash_logs`

#### Create Type

```sql
CREATE TYPE cash_log_flow_type AS ENUM (
    'in',
    'out'
);
```

```sql
CREATE TYPE cash_log_category AS ENUM (
    -- IN
    'sales_revenue',      -- Hasil penjualan
    'capital_injection',  -- Setoran modal owner
    'debt_repayment_in',  -- Pembayaran utang dari customer (jika ada)
    'other_in',

    -- OUT
    'purchase_payment',   -- Bayar belanja bahan
    'debt_payment_out',   -- Bayar utang ke supplier
    'owner_withdrawal',   -- Ambil pribadi (PENTING!)
    'salary',             -- Gaji karyawan
    'utilities',          -- Listrik, air, gas
    'rent',               -- Sewa tempat
    'maintenance',        -- Service, perbaikan
    'other_out'
);

CREATE TYPE cash_log_reference_type AS ENUM (
    'purchase_order',     -- Dari purchase_orders
    'debt_payment'        -- Dari debt_payments
);
```

#### Create Table

```sql
CREATE TABLE cash_logs (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    flow_type cash_log_flow_type NOT NULL,
    cash_log_date TIMESTAMPTZ NOT NULL,
    amount DECIMAL(15,3) NOT NULL,
    category cash_log_category NOT NULL,
    description TEXT,
    balance_after DECIMAL(15,3),
    reference_id UUID,
    reference_type cash_log_reference_type NULL,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_amount_positive CHECK (amount > 0),
    CONSTRAINT check_reference_consistency
      CHECK ((reference_id IS NULL AND reference_type IS NULL) OR (reference_id IS NOT NULL AND reference_type IS NOT NULL)),
    CONSTRAINT fk_cash_logs_merchant_id FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_cash_logs_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Create Index

```sql
CREATE INDEX idx_cash_logs_merchant
    ON cash_logs(merchant_id, created_at DESC);
CREATE INDEX idx_cash_logs_category
    ON cash_logs(category, created_at DESC);
CREATE INDEX idx_cash_logs_flow
    ON cash_logs(flow_type, created_at DESC);
```

---

### `debts`

#### Create Type

```sql
CREATE TYPE debt_creditor_type AS ENUM (
    'owner',
    'supplier',
    'other'
);
```

```sql
CREATE TYPE debt_status AS ENUM (
    'unpaid',
    'partial',
    'paid'
);
```

#### Create Table

```sql
CREATE TABLE debts (
    id UUID PRIMARY KEY,
    merchant_id UUID NOT NULL,
    creditor_type debt_creditor_type NOT NULL,
    supplier_id UUID,
    creditor_name VARCHAR(100),
    purchase_order_id UUID,
    total_amount DECIMAL(15,3) NOT NULL,
    paid_amount DECIMAL(15,3) NOT NULL DEFAULT 0,
    status debt_status NOT NULL DEFAULT 'unpaid',
    debt_date DATE NOT NULL,
    due_date DATE,
    paid_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT check_amounts CHECK (paid_amount >= 0 AND paid_amount <= total_amount),
    CONSTRAINT fk_debts_merchant_id FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE RESTRICT,
    CONSTRAINT fk_debts_supplier_id FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
    CONSTRAINT fk_debts_purchase_order_id FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE SET NULL
);
```

#### Create Index

```sql
CREATE INDEX idx_debts_merchant_id
    ON debts(merchant_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_debts_status
    ON debts(status, due_date)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_debts_supplier_id
    ON debts(supplier_id)
    WHERE deleted_at IS NULL;
CREATE INDEX idx_debts_overdue
    ON debts(merchant_id, status)
    WHERE status = 'overdue' AND deleted_at IS NULL;
```

---

### `debt_payments`

#### Create Type

```sql
CREATE TYPE debt_payment_method AS ENUM (
    'cash',
    'transfer',
    'other'
);
```

#### Create Table

```sql
CREATE TABLE debt_payments (
    id UUID PRIMARY KEY,
    debt_id UUID NOT NULL,
    amount DECIMAL(15,3) NOT NULL,
    payment_method debt_payment_method NOT NULL,
    reference_number VARCHAR(50),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_payment_positive CHECK (amount > 0),
    CONSTRAINT fk_debt_payments_debt_id FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE RESTRICT,
    CONSTRAINT fk_debt_payments_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

#### Create Index

```sql
CREATE INDEX idx_debt_payments_debt_id
    ON debt_payments(debt_id, created_at DESC);
```

---
