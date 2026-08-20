export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim();

  if (!query) {
    return Response.json({ results: [] });
  }

  const apiKey = process.env.TWELVEDATA_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: "Stel TWELVEDATA_API_KEY in om symbolen te zoeken.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/symbol_search?symbol=${encodeURIComponent(query)}&outputsize=8&apikey=${encodeURIComponent(apiKey)}`,
      {
        cache: "no-store",
      },
    );

    const payload = await response.json();

    if (!response.ok || payload.status === "error") {
      return Response.json(
        {
          error: payload.message || "Zoeken naar symbolen is mislukt.",
        },
        { status: 502 },
      );
    }

    const results = (payload.data || []).map((item) => ({
      symbol: item.symbol,
      name: item.instrument_name,
      exchange: item.exchange,
      type: item.instrument_type,
    }));

    return Response.json({ results });
  } catch {
    return Response.json(
      {
        error: "Netwerkfout tijdens zoeken naar symbolen.",
      },
      { status: 502 },
    );
  }
}
