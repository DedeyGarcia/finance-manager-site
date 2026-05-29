import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type {
  ExpenseCreate,
  ExpenseListResponse,
  ExpenseRead,
} from "@/types/expense"
import { NextRequest } from "next/server"

export async function GET() {
  return forward(async () => {
    const res = await apiFetch<ExpenseListResponse>("/expenses/")
    return res.data
  })
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ExpenseCreate

  return forward(
    () =>
      apiFetch<ExpenseRead>("/expenses/", {
        method: "POST",
        body,
      }),
    201
  )
}
