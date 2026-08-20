import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";

export function Transactions({ transactions }) {
  return <SectionCard title="Transactions" action={<button className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">View all</button>}>
    <div className="flex flex-col gap-3">{transactions.map((transaction) => <div key={`${transaction.name}-${transaction.date}`} className="flex items-center justify-between bg-zinc-100 pr-3"><div className="flex items-center gap-3"><div className={`flex h-10 w-10 items-center justify-center ${transaction.type === "income" ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-800"}`}>{transaction.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}</div><div><div className="font-medium text-zinc-900">{transaction.name}</div><div className="text-xs text-zinc-500">{transaction.category} • {transaction.date}</div></div></div><div className={`font-semibold ${transaction.type === "income" ? "text-emerald-600" : "text-zinc-900"}`}>{transaction.amount}</div></div>)}</div>
  </SectionCard>;
}