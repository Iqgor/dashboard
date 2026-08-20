import { SectionCard } from "@/components/dashboard/section-card";

export function SavingsGoals({ goals }) {
  return <SectionCard title="Savings goals"><div className="flex flex-col gap-2">{goals.map((goal) => <div key={goal.name} className="bg-zinc-100 p-1"><div className="flex items-center justify-between text-sm"><span className="font-medium text-zinc-700">{goal.name}</span><span className="text-zinc-500">{goal.saved}</span></div><div className="h-2.5 overflow-hidden rounded-sm bg-zinc-100"><div className="h-full rounded-sm bg-zinc-900" style={{ width: `${goal.progress}%` }} /></div><div className="text-xs text-zinc-500">{goal.progress}% of {goal.total}</div></div>)}</div></SectionCard>;
}