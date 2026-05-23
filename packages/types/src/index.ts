// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = "entrepreneur" | "partner" | "investor" | "employer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface EntrepreneurProfile {
  userId: string;
  businessName: string;
  industry: string;
  stage: "idea" | "mvp" | "seed" | "series_a" | "growth";
  location: string;
  bio: string;
  goals: string[];
  /** What the entrepreneur is currently seeking */
  seeking: SeekingOption[];
  websiteUrl?: string;
  linkedinUrl?: string;
}

export type SeekingOption =
  | "co_founder"
  | "seed_funding"
  | "contract_work"
  | "mentorship"
  | "partnership"
  | "hiring";

export interface PartnerProfile {
  userId: string;
  organizationName: string;
  investmentThesis?: string;
  hiringNeeds?: string;
  sectors: string[];
}

// ─── KPIs & Milestones ───────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  userId: string;
  label: string;
  value: number;
  unit: string; // e.g. "users", "USD", "%"
  achievedAt: string;
  verified: boolean;
}

export type BadgeType =
  | "seed_stage_completed"
  | "1k_users"
  | "10k_users"
  | "first_revenue"
  | "product_launched";

export interface TractionBadge {
  type: BadgeType;
  label: string;
  awardedAt: string;
}

// ─── Opportunities ───────────────────────────────────────────────────────────

export type OpportunityType = "job" | "rfp" | "grant" | "investment" | "event";

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  sourceUrl: string;
  company?: string;
  location?: string;
  tags: string[];
  score?: number; // relevance score 0–1
  postedAt: string;
  expiresAt?: string;
}

// ─── Proposals ───────────────────────────────────────────────────────────────

export type ProposalStatus = "draft" | "generating" | "ready" | "sent";

export interface Proposal {
  id: string;
  userId: string;
  opportunityId?: string;
  title: string;
  status: ProposalStatus;
  content?: string; // Markdown
  fileUrl?: string; // S3 signed URL for PDF
  createdAt: string;
  updatedAt: string;
}

// ─── Networking ──────────────────────────────────────────────────────────────

export interface NetworkMatch {
  userId: string;
  matchedUserId: string;
  score: number; // cosine similarity 0–1
  reason: string;
  outreachTemplate?: string;
  createdAt: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  error: string;
  statusCode: number;
  details?: unknown;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
