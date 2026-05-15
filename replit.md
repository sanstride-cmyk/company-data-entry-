# DocFlow — AI Document Processing Platform

An enterprise-grade AI Document Processing and ERP/Data Entry Automation platform for Indian businesses. Automates extraction of structured data from invoices, GST bills, purchase orders, delivery challans, and other operational documents — then validates, organizes, and generates ERP-ready exports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/docflow run dev` — run the frontend (port 24257)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter, TanStack Query, shadcn/ui, Recharts, Framer Motion, next-themes
- API: Express 5 (port 8080, path `/api`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle DB schema (vendors, documents, extractions, validations, workflow_tasks, export_jobs, audit_logs)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/docflow/src/pages/` — React pages (dashboard, documents, document-detail, upload, review, workflows, vendors, exports, audit)
- `artifacts/docflow/src/components/` — Layout, Header, Sidebar, ThemeProvider
- `lib/api-client-react/src/generated/` — Generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas for server validation (do not edit)

## Architecture decisions

- Contract-first OpenAPI workflow: spec gates codegen which gates the frontend — no hand-written types
- AI processing is simulated via setTimeout in `documents.ts` route — replace with OpenAI Vision / Google Document AI call in production
- Confidence scores per field stored as JSONB in `extractions.field_confidences`
- Analytics endpoints compute live SQL aggregates — add caching for production scale
- Dark-first design with next-themes toggle; default is dark mode

## Product

- **Smart Upload**: Drag-and-drop, bulk, email, WhatsApp, API ingestion of PDF/image/Excel docs
- **AI Extraction**: Extracts 20+ fields (invoice number, GSTIN, vendor, line items, tax breakdown, etc.) with per-field confidence scores
- **Validation Engine**: Auto-detects GSTIN mismatches, calc errors, duplicates, missing fields, low-confidence extractions
- **Review Dashboard**: Human review queue with priority flags, field editing, approve/reject/comment workflow
- **Workflow Automation**: Approval tasks with assignees, due dates, escalation, audit trail
- **Vendor Management**: Vendor master with GSTIN, PAN, category, document count
- **ERP Export**: SAP, Tally, Zoho, Oracle, Busy, Excel, CSV, JSON, Google Sheets with custom field mapping
- **Analytics**: KPI cards, processing volume chart, accuracy metrics, vendor breakdown, doc type breakdown

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always re-run `pnpm --filter @workspace/api-spec run codegen` before coding against new types
- `confidence_score` is stored as `numeric` in Postgres and comes back as a string — always `parseFloat()` it in routes
- The `lineItems` and `fieldConfidences` columns are JSONB — cast them in route handlers
- Seed data uses realistic Indian business names, GSTIN formats, and INR amounts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
