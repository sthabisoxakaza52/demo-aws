"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NetworkMatch } from "@platform/types";

export function NetworkMatches() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["network-matches"],
    queryFn: () => api.getMatches(),
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.refreshMatches(),
    onSuccess: () => {
      // Invalidate after a short delay to allow async processing
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["network-matches"] });
      }, 3000);
    },
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Top Matches</h2>
        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="text-xs text-brand-600 hover:text-brand-700 disabled:opacity-50 transition-colors"
          aria-label="Refresh network matches"
        >
          {refreshMutation.isPending ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.data as (NetworkMatch & { matched_name?: string; business_name?: string; industry?: string })[])?.map(
            (match) => (
              <div
                key={match.matchedUserId}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-700 shrink-0">
                  {match.matched_name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {match.matched_name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {match.business_name ?? match.industry ?? ""}
                  </p>
                </div>
                <span className="text-xs font-semibold text-green-600 shrink-0">
                  {Math.round(match.score * 100)}%
                </span>
              </div>
            )
          )}
          {!data?.data?.length && (
            <p className="text-sm text-gray-400 text-center py-4">
              No matches yet — complete your profile to get started.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
