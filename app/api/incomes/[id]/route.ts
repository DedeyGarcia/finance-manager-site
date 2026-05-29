import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import { NextRequest } from "next/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return forward(() => apiFetch(`/incomes/${id}`, { method: "DELETE" }), 204)
}
