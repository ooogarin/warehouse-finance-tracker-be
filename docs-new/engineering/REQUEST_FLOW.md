# Request Flow

## Public Auth Routes

Examples:

- `POST /auth/register`
- `POST /auth/login`

Flow:

```text
request
-> route validation
-> controller
-> service
-> repository
-> response
```

## Authenticated Non-Merchant Routes

Examples:

- `GET /v1/auth/me`
- `PUT /v1/auth/profile`
- `PUT /v1/auth/password`

Flow:

```text
request
-> authenticate
-> route validation
-> controller
-> service
-> repository
-> response
```

## Merchant-Scoped Routes

Examples:

- `GET /v1/suppliers`
- `POST /v1/ingredients`
- `POST /v1/purchase-orders`

Flow:

```text
request
-> authenticate
-> require merchant header
-> verify merchant access
-> route validation
-> controller
-> service
-> repository
-> response
```

## Controller Rule

Controllers are responsible for:

- reading request params, query, headers, and body
- calling the service layer
- formatting the final HTTP response

Controllers must not contain business rules or SQL.

## Service Rule

Services are responsible for:

- business validation
- orchestration across repositories
- transaction control when needed
- throwing business-level errors

Services must not format HTTP responses.

## Repository Rule

Repositories are responsible for:

- parameterized SQL execution
- row mapping
- explicit tenant filters where required

Repositories must not read Hono context directly.
