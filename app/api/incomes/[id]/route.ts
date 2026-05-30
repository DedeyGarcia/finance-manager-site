import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { IncomeRead, IncomeUpdate } from "@/types/income"
import { NextRequest } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json()) as IncomeUpdate

  return forward(() =>
    apiFetch<IncomeRead>(`/incomes/${id}`, { method: "PATCH", body })
  )
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return forward(() => apiFetch(`/incomes/${id}`, { method: "DELETE" }), 204)
}
