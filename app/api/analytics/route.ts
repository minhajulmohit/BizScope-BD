import { NextResponse } from "next/server";
import { getAnalyticsData } from "@/lib/api/world-bank";
import { WORLD_BANK_CACHE_SECONDS } from "@/lib/api/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getAnalyticsData();

  const cacheControl =
    data.status === "ok"
      ? `public, s-maxage=${WORLD_BANK_CACHE_SECONDS}, stale-while-revalidate=86400`
      : data.status === "partial"
        ? "public, s-maxage=600, stale-while-revalidate=1800"
        : "no-store";

  return NextResponse.json(data, {
    status: data.status === "error" ? 503 : 200,
    headers: {
      "Cache-Control": cacheControl,
      "X-Data-Status": data.status,
      "X-Data-Cadence": "annual-periodic",
    },
  });
}
