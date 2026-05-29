import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { Dashboard } from "@/types/dashboard"
import { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const query = Object.fromEntries(request.nextUrl.searchParams)
  return forward(() => apiFetch<Dashboard>("/dashboard", { query }))
}
