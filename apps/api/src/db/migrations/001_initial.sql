-- ─── Enable extensions ────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for embeddings

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cognito_sub VARCHAR(255) UNIQUE NOT NULL,  -- Cognito user sub (JWT subject)
  email       VARCHAR(255) UNIQUE NOT NULL,
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(50)  NOT NULL CHECK (role IN ('entrepreneur','partner','investor','employer')),
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Entrepreneur profiles ────────────────────────────────────────────────────
CREATE TABLE entrepreneur_profiles (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  industry      VARCHAR(100) NOT NULL,
  stage         VARCHAR(50)  NOT NULL CHECK (stage IN ('idea','mvp','seed','series_a','growth')),
  location      VARCHAR(255),
  bio           TEXT,
  goals         TEXT[]       NOT NULL DEFAULT '{}',
  seeking       TEXT[]       NOT NULL DEFAULT '{}',
  website_url   VARCHAR(500),
  linkedin_url  VARCHAR(500),
  embedding     vector(1536),  -- OpenAI text-embedding-3-small dimension
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Partner profiles ─────────────────────────────────────────────────────────
CREATE TABLE partner_profiles (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  organization_name VARCHAR(255) NOT NULL,
  investment_thesis TEXT,
  hiring_needs      TEXT,
  sectors           TEXT[] NOT NULL DEFAULT '{}'
);

-- ─── Milestones ───────────────────────────────────────────────────────────────
CREATE TABLE milestones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       VARCHAR(255) NOT NULL,
  value       NUMERIC      NOT NULL,
  unit        VARCHAR(50)  NOT NULL,
  achieved_at TIMESTAMPTZ  NOT NULL,
  verified    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Opportunities ────────────────────────────────────────────────────────────
CREATE TABLE opportunities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type        VARCHAR(50)  NOT NULL CHECK (type IN ('job','rfp','grant','investment','event')),
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  source_url  VARCHAR(1000) NOT NULL,
  company     VARCHAR(255),
  location    VARCHAR(255),
  tags        TEXT[]       NOT NULL DEFAULT '{}',
  embedding   vector(1536),
  posted_at   TIMESTAMPTZ  NOT NULL,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (source_url)  -- dedup by URL
);

-- ─── Proposals ────────────────────────────────────────────────────────────────
CREATE TABLE proposals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id UUID REFERENCES opportunities(id) ON DELETE SET NULL,
  title          VARCHAR(500) NOT NULL,
  status         VARCHAR(50)  NOT NULL DEFAULT 'draft'
                   CHECK (status IN ('draft','generating','ready','sent')),
  content        TEXT,
  file_url       VARCHAR(1000),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Network matches ──────────────────────────────────────────────────────────
CREATE TABLE network_matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  matched_user_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score            NUMERIC(5,4) NOT NULL,
  reason           TEXT,
  outreach_template TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, matched_user_id)
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_milestones_user_id        ON milestones(user_id);
CREATE INDEX idx_opportunities_type        ON opportunities(type);
CREATE INDEX idx_opportunities_posted_at   ON opportunities(posted_at DESC);
CREATE INDEX idx_proposals_user_id         ON proposals(user_id);
CREATE INDEX idx_network_matches_user_id   ON network_matches(user_id);

-- pgvector HNSW indexes for fast similarity search
CREATE INDEX idx_entrepreneur_embedding    ON entrepreneur_profiles USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_opportunity_embedding     ON opportunities          USING hnsw (embedding vector_cosine_ops);
