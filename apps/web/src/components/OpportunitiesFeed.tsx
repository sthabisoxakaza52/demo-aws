"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Opportunity } from "@platform/types";

const TYPE_LABELS: Record<string, string> = {
  job: "💼 Job",
  rfp: "📋 RFP",
  grant: "🏦 Grant",
  investment: "💰 Investment",
  event: "🎤 Event",
};

export function OpportunitiesFeed() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["opportunities"],
    queryFn: () => api.getOpportunities({ pageSize: 10 }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Opportunities</h2>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p className="text-red-500 text-sm">Failed to load opportunities.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Opportunities{" "}
        <span className="text-sm font-normal text-gray-400">
          ({data?.total ?? 0} total)
        </span>
      </h2>

      <div className="space-y-3">
        {data?.data.map((opp: Opportunity) => (
          <div
            key={opp.id}
            className="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                  {TYPE_LABELS[opp.type] ?? opp.type}
                </span>
                {opp.company && (
                  <span className="text-xs text-gray-400">{opp.company}</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {opp.title}
              </p>
              {opp.location && (
                <p className="text-xs text-gray-400 mt-0.5">{opp.location}</p>
              )}
            </div>
            {opp.score !== undefined && (
              <div className="ml-4 text-right shrink-0">
                <span className="text-xs font-semibold text-green-600">
                  {Math.round(opp.score * 100)}% match
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
