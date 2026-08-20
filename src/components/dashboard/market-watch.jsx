import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/dashboard/section-card";

export function MarketWatch({
  marketInput,
  onInputChange,
  onAddSymbol,
  onSearch,
  marketError,
  marketResults,
  isSearching,
  marketQuotes,
  isLoadingQuotes,
  onRemoveSymbol,
  formatPrice,
  formatPercent,
}) {
  return (
    <SectionCard
      title="Market watch"
      action={<span className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-500">Stocks + indices</span>}
    >
      <div className="space-y-4">
        <form
          className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            onAddSymbol(marketInput);
          }}
        >
          <label htmlFor="symbol-input" className="sr-only">Add symbol</label>
          <input
            id="symbol-input"
            value={marketInput}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Bijv. AAPL, SPX, NDX"
            className="h-10 border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-900"
          />
          <Button type="submit" variant="outline" className="h-10 cursor-pointer gap-2">
            <Plus size={14} />
            Voeg toe
          </Button>
          <Button type="button" variant="outline" onClick={onSearch} className="h-10 cursor-pointer gap-2">
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
                onClick={() => onAddSymbol(result.symbol)}
                className="flex w-full items-center justify-between px-2 py-1 text-left text-sm hover:bg-zinc-100"
              >
                <span className="font-medium text-zinc-800">{result.symbol}</span>
                <span className="text-xs text-zinc-500">{result.name} · {result.exchange}</span>
              </button>
            ))}
          </div>
        )}
        {isSearching && <p className="text-xs text-zinc-500">Zoeken...</p>}

        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {isLoadingQuotes && marketQuotes.length === 0
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="border border-zinc-200 bg-zinc-50 p-3 animate-pulse">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-2">
                      <div className="h-3 w-16 bg-zinc-200" />
                      <div className="h-4 w-24 bg-zinc-200" />
                    </div>
                    <div className="h-3 w-12 bg-zinc-200" />
                  </div>
                  <div className="mt-3 h-7 w-28 bg-zinc-200" />
                  <div className="mt-2 h-4 w-24 bg-zinc-200" />
                </div>
              ))
            : marketQuotes.map((quote) => {
                const isPositive = (quote.percentChange ?? 0) >= 0;

                return (
                  <div key={quote.symbol} className="border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{quote.symbol}</p>
                        <p className="text-sm font-medium text-zinc-800">{quote.name}</p>
                      </div>
                      <button type="button" onClick={() => onRemoveSymbol(quote.symbol)} className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 hover:text-zinc-900">
                        Remove
                      </button>
                    </div>
                    <p className="mt-2 text-xl font-semibold text-zinc-900">{formatPrice(quote.price, quote.currency)}</p>
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
  );
}