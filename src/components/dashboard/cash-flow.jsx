import { Bar, LinePath } from "@visx/shape";
import { SectionCard } from "@/components/dashboard/section-card";

export function CashFlow({ cashFlow, activeBalance, onBalanceChange, chart }) {
  const { chartWidth, chartHeight, chartLeft, chartRight, plotBottom, xScale, yScale, yTicks } = chart;

  return (
    <SectionCard title="Cash flow">
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
        {yTicks.map((tick) => (
          <g key={`y-tick-${tick}`}>
            <line x1={chartLeft} x2={chartWidth - chartRight} y1={yScale(tick)} y2={yScale(tick)} stroke="#e4e4e7" />
            <text x={chartLeft - 10} y={yScale(tick) + 4} textAnchor="end" fontSize={10} fill="#71717a">€{tick.toFixed(0)}k</text>
          </g>
        ))}
        {cashFlow.map((item, index) => {
          const bandWidth = xScale.bandwidth();
          const barWidth = bandWidth / 2 - 4;
          const x = xScale(item.month) ?? 0;
          return (
            <g key={item.month}>
              <Bar x={x + 2} y={yScale(item.income)} width={barWidth} height={plotBottom - yScale(item.income)} fill="#18181b" style={{ transformOrigin: "bottom center", animation: "bar-rise 700ms ease-out forwards", animationDelay: `${index * 90}ms`, opacity: 0 }} />
              <text x={x + barWidth / 2 + 2} y={yScale(item.income) - 8} textAnchor="middle" fontSize={10} fill="#18181b" fontWeight={600}>{item.income.toFixed(1)}k</text>
              <Bar x={x + barWidth + 6} y={yScale(item.expense)} width={barWidth} height={plotBottom - yScale(item.expense)} fill="#d4d4d8" style={{ transformOrigin: "bottom center", animation: "bar-rise 700ms ease-out forwards", animationDelay: `${index * 90 + 120}ms`, opacity: 0 }} />
              <text x={x + bandWidth / 2 + barWidth / 2 + 5} y={yScale(item.expense) - 8} textAnchor="middle" fontSize={10} fill="#71717a" fontWeight={600}>{item.expense.toFixed(1)}k</text>
            </g>
          );
        })}
        {cashFlow.map((item) => <text key={`${item.month}-label`} x={(xScale(item.month) ?? 0) + xScale.bandwidth() / 2} y={chartHeight - 10} textAnchor="middle" fontSize={11} fill="#71717a">{item.month}</text>)}
        <LinePath data={cashFlow} x={(item) => (xScale(item.month) ?? 0) + xScale.bandwidth() / 2} y={(item) => yScale(item.income - item.expense)} stroke="#52525B" strokeWidth={2.5} style={{ fill: "none", strokeDasharray: "600", strokeDashoffset: "600", animation: "line-draw 1100ms ease-out 1200ms forwards" }} />
        {cashFlow.map((item, index) => {
          const x = (xScale(item.month) ?? 0) + xScale.bandwidth() / 2;
          const balance = item.income - item.expense;
          const isActive = activeBalance === index;
          return (
            <g key={`${item.month}-balance`} role="button" tabIndex={0} aria-label={`${item.month}: saldo ${balance.toFixed(1)} duizend euro`} onMouseEnter={() => onBalanceChange(index)} onMouseLeave={() => onBalanceChange(null)} onFocus={() => onBalanceChange(index)} onBlur={() => onBalanceChange(null)} onClick={() => onBalanceChange(isActive ? null : index)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onBalanceChange(isActive ? null : index); } }} className="cursor-pointer outline-none">
              <circle cx={x} cy={yScale(balance)} r={isActive ? 5 : 4} fill="#ffffff" stroke="#52525b" strokeWidth={2} />
              {isActive && <text x={Math.max(x - 50, chartLeft)} y={Math.max(yScale(balance) - 16, 16)} fill="#18181b" fontSize={11} fontWeight={600}>{item.month} · saldo {balance < 0 ? "-" : ""}€{Math.abs(balance).toFixed(1)}k</text>}
            </g>
          );
        })}
      </svg>
    </SectionCard>
  );
}