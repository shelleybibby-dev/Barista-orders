import { NextResponse } from "next/server";
import { getPersistenceInfo } from "@/lib/storage-path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const persistence = getPersistenceInfo();
  return NextResponse.json({
    ok: true,
    persistence: persistence.kind,
    durable: persistence.durable,
    ordersPath: persistence.ordersPath,
  });
}
