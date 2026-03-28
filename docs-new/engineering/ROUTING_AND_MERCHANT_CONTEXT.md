# Routing and Merchant Context

## Route Shape

Merchant-scoped routes use the standard API path plus a merchant header.

Examples:

- `GET /v1/suppliers`
- `POST /v1/ingredients`
- `POST /v1/purchase-orders`

## Merchant Header

Merchant context is passed through:

```text
X-Merchant-ID
```

## Scope Rules

### Public Routes

Do not require JWT or `X-Merchant-ID`.

Examples:

- `POST /auth/register`
- `POST /auth/login`

### Authenticated Non-Merchant Routes

Require JWT, but do not require `X-Merchant-ID`.

Examples:

- `GET /v1/auth/me`
- `PUT /v1/auth/profile`
- `PUT /v1/auth/password`

### Merchant-Scoped Routes

Require both:

- JWT
- `X-Merchant-ID`

Examples:

- suppliers
- ingredients
- purchase orders
- stock
- cash
- debts

## Middleware Contract

The merchant middleware must:

1. read `X-Merchant-ID`
2. validate the header format
3. check that the authenticated user is linked to that merchant
4. store merchant context in request variables

## Repository Contract

Merchant-scoped repository methods must accept `merchantId` explicitly.

Examples:

```ts
getAllByMerchantId(merchantId)
getOneByMerchantAndId(merchantId, id)
insert(db, payload)
```

Merchant scoping must not rely on hidden global state.
