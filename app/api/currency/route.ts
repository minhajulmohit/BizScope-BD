import { NextResponse } from "next/server";
import { getCurrencyData } from "@/lib/api/exchange-rates";
import { CURRENCY_CACHE_SECONDS } from "@/lib/api/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getCurrencyData();

  return NextResponse.json(data, {
    status: data.status === "ok" ? 200 : 502,
    headers: {
      "Cache-Control":
        data.status === "ok"
          ? `public, s-maxage=${CURRENCY_CACHE_SECONDS}, stale-while-revalidate=7200`
          : "no-store",
      "X-Data-Status": data.status,
      "X-Data-Cadence": "daily-third-party",
    },
  });
}
