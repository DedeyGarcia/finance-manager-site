import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { ExpenseRead, ExpenseUpdate } from "@/types/expense"
import { NextRequest } from "next/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = (await request.json()) as ExpenseUpdate

  return forward(() =>
    apiFetch<ExpenseRead>(`/expenses/${id}`, { method: "PATCH", body })
  )
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return forward(() => apiFetch(`/expenses/${id}`, { method: "DELETE" }), 204)
}
