# DineFlow POS – Restaurant Management System

DineFlow POS is a production-style, full-stack restaurant point-of-sale and management platform. It combines front-of-house ordering, kitchen operations, stock control, purchasing, CRM, workforce management, finance, and multi-branch reporting in one responsive application.

Built as a commercial-quality portfolio project with realistic restaurant workflows—not a static dashboard template.

## Highlights

- Fast desktop/tablet POS with modifiers, notes, discounts, held orders, split/partial payments, refunds, voids, receipts, PDF invoices, and kitchen submission
- Real-time kitchen display with station filters, ticket timers, item readiness, cancellation reasons, and service workflow
- Dashboard with sales, expenses, profit, order mix, top products, low stock, peak periods, and branch/date filters
- Visual table management and conflict-aware reservations
- Menu, category, modifier, ingredient, recipe, supplier, purchase-order, receiving, stock-count, adjustment, and wastage workflows
- Customer CRM, behavioural segments, loyalty tiers, points ledger, customer restrictions, and order history
- Employee profiles, salary-field permissions, attendance, shift scheduling, expenses, approvals, and cash-register reconciliation
- Delivery dispatch, driver assignment, multi-branch management, user roles, restaurant settings, notifications, and audit trail
- Sales/profit/payment/product reports with date filters and CSV export
- Responsive light/dark interface with role-based navigation and accessible controls

## Technology

- Next.js 15 App Router, React 19, TypeScript
- Tailwind CSS 4, Radix/shadcn-style components, Lucide icons
- TanStack Table, Recharts, Framer Motion, Zustand
- MongoDB 7, Mongoose 8, transactions and indexed schemas
- Signed HTTP-only JWT sessions with `jose`, bcrypt password hashing, CSRF double-submit protection, rate limiting, input sanitisation, and RBAC
- Zod validation and consistent REST response envelopes
- Vitest and Playwright

## Architecture

```text
Browser
  └─ Next.js App Router
      ├─ Server layouts + middleware authentication
      ├─ Responsive client workflows
      └─ REST route handlers
          ├─ authentication / permission / CSRF guards
          ├─ Zod request validation
          ├─ domain services and pricing engine
          └─ Mongoose models → MongoDB replica set
```

Important directories:

```text
src/
  app/                 Pages and REST route handlers
  components/          Layout, design system, charts and shared UI
  constants/           Roles, permissions and domain enumerations
  lib/                 Auth, API infrastructure, money and pricing
  models/              Mongoose schemas and indexes
  services/            Domain workflows
  store/               POS cart state
  validators/          Zod input contracts
scripts/
  seed.ts              Complete deterministic demo database
tests/                 Unit tests
e2e/                   Browser smoke tests
docs/                  API and screenshot documentation
```

## Roles

| Role | Primary access |
|---|---|
| Super Admin | Platform-wide administration |
| Restaurant Owner | All restaurant branches, finance, settings, and users |
| Manager | Daily operations, approvals, staff, inventory, and reports |
| Cashier | POS, payments, customer lookup, and register |
| Waiter | Tables, reservations, ordering, and kitchen status |
| Kitchen Staff | Kitchen display and inventory visibility |
| Accountant | Financial dashboard, expenses, registers, and reports |

Salary fields, refund/void controls, approvals, and administrative settings are protected by dedicated permissions.

## Local installation

Requirements: Node.js 20+, Docker Desktop, and npm.

```bash
npm install
copy .env.example .env.local
npm run db:up
npm run seed
npm run dev
```

Open `http://localhost:3000`.

On macOS/Linux, use `cp .env.example .env.local`.

The local MongoDB container runs as a single-node replica set on port `27018`, allowing transactional order/payment/inventory operations.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | admin@dineflow.com | Admin@123 |
| Owner | owner@dineflow.com | Owner@123 |
| Manager | manager@dineflow.com | Manager@123 |
| Cashier | cashier@dineflow.com | Cashier@123 |
| Waiter | waiter@dineflow.com | Waiter@123 |
| Kitchen | kitchen@dineflow.com | Kitchen@123 |
| Accountant | accountant@dineflow.com | Accountant@123 |

These credentials are for seeded demonstration environments only.

## Environment variables

Copy [.env.example](.env.example). The essential variables are:

```env
MONGODB_URI=mongodb://127.0.0.1:27018/dineflow?replicaSet=rs0&directConnection=true
AUTH_SECRET=<64-byte-random-hex>
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=true
PAYMENT_DRIVER=demo
MAIL_DRIVER=log
```

Never commit `.env.local` or production secrets.

## Commands

```bash
npm run dev          # Development server
npm run build        # Production compilation
npm run start        # Production server
npm run typecheck    # Strict TypeScript
npm run lint         # ESLint with zero-warning policy
npm test             # Unit tests
npm run test:e2e     # Playwright desktop and mobile smoke tests
npm run seed         # Seed an empty database
npm run seed:reset   # Replace demo data
npm run db:up        # Start MongoDB
npm run db:down      # Stop containers
```

The seed includes one restaurant, three branches, seven roles, employee accounts, 60+ products, recipes, 30+ ingredients, suppliers, purchases, 50+ orders, payments, expenses, bookings, loyalty activity, notifications, attendance, shifts, and cash registers.

## API

All protected endpoints require the signed session cookie. Mutating browser requests also require the CSRF cookie value in `x-csrf-token`. Responses use:

```json
{ "success": true, "data": {}, "meta": {} }
```

or:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." } }
```

See [docs/API.md](docs/API.md) for the endpoint map.

## Testing

The unit suite covers exact money allocation, rounding, discounts, taxes, service charges, payment progress, role boundaries, and order-state transitions. Playwright checks the public landing and login path in desktop and mobile viewports.

For a release:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Deployment

### Vercel + MongoDB Atlas

1. Create an Atlas cluster and database user.
2. Set `MONGODB_URI`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, and other required variables in Vercel.
3. Set `NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS=false` for a private production installation.
4. Deploy the repository. Do not run the reset seed command against live customer data.

### Docker

```bash
docker compose up -d mongo
docker compose --profile app up -d --build
```

The included multi-stage [Dockerfile](Dockerfile) produces the Next.js standalone server.

## Security notes

- Passwords are bcrypt-hashed and never selected by default.
- Sessions are signed, expiring, HTTP-only, and SameSite cookies.
- Mutations use CSRF double-submit verification.
- Login lockout and route-specific rate limits reduce brute-force risk.
- Mongo operator keys are removed before validation.
- API actions enforce granular permissions and branch scope.
- Sensitive salary fields are omitted unless `employee:view_salary` is granted.
- Audit logs preserve important activity context.

For internet-facing use, replace the in-memory rate limiter with Redis, configure a production email provider, rotate secrets, restrict Atlas networks, and use a sandbox/live payment adapter appropriate to the deployment.

## Screenshots

The recommended portfolio capture order and viewport sizes are listed in [docs/SCREENSHOTS.md](docs/SCREENSHOTS.md).

## Future improvements

- Hardware printer and cash-drawer adapters
- Optional Stripe Terminal and delivery-provider integrations
- Redis-backed distributed rate limits and event fan-out
- Offline-first cashier queue and conflict resolution
- Native mobile waiter application

## Portfolio copy

**GitHub description:** Full-stack multi-branch restaurant POS with kitchen display, inventory, CRM, workforce, payments, reporting, RBAC, MongoDB, and Next.js.

**Portfolio description:** Designed and developed a commercial-style restaurant operating platform covering the complete order lifecycle—from cashier and table service through kitchen production, payment, stock deduction, loyalty, workforce controls, and multi-branch analytics.

**Freelancer gig title:** I will build a custom restaurant POS, kitchen display and inventory management system

**Gig summary:** I develop responsive restaurant software including cashier POS, kitchen tickets, table and reservation management, recipes and inventory, supplier purchasing, receipts, CRM, staff access, expenses, and business reporting. The architecture can be customised for single or multi-branch restaurants.

## Licence

MIT. See [LICENSE](LICENSE).
