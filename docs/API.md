# DineFlow REST API

Base path: `/api`

Collection endpoints accept shared `page`, `pageSize`, `search`, `sortBy`, `sortDir`, `from`, `to`, and `branchId` query parameters where relevant.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Authenticate and issue session/CSRF cookies |
| POST | `/auth/logout` | Clear the session |
| GET | `/auth/session` | Current user and permission set |
| POST | `/auth/forgot-password` | Start simulated reset workflow |
| POST | `/auth/reset-password` | Validate token and change password |

## Operations

| Area | Endpoints |
|---|---|
| Dashboard | `GET /dashboard` |
| Orders | `GET,POST /orders`, `GET,PATCH /orders/:id`, hold, submit, cancel, void, transfer-table and item endpoints |
| Payments | `POST /orders/:id/payments`, `POST /payments/:id/refund`, `POST /payments/:id/void` |
| Kitchen | `GET /kitchen`, `GET /kitchen/stream`, accept, start, ready, serve and item-ready actions |
| Tables | `GET,POST /tables`, `PATCH,DELETE /tables/:id` |
| Reservations | `GET,POST /reservations`, `PATCH /reservations/:id` |
| Delivery | `GET /delivery`, `PATCH /delivery/:id` |

## Catalog and stock

| Area | Endpoints |
|---|---|
| Menu | `GET /menu`, categories, item CRUD and CSV import |
| Inventory | `GET,POST /inventory`, `POST /inventory/movements` |
| Suppliers | `GET,POST /suppliers`, `PATCH,DELETE /suppliers/:id` |
| Purchasing | `GET,POST /purchase-orders`, approve and receive actions |

## CRM, workforce and finance

| Area | Endpoints |
|---|---|
| Customers | `GET,POST /customers`, detail/update/archive and blacklist actions |
| Loyalty | `GET /loyalty`, `POST /loyalty/:customerId/adjust` |
| Employees | `GET,POST /employees`, `PATCH,DELETE /employees/:id` |
| Attendance | `GET,POST /attendance`, `POST /shifts` |
| Register | `GET,POST /register`, movement and close actions |
| Expenses | `GET,POST /expenses`, update/archive and approval actions |
| Reports | `GET /reports` |

## Administration

| Area | Endpoints |
|---|---|
| Branches | `GET,POST /branches`, `PATCH /branches/:id` |
| Users | `GET,POST /users`, `PATCH /users/:id` |
| Settings | `GET,PATCH /settings` |
| Notifications | list, mark one read, mark all read |
| Audit | `GET /audit-log` |

HTTP statuses follow conventional REST semantics: 200 success, 201 created, 401 unauthenticated, 403 unauthorised, 404 missing resource, 409 workflow conflict, 422 validation error, and 429 rate limited.
