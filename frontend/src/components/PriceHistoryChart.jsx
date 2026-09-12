import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatINR } from "@/lib/api";
import EmptyState from "@/components/EmptyState";
import { TrendingUp } from "lucide-react";

export default function PriceHistoryChart({ observations, deal }) {
  const hasEnough = Array.isArray(observations) && observations.length >= 2;
  if (!hasEnough) {
    return (
      <EmptyState
        icon={TrendingUp}
        title={observations && observations.length === 1 ? "Only one real price recorded" : "No price history yet"}
        description={
          "SMART BUY only shows real price observations. As more real snapshots are collected over time, this chart will populate with the actual price journey."
        }
      />
    );
  }
  const data = observations.map((o) => ({
    date: new Date(o.recorded_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }),
    time: new Date(o.recorded_at).getTime(),
    price: o.price,
    seller: o.seller,
  }));
  return (
    <div className="space-y-3">
      {deal && (
        <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Based on {deal.observations} real observations
        </div>
      )}
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              domain={["auto", "auto"]}
            />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 4, fontSize: 12 }}
              formatter={(v) => [formatINR(v), "Price"]}
            />
            <Line type="monotone" dataKey="price" stroke="hsl(20 78% 55%)" strokeWidth={2} dot={{ r: 3, fill: "hsl(20 78% 55%)" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
