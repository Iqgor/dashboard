"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronDown,
  CreditCard,
  LayoutGrid,
  PiggyBank,
  Plus,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Bar, LinePath, Pie } from "@visx/shape";
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

const defaultMarketSymbols = ["AAPL", "MSFT", "NVDA"];
const MARKET_QUOTES_CACHE_KEY = "marketQuotesCache.v1";
const MARKET_SEARCH_CACHE_KEY = "marketSearchCache.v1";
const QUOTES_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readCache(key) {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors (private mode or quota exceeded).
  }
}

function getCachedValue(cacheKey, itemKey, ttlMs) {
  const cache = readCache(cacheKey);
  const cacheEntry = cache[itemKey];

  if (!cacheEntry || typeof cacheEntry.timestamp !== "number") {
    return null;
  }

  if (Date.now() - cacheEntry.timestamp > ttlMs) {
    return null;
  }

  return cacheEntry.data;
}

function setCachedValue(cacheKey, itemKey, data) {
  const cache = readCache(cacheKey);
  cache[itemKey] = {
    timestamp: Date.now(),
    data,
  };
  writeCache(cacheKey, cache);
}

function normalizeSymbolInput(value) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function formatPrice(value, currency = "USD") {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "N/A";
  }

  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatBarHeight(value) {
  return `${Math.max(value * 18, 18)}px`;
}

export default function Home() {
  const [activeBalance, setActiveBalance] = useState(null);
  const [activeNav, setActiveNav] = useState("Overview");
  const [showMobileNav, setShowMobileNav] = useState(true);
  const [watchSymbols, setWatchSymbols] = useState(defaultMarketSymbols);
  const [marketInput, setMarketInput] = useState("");
  const [marketResults, setMarketResults] = useState([]);
  const [marketQuotes, setMarketQuotes] = useState([]);
  const [marketError, setMarketError] = useState("");
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState("");
  const previousScrollY = useRef(0);
  const chartWidth = 640;
  const chartHeight = 280;
  const chartLeft = 48;
  const chartRight = 12;
  const plotBottom = chartHeight - 34;
  const balances = cashFlow.map((item) => item.income - item.expense);
  const maxCashFlow = Math.max(
    ...cashFlow.flatMap((item) => [item.income, item.expense]),
    8,
  );
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(maxCashFlow, ...balances, 0);

  const xScale = scaleBand({
    domain: cashFlow.map((item) => item.month),
    range: [chartLeft, chartWidth - chartRight],
    padding: 0.3,
  });

  const yScale = scaleLinear({
    domain: [minBalance - 1, maxBalance + 1],
    range: [plotBottom, 24],
  });
  const yTicks = yScale.ticks(5);

  const donutRadius = 68;
  const navIcons = {
    Overview: LayoutGrid,
    Accounts: Wallet,
    Transactions: ArrowUpRight,
    Budget: BarChart3,
    Goals: PiggyBank,
    Reports: TrendingUp,
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingUp = currentScrollY < previousScrollY.current;

      setShowMobileNav(currentScrollY <= 0 || isScrollingUp);
      previousScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    async function fetchQuotes() {
      if (watchSymbols.length === 0) {
        setMarketQuotes([]);
        return;
      }

      const symbolsKey = watchSymbols.join(",");
      const cachedQuotes = getCachedValue(MARKET_QUOTES_CACHE_KEY, symbolsKey, QUOTES_CACHE_TTL_MS);

      if (cachedQuotes) {
        setMarketQuotes(cachedQuotes);
        setMarketError("");
        return;
      }

      setIsLoadingQuotes(true);

      try {
        const response = await fetch(`/api/market/quotes?symbols=${encodeURIComponent(watchSymbols.join(","))}`, {
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Kon marktdata niet ophalen.");
        }

        if (!isCancelled) {
          setMarketQuotes(payload.quotes || []);
          setCachedValue(MARKET_QUOTES_CACHE_KEY, symbolsKey, payload.quotes || []);
          setMarketError("");
        }
      } catch (error) {
        if (!isCancelled) {
          setMarketError(error.message || "Kon marktdata niet ophalen.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingQuotes(false);
        }
      }
    }

    fetchQuotes();

    return () => {
      isCancelled = true;
    };
  }, [watchSymbols]);

  const handleAddSymbol = (value) => {
    const normalizedSymbol = normalizeSymbolInput(value);

    if (!normalizedSymbol) {
      return;
    }

    if (watchSymbols.includes(normalizedSymbol)) {
      setMarketError(`${normalizedSymbol} staat al in je watchlist.`);
      return;
    }

    setWatchSymbols((currentSymbols) => [...currentSymbols, normalizedSymbol]);
    setMarketInput("");
    setMarketResults([]);
    setLastSearchQuery("");
    setMarketError("");
  };

  const handleRemoveSymbol = (symbolToRemove) => {
    setWatchSymbols((currentSymbols) => currentSymbols.filter((symbol) => symbol !== symbolToRemove));
  };

  const handleSearchSymbols = useCallback(async (searchTerm) => {
    const query = normalizeSymbolInput(searchTerm ?? marketInput);

    if (!query) {
      setMarketResults([]);
      setLastSearchQuery("");
      return;
    }

    if (query === lastSearchQuery) {
      return;
    }

    const cachedSearchResults = getCachedValue(MARKET_SEARCH_CACHE_KEY, query, SEARCH_CACHE_TTL_MS);
    if (cachedSearchResults) {
      setMarketResults(cachedSearchResults);
      setLastSearchQuery(query);
      setMarketError("");
      return;
    }

    setIsSearchingSymbols(true);

    try {
      const response = await fetch(`/api/market/search?query=${encodeURIComponent(query)}`, {
        cache: "no-store",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Kon symbolen niet zoeken.");
      }

      setMarketResults(payload.results || []);
      setCachedValue(MARKET_SEARCH_CACHE_KEY, query, payload.results || []);
      setLastSearchQuery(query);
      setMarketError("");
    } catch (error) {
      setMarketResults([]);
      setMarketError(error.message || "Kon symbolen niet zoeken.");
    } finally {
      setIsSearchingSymbols(false);
    }
  }, [lastSearchQuery, marketInput]);

  useEffect(() => {
    const query = normalizeSymbolInput(marketInput);

    if (!query) {
      return;
    }

    const debounceTimeout = setTimeout(() => {
      handleSearchSymbols(query);
    }, 450);

    return () => clearTimeout(debounceTimeout);
  }, [handleSearchSymbols, marketInput]);


  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex max-w-7xl">
        <aside className="hidden w-64 shrink-0 bg-white p-5 lg:block border-r sticky top-0 h-screen overflow-y-auto">
          <nav className="space-y-0">
            {navItems.map((item) => {
              const Icon = navIcons[item.label] || LayoutGrid;

              return (
                <button
                  key={item.label}
                  className={`group flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${
                    item.active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    className={`flex items-center transition-opacity ${
                      item.active ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Icon size={14} />
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-10 bg-zinc-50 p-4">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-500">
              <span>Net cash</span>
              <PiggyBank size={14} />
            </div>
            <div className="text-2xl font-semibold">€18,640</div>
          </div>
        </aside>

        <main className="flex-1 space-y-0">
          <header className="sticky  top-0 ">
            <div className="relative z-10 border-b bg-white p-4 md:p-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Good morning Igor
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight">Financial overview</h1>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button variant="outline" size="sm" className="gap-2 cursor-pointer">
                    <Plus size={14} />
                    Add account
                  </Button>
                  <button className="flex h-9 w-9 items-center justify-center bg-zinc-50 text-zinc-600">
                    <Bell size={16} />
                  </button>
                </div>
              </div>
            </div>
            <nav
              className={`relative z-0 grid grid-cols-3 border-b bg-white transition-transform duration-300 ease-out lg:hidden ${
                showMobileNav ? "translate-y-0" : "-translate-y-full"
              }`}
            >
              {navItems.map((item) => {
                const Icon = navIcons[item.label] || LayoutGrid;
                const isActive = activeNav === item.label;

                return (
                  <button
                    key={`mobile-${item.label}`}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveNav(item.label)}
                    className={`group flex min-h-12 items-center justify-center gap-2 px-2 py-3 text-xs transition ${
                      isActive
                        ? "bg-zinc-900 text-white"
                        : "cursor-pointer text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
            
          </header>
   
          <section className="grid border-b md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((item) => (
              <MetricCard key={item.label} {...item} />
            ))}
          </section>

          <section className="grid border-b">
            <SectionCard
              title="Market watch"
              action={<span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">Stocks + indices</span>}
            >
              <div className="space-y-4">
                <form
                  className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleAddSymbol(marketInput);
                  }}
                >
                  <label htmlFor="symbol-input" className="sr-only">
                    Add symbol
                  </label>
                  <input
                    id="symbol-input"
                    value={marketInput}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setMarketInput(nextValue);

                      if (!normalizeSymbolInput(nextValue)) {
                        setMarketResults([]);
                        setLastSearchQuery("");
                        setMarketError("");
                      }
                    }}
                    placeholder="Bijv. AAPL, SPX, NDX"
                    className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
                  />
                  <Button type="submit" variant="outline" className="h-10 cursor-pointer gap-2">
                    <Plus size={14} />
                    Voeg toe
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSearchSymbols()}
                    className="h-10 cursor-pointer gap-2"
                  >
                    <Search size={14} />
                    Nu zoeken
                  </Button>
                </form>

                {marketError && <p className="text-xs text-zinc-600">{marketError}</p>}

                {marketResults.length > 0 && (
                  <div className="space-y-1 border border-zinc-200 p-2">
                    {marketResults.map((result) => (
                      <button
                        key={`${result.symbol}-${result.exchange}`}
                        type="button"
                        onClick={() => handleAddSymbol(result.symbol)}
                        className="flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:bg-zinc-100"
                      >
                        <span className="font-medium text-zinc-800">{result.symbol}</span>
                        <span className="text-xs text-zinc-500">{result.name} · {result.exchange}</span>
                      </button>
                    ))}
                  </div>
                )}

                {isSearchingSymbols && <p className="text-xs text-zinc-500">Zoeken...</p>}

                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {marketQuotes.map((quote) => {
                    const isPositive = (quote.percentChange ?? 0) >= 0;

                    return (
                      <div key={quote.symbol} className="border border-zinc-200 bg-zinc-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{quote.symbol}</p>
                            <p className="text-sm font-medium text-zinc-800">{quote.name}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSymbol(quote.symbol)}
                            className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-900"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="mt-2 text-xl font-semibold text-zinc-900">
                          {formatPrice(quote.price, quote.currency)}
                        </p>
                        <p className={`text-sm ${isPositive ? "text-emerald-700" : "text-zinc-700"}`}>
                          {formatPercent(quote.percentChange)} ({quote.change?.toFixed(2) ?? "N/A"})
                        </p>
                      </div>
                    );
                  })}
                </div>

                {isLoadingQuotes && <p className="text-xs text-zinc-500">Koersen laden...</p>}
              </div>
            </SectionCard>
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
                {yTicks.map((tick) => (
                  <g key={`y-tick-${tick}`}>
                    <line
                      x1={chartLeft}
                      x2={chartWidth - chartRight}
                      y1={yScale(tick)}
                      y2={yScale(tick)}
                      stroke="#e4e4e7"
                      strokeWidth={1}
                    />
                    <text
                      x={chartLeft - 10}
                      y={yScale(tick) + 4}
                      textAnchor="end"
                      fontSize={10}
                      fill="#71717a"
                    >
                      €{tick.toFixed(0)}k
                    </text>
                  </g>
                ))}
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
                        height={plotBottom - yScale(item.income)}
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
                        height={plotBottom - yScale(item.expense)}
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

                    </g>
                  );
                })}
                {cashFlow.map((item) => (
                  <text
                    key={`${item.month}-label`}
                    x={(xScale(item.month) ?? 0) + xScale.bandwidth() / 2}
                    y={chartHeight - 10}
                    textAnchor="middle"
                    fontSize={11}
                    fill="#71717a"
                  >
                    {item.month}
                  </text>
                ))}
                <LinePath
                  data={cashFlow}
                  x={(item) => (xScale(item.month) ?? 0) + xScale.bandwidth() / 2}
                  y={(item) => yScale(item.income - item.expense)}
                  stroke="#52525B"
                  strokeWidth={2.5}
                  style={{
                    fill: "none",
                    strokeDasharray: "600",
                    strokeDashoffset: "600",
                    animation: "line-draw 1100ms ease-out 1200ms forwards",
                  }}
                />
                {cashFlow.map((item, index) => {
                  const x = (xScale(item.month) ?? 0) + xScale.bandwidth() / 2;
                  const balance = item.income - item.expense;
                  const tooltipWidth = 120;
                  const tooltipHeight = 28;
                  const tooltipX = Math.min(
                    Math.max(x - tooltipWidth / 2, chartLeft),
                    chartWidth - chartRight - tooltipWidth,
                  );
                  const tooltipY = Math.max(yScale(balance) - tooltipHeight - 12, 4);
                  const isActive = activeBalance === index;

                  return (
                    <g
                      key={`${item.month}-balance`}
                      role="button"
                      tabIndex={0}
                      aria-label={`${item.month}: saldo ${balance.toFixed(1)} duizend euro`}
                      onMouseEnter={() => setActiveBalance(index)}
                      onMouseLeave={() => setActiveBalance(null)}
                      onFocus={() => setActiveBalance(index)}
                      onBlur={() => setActiveBalance(null)}
                      onClick={() => setActiveBalance(isActive ? null : index)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setActiveBalance(isActive ? null : index);
                        }
                      }}
                      className="cursor-pointer outline-none"
                    >
                      <circle
                        cx={x}
                        cy={yScale(balance)}
                        r={isActive ? 5 : 4}
                        fill="#ffffff"
                        stroke="#52525b"
                        strokeWidth={2}
                        style={{
                          opacity: 0,
                          animation: "value-reveal 350ms ease-out forwards",
                          animationDelay: `${index * 90 + 2350}ms`,
                        }}
                      />
                      {isActive && (
                        <g className="pointer-events-none ">
                          <rect
                            x={tooltipX}
                            y={tooltipY }
                            width={tooltipWidth}
                            height={tooltipHeight}
                            rx={4}
                            fill=""
                          />
                          <text x={tooltipX + 10} y={tooltipY +18} fill="#ffffff" fontSize={11} fontWeight={600} className="flex items-center">
                            {item.month} · saldo {balance < 0 ? "-" : ""}€{Math.abs(balance).toFixed(1)}k
                          </text>
                        </g>
                      )}
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
              <div className="flex flex-col gap-3 ">
                {transactions.map((transaction) => (
                  <div
                    key={`${transaction.name}-${transaction.date}`}
                    className="flex items-center justify-between  pr-3 bg-zinc-100"
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

            <div className="bg-white">
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
                <div className="space-y-0 flex flex-col gap-2">
                  {goals.map((goal) => (
                    <div key={goal.name} className="bg-zinc-100 p-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-zinc-700">{goal.name}</span>
                        <span className="text-zinc-500">{goal.saved}</span>
                      </div>
                      <div className="h-2.5 rounded-sm overflow-hidden bg-zinc-100">
                        <div className="h-full rounded-sm bg-zinc-900" style={{ width: `${goal.progress}%` }} />
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
