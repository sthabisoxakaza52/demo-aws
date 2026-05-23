/**
 * Typed API client — thin wrapper around fetch.
 * Reads the API base URL from the environment.
 */
import type { ApiResponse, ApiError, PaginatedResponse, Opportunity, Proposal, NetworkMatch } from "@platform/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

class ApiClient {
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("id_token") : null;

    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const err: ApiError = await res.json();
      throw new Error(err.error ?? "Request failed");
    }

    return res.json() as Promise<T>;
  }

  // ── Opportunities ──────────────────────────────────────────────────────────
  getOpportunities(params?: { type?: string; page?: number; pageSize?: number }) {
    const qs = new URLSearchParams(
      Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString();
    return this.request<PaginatedResponse<Opportunity>>(
      `/api/opportunities${qs ? `?${qs}` : ""}`
    );
  }

  getOpportunity(id: string) {
    return this.request<ApiResponse<Opportunity>>(`/api/opportunities/${id}`);
  }

  // ── Proposals ─────────────────────────────────────────────────────────────
  getProposals() {
    return this.request<ApiResponse<Proposal[]>>("/api/proposals");
  }

  createProposal(body: { title: string; opportunityId?: string }) {
    return this.request<ApiResponse<Proposal>>("/api/proposals", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getProposal(id: string) {
    return this.request<ApiResponse<Proposal>>(`/api/proposals/${id}`);
  }

  // ── Network ───────────────────────────────────────────────────────────────
  getMatches() {
    return this.request<ApiResponse<NetworkMatch[]>>("/api/network/matches");
  }

  refreshMatches() {
    return this.request<ApiResponse<{ message: string }>>("/api/network/refresh", {
      method: "POST",
    });
  }

  getOutreachTemplate(matchedUserId: string) {
    return this.request<ApiResponse<{ template: string }>>(
      `/api/network/outreach/${matchedUserId}`
    );
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  getMe() {
    return this.request<ApiResponse<unknown>>("/api/users/me");
  }
}

export const api = new ApiClient();
