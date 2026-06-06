import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type ChartData = {
  name: string;
  value: number;
};

const COLORS = {
  "مكفول": "#10B981",
  "غير مكفول": "#F59E0B",
  "بانتظار كافل": "#F59E0B",
  "متوقف": "#EF4444",
  "غير محدد": "#64748B",
};

export function SponsorshipDonutChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0 || data.every(d => d.value === 0)) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">لا توجد بيانات متاحة للعرض</p>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name as keyof typeof COLORS] || COLORS["غير محدد"]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [value, "العدد"]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
