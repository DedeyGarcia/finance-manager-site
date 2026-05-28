import { NextResponse } from "next/server"
import { ApiError } from "@/lib/api-client"

export async function forward<T>(
  fn: () => Promise<T>,
  status: number = 200
): Promise<NextResponse> {
  try {
    const data = await fn()
    if (status === 204) return new NextResponse(null, { status: 204 })
    return NextResponse.json(data, { status })
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
