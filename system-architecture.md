# System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                │
│         Browser (Next.js)        Mobile (future)               │
└───────────────────────┬─────────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────────┐
│                     CDN + API GATEWAY                           │
│           AWS CloudFront + AWS API Gateway (HTTP API)           │
└───────────┬───────────────────────────┬─────────────────────────┘
            │                           │
┌───────────▼──────────┐   ┌────────────▼────────────┐
│   Next.js Frontend   │   │    Fastify REST API      │
│  (AWS Amplify        │   │    (AWS Lambda via       │
│   Hosting)           │   │  @fastify/aws-lambda)    │
│                      │   │                          │
│  - Public portfolios │   │  - Auth (AWS Cognito)    │
│  - Dashboard UI      │   │  - User profiles         │
│  - KPI charts        │   │  - Opportunity CRUD      │
│  - Pitch deck viewer │   │  - tRPC internal routes  │
└──────────────────────┘   └────────────┬─────────────┘
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              │                         │                          │
┌─────────────▼──────┐   ┌─────────────▼──────┐   ┌──────────────▼──────┐
│   PostgreSQL       │   │   Upstash Redis     │   │   S3 + CloudFront   │
│   (RDS t3.micro    │   │   (free tier)       │   │   (free tier)       │
│    free tier)      │   │                     │   │                     │
│ - Users            │   │ - Session cache     │   │ - Pitch decks       │
│ - Profiles         │   │ - Rate limiting     │   │ - Portfolio assets  │
│ - Opportunities    │   │ - BullMQ queues     │   │ - Uploaded docs     │
│ - Milestones       │   │                     │   │                     │
│ - Proposals        │   └─────────────────────┘   └─────────────────────┘
└────────────────────┘
```

---

## Core Subsystems

### 1. AI Recommendation Engine

```
User Profile (skills, stage, industry)
        │
        ▼
  Embedding Service (OpenAI text-embedding-3-small)
        │
        ▼
  Pinecone / pgvector  ◄──── Indexed: Professionals, Events, Opportunities
        │
        ▼
  Similarity Search (top-k matches)
        │
        ▼
  Re-ranking Layer (business rules: location, stage, recency)
        │
        ▼
  Recommendation API  ──► Frontend Dashboard
```

**Warm Intro Templates:**
- User selects a match → LLM (GPT-4o) generates a personalized outreach message
- Context injected: user's business summary + target's public profile data

---

### 2. LinkedIn Scraping Pipeline

```
Scheduler (cron via BullMQ)
        │
        ▼
  Proxycurl API  ──────────────────────────────────────┐
  (ToS-compliant)                                      │
        │                                              │
        ▼                                              ▼
  Raw Opportunity Data                     User Profile Sync
  (jobs, RFPs, contacts)                   (on user request)
        │
        ▼
  Dedup & Scoring Worker
  - Hash-based dedup (URL + title)
  - Embedding similarity score vs user goals
  - Recency decay factor
        │
        ▼
  Opportunities Table (Postgres)
        │
        ▼
  Notification Service  ──► Email / In-app alert
```

---

### 3. Funding & Proposal Builder

```
User triggers "Generate Proposal"
        │
        ▼
  Context Aggregator
  - Business metrics (from Milestones table)
  - KPIs (revenue, users, growth)
  - Target funder profile (from Funding DB)
        │
        ▼
  LangChain.js Pipeline
  ┌─────────────────────────────────────┐
  │  Step 1: Executive Summary          │
  │  Step 2: Problem / Solution         │
  │  Step 3: Traction & Metrics         │
  │  Step 4: Ask & Use of Funds         │
  │  Step 5: Team & Credibility         │
  └─────────────────────────────────────┘
        │
        ▼
  Generated Proposal (Markdown / PDF)
        │
        ▼
  S3 Storage  ──► Shareable link returned to user
```

---

### 4. User Roles & Auth Flow

```
Sign Up
  │
  ├── Role: Entrepreneur
  │     └── Onboarding: business stage, industry, goals, KPIs
  │
  └── Role: Partner / Investor / Employer
        └── Onboarding: investment thesis, hiring needs, sectors

Auth Provider: AWS Cognito
  - User Pools for sign-up / sign-in
  - User Pool Groups map to roles (Entrepreneur, Partner, Investor)
  - JWT (Cognito ID token) issued on login
  - API Gateway authorizer validates JWT on every request
  - Lambda middleware enforces group-based RBAC
```

---

### 5. Public Portfolio / B2B Showroom

```
Entrepreneur publishes portfolio
        │
        ▼
  Public URL: /portfolio/{username}
  (Next.js SSR — SEO optimized)
        │
  Displays:
  - Product catalog
  - Traction badges (verified milestones)
  - KPI highlights
  - Contact / intro CTA
        │
        ▼
  Visitor (Investor/Employer) clicks "Request Introduction"
        │
        ▼
  Warm Intro flow triggered (see AI Engine above)
```

---

## Data Flow Summary

```
External Sources          Internal Services           User-Facing
─────────────────         ─────────────────           ────────────
Proxycurl (LinkedIn) ──►  Scraping Worker    ──►  Opportunity Feed
Clearbit / Apollo    ──►  Enrichment Worker  ──►  Lead Scores
OpenAI Embeddings    ──►  Vector Store       ──►  Networking Matches
OpenAI GPT-4o        ──►  Proposal Builder   ──►  Pitch Deck / PDF
Grant Databases      ──►  Funding Aggregator ──►  Funding Search
```

---

## Security Considerations

- All API keys stored in **AWS SSM Parameter Store** (free), never in env files committed to git
- LinkedIn data accessed only via **Proxycurl** (ToS-compliant) — no direct scraping of LinkedIn
- **Rate limiting** on all public endpoints via Upstash Redis + API Gateway
- **Row-level security (RLS)** in Postgres — users can only access their own data
- **S3 bucket policies** — portfolio assets public, all other uploads private with signed URLs
- **RBAC** enforced via **AWS Cognito User Pool Groups** (Entrepreneur / Partner / Investor)

---

## Deployment Pipeline

```
Developer pushes to GitHub
        │
        ▼
  GitHub Actions CI
  - Lint + Type check
  - Unit tests
  - Build Lambda zip / Amplify build
        │
        ├──────────────────────────────────────┐
        ▼                                      ▼
  AWS SAM / CDK deploy                  Amplify auto-deploy
  (Lambda + API Gateway)                (Next.js frontend)
        │
        ▼
  CloudWatch monitors Lambda health
  (logs, error rate, duration metrics)
```

### Key AWS Free Tier Services Used

| Service | Role |
|---|---|
| AWS Lambda | Backend compute (no idle cost) |
| AWS API Gateway (HTTP) | API routing |
| AWS Amplify Hosting | Frontend SSR hosting |
| AWS RDS t3.micro | Postgres database |
| AWS S3 | File storage |
| AWS CloudFront | CDN |
| AWS Cognito | Auth + RBAC |
| AWS SES | Transactional email |
| AWS SSM Parameter Store | Secrets management |
| AWS CloudWatch | Monitoring + logs |
| Upstash Redis | Cache + job queue (BullMQ) |
