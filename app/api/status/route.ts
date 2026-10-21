import { NextResponse } from "next/server";
import { getStatusData } from "@/lib/api/status";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getStatusData();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "X-Data-Status": data.overall,
    },
  });
}
