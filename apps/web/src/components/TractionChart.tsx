"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Placeholder data — replace with real milestones from the API
const PLACEHOLDER_DATA = [
  { month: "Jan", users: 120, revenue: 0 },
  { month: "Feb", users: 340, revenue: 500 },
  { month: "Mar", users: 780, revenue: 1200 },
  { month: "Apr", users: 1050, revenue: 2800 },
  { month: "May", users: 1420, revenue: 4500 },
  { month: "Jun", users: 2100, revenue: 7200 },
];

export function TractionChart() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-800 mb-6">
        Traction Overview
      </h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={PLACEHOLDER_DATA}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              fontSize: "12px",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }}
          />
          <Line
            type="monotone"
            dataKey="users"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={false}
            name="Users"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Revenue ($)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
