# Tech Stack

## Overview

This project uses a modern, lightweight tech stack optimized for performance and developer experience.

---

## Core Technologies

| Technology     | Purpose                      | Version |
| -------------- | ---------------------------- | ------- |
| **Bun**        | JavaScript runtime & toolkit | Latest  |
| **Hono**       | Web framework                | Latest  |
| **PostgreSQL** | Relational database          | 15+     |
| **TypeScript** | Type-safe JavaScript         | 5+      |
| **Zod**        | Runtime type validation      | Latest  |

---

## Why This Stack?

### Bun

- **Fast**: Native TypeScript support, no transpilation needed
- **All-in-one**: Built-in test runner, bundler, package manager
- **Compatible**: Drop-in replacement for Node.js
- **Built-in modules**: `SQL`, `JWT`, `bcrypt`, `dotenv`, `uuid` - no external packages needed

### Hono

- **Lightweight**: ~14KB bundle size
- **Type-safe**: Full TypeScript support with type inference
- **Middleware**: Rich middleware ecosystem
- **Edge-ready**: Works onBun

### PostgreSQL

- **Reliable**: Battle-tested RDBMS
- **Feature-rich**: JSON support, full-text search, transactions
- **Raw SQL**: Full control over queries, no ORM overhead

### TypeScript

- **Type safety**: Catch errors at compile time
- **IDE support**: Autocomplete, refactoring
- **Documentation**: Types serve as inline docs

### Zod

- **Runtime validation**: Validate inputs at runtime
- **Type inference**: Auto-generate TypeScript types from schemas
- **Composable**: Build complex schemas from simple ones

### Hashing

- **bcrypt**: Password hashing by Bun
- **JWT**: JSON Web Token for authentication by Hono

---

## Built-in Bun Modules Used

Instead of installing external packages, we leverage Bun's built-in modules:

```typescript
// ✅ Use Bun's built-in alternatives
import { password, JWT } from "bun"; // Built-in password and JWT handling
const uuid = crypto.randomUUID(); // Built-in Web Crypto API
const env = process.env; // Bun loads .env automatically
import { SQL } from "bun"; // Built-in SQL client

// ❌ Don't install these
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
import pg from "pg";
```

---

## External Dependencies

### Production Dependencies

```json
{
  "hono": "^4.x.x", // Web framework
  "zod": "^3.x.x", // Validation
  "pino": "^8.x.x", // Logging
  "pino-pretty": "^10.x.x" // Pretty logs (dev)
}
```

### Development Dependencies

```json
{
  "typescript": "^5.x.x", // TypeScript compiler
  "@types/bun": "latest", // Bun type definitions
  "biome": "^1.x.x" // Linter & formatter
}
```

---

## Database Stack

```
┌─────────────────────────────────────────┐
│           Application Layer             │
│  (Bun + Hono + TypeScript + Zod)        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Database Layer                │
│  PostgreSQL 15+ with Raw SQL            │
│  (No ORM - Direct query control)        │
└─────────────────────────────────────────┘
```

### Why Raw SQL over ORM?

| Aspect         | Raw SQL              | ORM                     |
| -------------- | -------------------- | ----------------------- |
| Performance    | Full control         | Abstraction overhead    |
| Debugging      | Direct queries       | Generated queries       |
| Learning curve | SQL knowledge needed | Framework-specific      |
| Flexibility    | Any query possible   | Limited by ORM features |
| Bundle size    | Zero overhead        | Significant             |

---

## Development Tools

### Biome

- **Linter**: Code quality checks
- **Formatter**: Consistent code style
- **Import sorter**: Automatic import organization

### Bun Test

- **Unit tests**: Fast, native test runner
- **Integration tests**: Full API testing
- **Mocking**: Built-in mock support

---

## Version Requirements

```bash
# Minimum versions
bun >= 1.0.0
postgresql >= 15
typescript >= 5.0

# Recommended versions
bun >= 1.1.0 (latest)
postgresql >= 16
typescript >= 5.3
```

---
