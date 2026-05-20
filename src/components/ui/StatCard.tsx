import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  tone?: "blue" | "green" | "amber" | "rose";
}

const toneClasses = {
  blue: "from-blue-600 to-cyan-500",
  green: "from-emerald-600 to-teal-500",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-500",
};

export function StatCard({ title, value, icon, tone = "blue" }: StatCardProps) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
        </div>
        <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-l ${toneClasses[tone]} text-white shadow-soft`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
