import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CreditCard,
  LayoutGrid,
  PiggyBank,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { Bar, Pie } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";

import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionCard } from "@/components/dashboard/section-card";
import {
  bills,
  cashFlow,
  goals,
  kpis,
  navItems,
  spending,
  transactions,
} from "@/data/dashboard";

function formatBarHeight(value) {
  return `${Math.max(value * 18, 18)}px`;
}

export default function Home() {
  const chartWidth = 600;
  const chartHeight = 250;
  const maxCashFlow = Math.max(
    ...cashFlow.flatMap((item) => [item.income, item.expense]),
    8,
  );

  const xScale = scaleBand({
    domain: cashFlow.map((item) => item.month),
    range: [0, chartWidth],
    padding: 0.3,
  });

  const yScale = scaleLinear({
    domain: [0, maxCashFlow + 1],
    range: [chartHeight, 0],
  });

  const donutRadius = 68;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 bg-white p-5 lg:block border-r sticky top-0 h-screen overflow-y-auto">
          <nav className="space-y-0">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                  item.active
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <span>{item.label}</span>
                {item.active && <LayoutGrid size={14} />}
              </button>
            ))}
          </nav>

          <div className="mt-10 bg-zinc-50 p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-500">
              <span>Net cash</span>
              <PiggyBank size={14} />
            </div>
            <div className="text-2xl font-semibold">€18,640</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200">
              <div className="h-full w-[68%] rounded-full bg-zinc-900" />
            </div>
            <div className="mt-2 text-xs text-zinc-500">68% of target</div>
          </div>
        </aside>

        <main className="flex-1 space-y-0">
          <header className="bg-white p-4 md:p-5 border-b sticky top-0 z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Good morning Igor
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Financial overview</h1>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
                  <Search size={16} />
                  <span>Search</span>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus size={14} />
                  Add account
                </Button>
                <button className="flex h-9 w-9 items-center justify-center bg-zinc-50 text-zinc-600">
                  <Bell size={16} />
                </button>
              </div>
            </div>
          </header>

          <section className="grid border-b md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <MetricCard key={item.label} {...item} />
            ))}
          </section>

          <section className="grid xl:grid-cols-[1.5fr_0.9fr]">
            <SectionCard
              title="Cash flow"
              action={
                <button className="inline-flex items-center px-2 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-600">
                  6 months <ChevronDown size={12} />
                </button>
              }
            >
              <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                {cashFlow.map((item, index) => {
                  const bandWidth = xScale.bandwidth();
                  const barWidth = bandWidth / 2 - 4;
                  const x = xScale(item.month) ?? 0;

                  return (
                    <g key={item.month}>
                      <Bar
                        x={x + 2}
                        y={yScale(item.income)}
                        width={barWidth}
                        height={chartHeight - yScale(item.income)}
                        fill="#18181b"
                        style={{
                          transformOrigin: "bottom center",
                          animation: "bar-rise 700ms ease-out forwards",
                          animationDelay: `${index * 90}ms`,
                          opacity: 0,
                        }}
                      />
                      <text
                        x={x + barWidth / 2 + 2}
                        y={yScale(item.income) - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#18181b"
                        fontWeight={600}
                        style={{
                          opacity: 0,
                          transformOrigin: "center",
                          animation: "value-reveal 350ms ease-out forwards",
                          animationDelay: `${index * 90 + 700}ms`,
                        }}
                      >
                        {item.income.toFixed(1)}k
                      </text>

                      <Bar
                        x={x + barWidth + 6}
                        y={yScale(item.expense)}
                        width={barWidth}
                        height={chartHeight - yScale(item.expense)}
                        fill="#d4d4d8"
                        style={{
                          transformOrigin: "bottom center",
                          animation: "bar-rise 700ms ease-out forwards",
                          animationDelay: `${index * 90 + 120}ms`,
                          opacity: 0,
                        }}
                      />
                      <text
                        x={x + bandWidth / 2 + barWidth / 2 + 5}
                        y={yScale(item.expense) - 8}
                        textAnchor="middle"
                        fontSize={10}
                        fill="#71717a"
                        fontWeight={600}
                        style={{
                          opacity: 0,
                          transformOrigin: "center",
                          animation: "value-reveal 350ms ease-out forwards",
                          animationDelay: `${index * 90 + 820}ms`,
                        }}
                      >
                        {item.expense.toFixed(1)}k
                      </text>

                      <text
                        x={x + bandWidth / 2}
                        y={chartHeight - 8}
                        textAnchor="middle"
                        fontSize={11}
                        fill="#71717a"
                      >
                        {item.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </SectionCard>

            <SectionCard title="Spending" action={<TrendingUp size={16} className="text-zinc-500" />}>
              <div className="flex w-full items-center justify-start gap-4">
                <svg
                  width={180}
                  height={250}
                  viewBox="0 0 180 180"
                  className="block shrink-0"
                  aria-label="Spending chart"
                >
                  <g transform="translate(90 90)">
                    <Pie
                      data={spending}
                      pieValue={(d) => d.value}
                      outerRadius={donutRadius}
                      innerRadius={donutRadius - 22}
                      padAngle={0.02}
                    >
                      {(pie) =>
                        pie.arcs.map((arc, index) => (
                          <path
                            key={arc.data.name}
                            d={pie.path(arc) || ""}
                            fill={spending[index].color}
                            stroke="#ffffff"
                            strokeWidth={1}
                            style={{
                              transformOrigin: "center",
                              animation: "slice-in 700ms ease-out forwards",
                              animationDelay: `${index * 120}ms`,
                              opacity: 0,
                            }}
                          />
                        ))
                      }
                    </Pie>
                    <circle cx={0} cy={0} r={39} fill="#ffffff" />
                    <text x={0} y={-8} textAnchor="middle" fill="#18181b" fontSize={12} fontWeight={600}>
                      Total
                    </text>
                    <text x={0} y={18} textAnchor="middle" fill="#18181b" fontSize={18} fontWeight={700}>
                      €4.5k
                    </text>
                  </g>
                </svg>

                <div className="flex-1 space-y-2 pt-2">
                  {spending.map((sector) => (
                    <div key={sector.name} className="flex items-center justify-between gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5"
                          style={{ backgroundColor: sector.color }}
                        />
                        <span className="font-medium text-zinc-700">{sector.name}</span>
                      </div>
                      <span className="text-zinc-500">{sector.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionCard>
          </section>

          <section className="grid xl:grid-cols-[1.3fr_0.7fr]">
            <SectionCard
              title="Transactions"
              action={
                <button className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  View all
                </button>
              }
            >
              <div className=" bg-zinc-100">
                {transactions.map((transaction) => (
                  <div
                    key={`${transaction.name}-${transaction.date}`}
                    className="flex items-center justify-between  px-3 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center ${
                          transaction.type === "income" ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-800"
                        }`}
                      >
                        {transaction.type === "income" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      </div>
                      <div>
                        <div className="font-medium text-zinc-900">{transaction.name}</div>
                        <div className="text-xs text-zinc-500">
                          {transaction.category} • {transaction.date}
                        </div>
                      </div>
                    </div>
                    <div
                      className={`font-semibold ${
                        transaction.type === "income" ? "text-emerald-600" : "text-zinc-900"
                      }`}
                    >
                      {transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div className="">
              <SectionCard title="Upcoming bills">
                <div className="space-y-0  flex flex-col gap-3 ">
                  {bills.map((bill) => (
                    <div key={bill.name} className="flex items-center bg-zinc-100 justify-between pr-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center bg-zinc-900 text-white">
                          <CreditCard size={15} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{bill.name}</div>
                          <div className="text-xs text-zinc-500">Due {bill.due}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold">{bill.amount}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Savings goals">
                <div className="space-y-0">
                  {goals.map((goal) => (
                    <div key={goal.name}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700">{goal.name}</span>
                        <span className="text-zinc-500">{goal.saved}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden bg-zinc-100">
                        <div className="h-full bg-zinc-900" style={{ width: `${goal.progress}%` }} />
                      </div>
                      <div className="mt-0 text-xs text-zinc-500">
                        {goal.progress}% of {goal.total}
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
