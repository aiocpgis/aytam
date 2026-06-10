import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type ChartData = {
  name: string;
  value: number;
};

export function GovernorateBarChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0 || data.every((item) => item.value === 0)) {
    return (
      <div className="flex h-64 min-h-64 min-w-0 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800/50">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">لا توجد بيانات متاحة للعرض</p>
      </div>
    );
  }

  return (
    <div className="h-64 min-h-64 min-w-0 w-full overflow-hidden">
      <ResponsiveContainer width="100%" height={256} minWidth={260} minHeight={256}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "#F1F5F9" }}
            formatter={(value) => [value, "عدد الأيتام"]}
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Bar
            dataKey="value"
            fill="#3B82F6"
            radius={[6, 6, 0, 0]}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
