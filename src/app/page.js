"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, BarChart3, Bell, LayoutGrid, PiggyBank, Plus, TrendingUp, Wallet } from "lucide-react";
import { scaleBand, scaleLinear } from "@visx/scale";

import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/metric-card";
import { MarketWatch } from "@/components/dashboard/market-watch";
import { CashFlow } from "@/components/dashboard/cash-flow";
import { Spending } from "@/components/dashboard/spending";
import { Transactions } from "@/components/dashboard/transactions";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { SavingsGoals } from "@/components/dashboard/savings-goals";
import { bills, cashFlow, goals, kpis, navItems, spending, transactions } from "@/data/dashboard";

const defaultMarketSymbols = ["AAPL", "MSFT", "NVDA"];
const MARKET_QUOTES_CACHE_KEY = "marketQuotesCache.v1";
const MARKET_SEARCH_CACHE_KEY = "marketSearchCache.v1";
const QUOTES_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function readCache(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "{}");
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
  const cacheEntry = readCache(cacheKey)[itemKey];
  if (!cacheEntry || typeof cacheEntry.timestamp !== "number" || Date.now() - cacheEntry.timestamp > ttlMs) return null;
  return cacheEntry.data;
}

function setCachedValue(cacheKey, itemKey, data) {
  const cache = readCache(cacheKey);
  cache[itemKey] = { timestamp: Date.now(), data };
  writeCache(cacheKey, cache);
}

function normalizeSymbolInput(value) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function formatPrice(value, currency = "USD") {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "N/A";
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
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
  const maxCashFlow = Math.max(...cashFlow.flatMap((item) => [item.income, item.expense]), 8);
  const minBalance = Math.min(...balances, 0);
  const maxBalance = Math.max(maxCashFlow, ...balances, 0);
  const xScale = scaleBand({ domain: cashFlow.map((item) => item.month), range: [chartLeft, chartWidth - chartRight], padding: 0.3 });
  const yScale = scaleLinear({ domain: [minBalance - 1, maxBalance + 1], range: [plotBottom, 24] });
  const chart = { chartWidth, chartHeight, chartLeft, chartRight, plotBottom, xScale, yScale, yTicks: yScale.ticks(5) };
  const navIcons = { Overview: LayoutGrid, Accounts: Wallet, Transactions: ArrowUpRight, Budget: BarChart3, Goals: PiggyBank, Reports: TrendingUp };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setShowMobileNav(currentScrollY <= 0 || currentScrollY < previousScrollY.current);
      previousScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    async function fetchQuotes() {
      if (watchSymbols.length === 0) { setMarketQuotes([]); return; }
      const symbolsKey = watchSymbols.join(",");
      const cachedQuotes = getCachedValue(MARKET_QUOTES_CACHE_KEY, symbolsKey, QUOTES_CACHE_TTL_MS);
      if (cachedQuotes) { setMarketQuotes(cachedQuotes); setMarketError(""); return; }
      setIsLoadingQuotes(true);
      try {
        const response = await fetch(`/api/market/quotes?symbols=${encodeURIComponent(symbolsKey)}`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Kon marktdata niet ophalen.");
        if (!isCancelled) { setMarketQuotes(payload.quotes || []); setCachedValue(MARKET_QUOTES_CACHE_KEY, symbolsKey, payload.quotes || []); setMarketError(""); }
      } catch (error) {
        if (!isCancelled) setMarketError(error.message || "Kon marktdata niet ophalen.");
      } finally {
        if (!isCancelled) setIsLoadingQuotes(false);
      }
    }
    fetchQuotes();
    return () => { isCancelled = true; };
  }, [watchSymbols]);

  const handleAddSymbol = (value) => {
    const normalizedSymbol = normalizeSymbolInput(value);
    if (!normalizedSymbol) return;
    if (watchSymbols.includes(normalizedSymbol)) { setMarketError(`${normalizedSymbol} staat al in je watchlist.`); return; }
    setWatchSymbols((currentSymbols) => [...currentSymbols, normalizedSymbol]);
    setMarketInput(""); setMarketResults([]); setLastSearchQuery(""); setMarketError("");
  };

  const handleSearchSymbols = useCallback(async (searchTerm) => {
    const query = normalizeSymbolInput(searchTerm ?? marketInput);
    if (!query) { setMarketResults([]); setLastSearchQuery(""); return; }
    if (query === lastSearchQuery) return;
    const cachedSearchResults = getCachedValue(MARKET_SEARCH_CACHE_KEY, query, SEARCH_CACHE_TTL_MS);
    if (cachedSearchResults) { setMarketResults(cachedSearchResults); setLastSearchQuery(query); setMarketError(""); return; }
    setIsSearchingSymbols(true);
    try {
      const response = await fetch(`/api/market/search?query=${encodeURIComponent(query)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Kon symbolen niet zoeken.");
      setMarketResults(payload.results || []); setCachedValue(MARKET_SEARCH_CACHE_KEY, query, payload.results || []); setLastSearchQuery(query); setMarketError("");
    } catch (error) {
      setMarketResults([]); setMarketError(error.message || "Kon symbolen niet zoeken.");
    } finally {
      setIsSearchingSymbols(false);
    }
  }, [lastSearchQuery, marketInput]);

  useEffect(() => {
    const query = normalizeSymbolInput(marketInput);
    if (!query) return undefined;
    const debounceTimeout = setTimeout(() => handleSearchSymbols(query), 450);
    return () => clearTimeout(debounceTimeout);
  }, [handleSearchSymbols, marketInput]);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto border-r bg-white p-5 lg:block">
          <nav className="space-y-0">{navItems.map((item) => { const Icon = navIcons[item.label] || LayoutGrid; return <button key={item.label} className={`group flex w-full items-center justify-between px-3 py-2 text-left text-sm transition ${item.active ? "bg-zinc-900 text-white" : "cursor-pointer text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}><span>{item.label}</span><span className={`flex items-center transition-opacity ${item.active ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}><Icon size={14} /></span></button>; })}</nav>
          <div className="mt-10 bg-zinc-50 p-4"><div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-zinc-500"><span>Net cash</span><PiggyBank size={14} /></div><div className="text-2xl font-semibold">€18,640</div></div>
        </aside>
        <main className="flex-1 space-y-0">
          <header className="sticky top-0">
            <div className="relative z-10 border-b bg-white p-4 md:p-5"><div className="flex flex-col md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Good morning Igor</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Financial overview</h1></div><div className="flex flex-col gap-2 sm:flex-row sm:items-center"><Button variant="outline" size="sm" className="cursor-pointer gap-2"><Plus size={14} />Add account</Button><button className="flex h-9 w-9 items-center justify-center bg-zinc-50 text-zinc-600"><Bell size={16} /></button></div></div></div>
            <nav className={`relative z-0 grid grid-cols-3 border-b bg-white transition-transform duration-300 ease-out lg:hidden ${showMobileNav ? "translate-y-0" : "-translate-y-full"}`}>{navItems.map((item) => { const Icon = navIcons[item.label] || LayoutGrid; const isActive = activeNav === item.label; return <button key={`mobile-${item.label}`} type="button" aria-pressed={isActive} onClick={() => setActiveNav(item.label)} className={`group flex min-h-12 items-center justify-center gap-2 px-2 py-3 text-xs transition ${isActive ? "bg-zinc-900 text-white" : "cursor-pointer text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"}`}><Icon size={14} /><span>{item.label}</span></button>; })}</nav>
          </header>
          <section className="grid border-b md:grid-cols-2 xl:grid-cols-4">{kpis.map((item) => <MetricCard key={item.label} {...item} />)}</section>
          <section className="grid border-b"><MarketWatch marketInput={marketInput} onInputChange={(value) => { setMarketInput(value); if (!normalizeSymbolInput(value)) { setMarketResults([]); setLastSearchQuery(""); setMarketError(""); } }} onAddSymbol={handleAddSymbol} onSearch={() => handleSearchSymbols()} marketError={marketError} marketResults={marketResults} isSearching={isSearchingSymbols} marketQuotes={marketQuotes} isLoadingQuotes={isLoadingQuotes} onRemoveSymbol={(symbol) => setWatchSymbols((currentSymbols) => currentSymbols.filter((currentSymbol) => currentSymbol !== symbol))} formatPrice={formatPrice} formatPercent={formatPercent} /></section>
          <section className="grid xl:grid-cols-[1.5fr_0.9fr]"><CashFlow cashFlow={cashFlow} activeBalance={activeBalance} onBalanceChange={setActiveBalance} chart={chart} /><Spending spending={spending} donutRadius={68} /></section>
          <section className="grid xl:grid-cols-[1.3fr_0.7fr]"><Transactions transactions={transactions} /><div className="bg-white"><UpcomingBills bills={bills} /><SavingsGoals goals={goals} /></div></section>
        </main>
      </div>
    </div>
  );
}
