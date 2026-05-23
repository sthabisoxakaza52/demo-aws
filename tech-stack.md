# Tech Stack

## Frontend

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR for SEO on public portfolios, RSC for performance |
| Language | **TypeScript** | Type safety across a complex domain model |
| Styling | **Tailwind CSS + shadcn/ui** | Fast, consistent UI with accessible components |
| State Management | **Zustand** | Lightweight, no boilerplate for client state |
| Data Fetching | **TanStack Query** | Caching, background refetch, optimistic updates |
| Charts / KPIs | **Recharts** | Traction milestone visualizations |

---

## Backend

| Layer | Choice | Reason |
|---|---|---|
| Runtime | **Node.js + Express** or **Fastify** | Familiar, fast, large ecosystem |
| Language | **TypeScript** | Shared types with frontend via a monorepo |
| API Style | **REST + tRPC** | REST for public/external, tRPC for internal type-safe calls |
| Auth | **Clerk** or **Auth.js** | Role-based auth (Entrepreneur vs Partner/Investor) out of the box |
| Job Queue | **BullMQ (Redis-backed)** | Async scraping jobs, proposal generation, email notifications |

---

## AI / ML

| Layer | Choice | Reason |
|---|---|---|
| LLM Provider | **OpenAI GPT-4o** | Proposal generation, pitch decks, outreach templates |
| Embeddings | **OpenAI text-embedding-3-small** | Semantic matching for networking recommendations |
| Vector DB | **Pinecone** or **pgvector (Postgres)** | Store and query user/opportunity embeddings |
| Orchestration | **LangChain.js** | Chain prompts for multi-step proposal builder |

---

## Data & Storage

| Layer | Choice | Reason |
|---|---|---|
| Primary DB | **PostgreSQL (RDS / Supabase)** | Relational data: users, profiles, opportunities, milestones |
| Cache | **Redis (ElastiCache)** | Session cache, BullMQ, rate limiting |
| File Storage | **AWS S3** | Pitch decks, portfolio assets, uploaded documents |
| Search | **Elasticsearch** or **Postgres FTS** | Full-text search on funding opportunities and job listings |

---

## LinkedIn / External Data

| Layer | Choice | Reason |
|---|---|---|
| LinkedIn Data | **Proxycurl API** | ToS-compliant LinkedIn profile and job data |
| Enrichment | **Clearbit** or **Apollo.io API** | Company and contact enrichment for lead scoring |
| Web Scraping (fallback) | **Playwright + Bright Data** | For non-LinkedIn public sources (grant sites, RFP boards) |

---

## Infrastructure (AWS Free Tier)

> All services below are available on the [AWS Free Tier](https://aws.amazon.com/free/). Limits noted where relevant.

| Layer | Choice | Free Tier Limit | Notes |
|---|---|---|---|
| **Compute** | **AWS Lambda** | 1M requests / 400K GB-s per month | Wrap Fastify with `@fastify/aws-lambda` — no idle cost |
| **Frontend** | **AWS Amplify Hosting** | 1000 build mins + 15 GB served/month | Replaces Vercel — native Next.js SSR support |
| **API Gateway** | **AWS API Gateway (HTTP API)** | 1M calls/month (12 months) | Routes traffic to Lambda; HTTP API is cheaper than REST API |
| **Database** | **AWS RDS (Postgres) t3.micro** | 750 hrs/month (12 months) | Single-AZ free tier instance; use `db.t3.micro` |
| **Cache / Queue** | **Upstash Redis** (free tier) | 10K commands/day free | ElastiCache has no free tier — Upstash is the practical free alternative for BullMQ |
| **File Storage** | **AWS S3** | 5 GB storage + 20K GET + 2K PUT/month | Free tier covers early-stage asset storage |
| **CDN** | **AWS CloudFront** | 1 TB data transfer + 10M requests/month | Serve S3 assets and frontend via CDN |
| **Secrets** | **AWS Systems Manager Parameter Store** | Free for standard parameters | Replaces Secrets Manager (which charges per secret) |
| **Email** | **AWS SES** | 3,000 messages/month free (in sandbox) | Notification emails for matches, proposals |
| **CI/CD** | **GitHub Actions** | 2,000 mins/month (free tier) | Build, lint, deploy to Lambda via SAM or CDK |
| **Monitoring** | **AWS CloudWatch** | 10 custom metrics + 5 GB logs/month | Free tier covers basic health monitoring |
| **Auth** | **AWS Cognito** | 50,000 MAUs free | Replaces Clerk — handles RBAC with user pool groups |

### Free Tier Gotchas

- **RDS** free tier expires after **12 months** — plan to migrate to Supabase free tier or a `t4g.micro` spot instance after that.
- **Lambda cold starts** can add ~200–500ms latency on first request — use provisioned concurrency (paid) only if needed, or keep functions warm with a scheduled ping.
- **Upstash Redis** free tier caps at 10K commands/day — sufficient for dev/early prod, upgrade to $10/month plan when you scale.
- **SES** starts in sandbox mode (can only send to verified emails) — request production access before launch.

---

## Monorepo Structure

```
apps/
  web/          # Next.js frontend
  api/          # Fastify backend
packages/
  ui/           # Shared shadcn/ui components
  types/        # Shared TypeScript types
  config/       # ESLint, Tailwind, TS configs
```

Tool: **Turborepo** for monorepo orchestration.
