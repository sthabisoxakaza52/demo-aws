import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-50 to-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-brand-700">EntrepreneurOS</span>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-brand-600 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-8 pt-24 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          From idea to traction —{" "}
          <span className="text-brand-600">faster.</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          AI-powered networking, funding discovery, and proposal generation for
          entrepreneurs who are serious about growth.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-brand-600 text-white text-lg px-8 py-4 rounded-xl hover:bg-brand-700 transition-colors shadow-lg"
        >
          Start for free
        </Link>
      </section>

      {/* Feature grid */}
      <section className="max-w-5xl mx-auto px-8 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f) => (
          <div
            key={f.title}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-sm text-gray-500">{f.description}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

const features = [
  {
    icon: "🤝",
    title: "Smart Networking",
    description:
      "AI matches you with the right mentors, co-founders, and investors based on your business stage and goals.",
  },
  {
    icon: "💰",
    title: "Funding Discovery",
    description:
      "Aggregated grants, VCs, and RFPs scored by relevance to your business — with AI-generated proposals.",
  },
  {
    icon: "📊",
    title: "Traction Dashboard",
    description:
      "Track KPIs, earn verified badges, and showcase your growth to potential partners and investors.",
  },
];
