import { CreditCard } from "lucide-react";
import { SectionCard } from "@/components/dashboard/section-card";

export function UpcomingBills({ bills }) {
  return <SectionCard title="Upcoming bills"><div className="flex flex-col gap-3">{bills.map((bill) => <div key={bill.name} className="flex items-center justify-between bg-zinc-100 pr-3"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center bg-zinc-900 text-white"><CreditCard size={15} /></div><div><div className="text-sm font-medium">{bill.name}</div><div className="text-xs text-zinc-500">Due {bill.due}</div></div></div><div className="text-sm font-semibold">{bill.amount}</div></div>)}</div></SectionCard>;
}