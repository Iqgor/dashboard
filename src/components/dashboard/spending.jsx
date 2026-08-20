import { TrendingUp } from "lucide-react";
import { Pie } from "@visx/shape";
import { SectionCard } from "@/components/dashboard/section-card";

export function Spending({ spending, donutRadius }) {
  return (
    <SectionCard title="Spending" action={<TrendingUp size={16} className="text-zinc-500" />}>
      <div className="flex w-full items-center justify-start gap-4">
        <svg width={180} height={250} viewBox="0 0 180 180" className="block shrink-0" aria-label="Spending chart">
          <g transform="translate(90 90)">
            <Pie data={spending} pieValue={(item) => item.value} outerRadius={donutRadius} innerRadius={donutRadius - 22} padAngle={0.02}>
              {(pie) => pie.arcs.map((arc, index) => <path key={arc.data.name} d={pie.path(arc) || ""} fill={spending[index].color} stroke="#ffffff" strokeWidth={1} />)}
            </Pie>
            <circle cx={0} cy={0} r={39} fill="#ffffff" />
            <text x={0} y={-8} textAnchor="middle" fill="#18181b" fontSize={12} fontWeight={600}>Total</text>
            <text x={0} y={18} textAnchor="middle" fill="#18181b" fontSize={18} fontWeight={700}>€4.5k</text>
          </g>
        </svg>
        <div className="flex-1 space-y-2 pt-2">
          {spending.map((sector) => <div key={sector.name} className="flex items-center justify-between gap-2 text-sm"><div className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: sector.color }} /><span className="font-medium text-zinc-700">{sector.name}</span></div><span className="text-zinc-500">{sector.amount}</span></div>)}
        </div>
      </div>
    </SectionCard>
  );
}