/**
 * Public-facing entrepreneur portfolio page.
 * Server-rendered for SEO — no auth required.
 */
import type { Metadata } from "next";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — EntrepreneurOS Portfolio`,
    description: `View ${username}'s business portfolio, traction milestones, and products.`,
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { username } = await params;

  // In production this would fetch from the API / DB directly (server component)
  // For now we render a skeleton that the client will hydrate
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-2xl font-bold text-brand-700">
            {username[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{username}</h1>
            <p className="text-gray-500 text-sm">Entrepreneur</p>
          </div>
        </div>

        {/* Traction badges placeholder */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Traction Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {["Product Launched", "Seed Stage", "1k+ Users"].map((badge) => (
              <span
                key={badge}
                className="bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1 rounded-full border border-brand-100"
              >
                ✓ {badge}
              </span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-brand-50 rounded-2xl p-6 text-center">
          <p className="text-gray-700 mb-4">
            Interested in connecting with {username}?
          </p>
          <button className="bg-brand-600 text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors text-sm font-medium">
            Request Introduction
          </button>
        </div>
      </div>
    </main>
  );
}
