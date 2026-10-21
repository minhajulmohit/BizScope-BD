import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDatasetCatalog } from "@/lib/api/opendatabd";
import { OPENDATABD_CATALOG_CACHE_SECONDS } from "@/lib/api/config";
import { clampInteger } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const MAX_QUERY_LENGTH = 80;
const MAX_CATEGORY_LENGTH = 80;
const MAX_LIMIT = 24;
const MAX_PAGE = 1000;

function cleanText(raw: string | null, maxLength: number): string {
  if (!raw) return "";
  return raw.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const query = cleanText(url.searchParams.get("q"), MAX_QUERY_LENGTH);
  const category = cleanText(
    url.searchParams.get("category"),
    MAX_CATEGORY_LENGTH,
  );
  const page = clampInteger(url.searchParams.get("page"), 1, 1, MAX_PAGE);
  const limit = clampInteger(
    url.searchParams.get("limit"),
    12,
    1,
    MAX_LIMIT,
  );

  const data = await getDatasetCatalog({ q: query, category, page, limit });

  return NextResponse.json(data, {
    status: data.status === "ok" ? 200 : 502,
    headers: {
      "Cache-Control":
        data.status === "ok"
          ? `public, s-maxage=${OPENDATABD_CATALOG_CACHE_SECONDS}, stale-while-revalidate=1800`
          : "no-store",
      "X-Data-Status": data.status,
      "X-Data-Cadence": "catalog-on-demand",
    },
  });
}
