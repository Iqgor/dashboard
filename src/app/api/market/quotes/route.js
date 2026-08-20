const SYMBOL_PATTERN = /^[A-Z0-9.\-:^]{1,20}$/;

function normalizeSymbol(value) {
  return value.trim().toUpperCase();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function serializeSymbolList(rawValue) {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(",")
    .map(normalizeSymbol)
    .filter((symbol) => SYMBOL_PATTERN.test(symbol));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const symbols = serializeSymbolList(searchParams.get("symbols"));

  if (symbols.length === 0) {
    return Response.json({ error: "Geen geldige symbolen ontvangen." }, { status: 400 });
  }

  const apiKey = process.env.TWELVEDATA_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: "Stel TWELVEDATA_API_KEY in om live marktdata op te halen.",
      },
      { status: 500 },
    );
  }

  const quoteResponses = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const response = await fetch(
          `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(apiKey)}`,
          {
            cache: "no-store",
          },
        );

        const payload = await response.json();

        if (!response.ok || payload.status === "error") {
          return {
            symbol,
            error: payload.message || "Onbekende API-fout",
          };
        }

        return {
          symbol: payload.symbol || symbol,
          name: payload.name || symbol,
          exchange: payload.exchange || "",
          currency: payload.currency || "USD",
          price: toNumber(payload.close),
          change: toNumber(payload.change),
          percentChange: toNumber(payload.percent_change),
        };
      } catch {
        return {
          symbol,
          error: "Netwerkfout tijdens ophalen van quote",
        };
      }
    }),
  );

  const quotes = quoteResponses.filter((item) => !item.error);
  const unavailable = quoteResponses.filter((item) => item.error);

  return Response.json({
    quotes,
    unavailable,
  });
}
