import { OpportunitiesFeed } from "@/components/OpportunitiesFeed";
import { NetworkMatches } from "@/components/NetworkMatches";
import { TractionChart } from "@/components/TractionChart";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Traction chart — spans 2 cols */}
          <div className="lg:col-span-2">
            <TractionChart />
          </div>

          {/* Network matches */}
          <div>
            <NetworkMatches />
          </div>

          {/* Opportunities feed — full width */}
          <div className="lg:col-span-3">
            <OpportunitiesFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
