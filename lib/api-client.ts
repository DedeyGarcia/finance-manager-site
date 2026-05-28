export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly message: string
  ) {
    super(
      `An error occurred while communicating with the API.\nStatus: ${status} Message: ${message}`
    )
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type FetchOptions = {
  method?: Method
  body?: unknown
  headers?: Record<string, string>
  next?: { revalidate?: number; tags?: string[] }
  timeoutInMs?: number
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    method = "GET",
    body,
    headers = {},
    next,
    timeoutInMs = 10_000,
  } = options

  let authHeader: Record<string, string> = {}
  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers")
    const token = (await cookies()).get("session_token")?.value
    if (token) authHeader = { Authorization: `Bearer ${token}` }
  }

  const url =
    typeof window === "undefined"
      ? `${process.env.FINANCE_MANAGER_API_URL}${path}`
      : path

  const isNativeBody =
    typeof body === "string" ||
    body instanceof URLSearchParams ||
    body instanceof FormData ||
    body instanceof Blob
  const serializedBody = body ? (isNativeBody ? (body as BodyInit) : JSON.stringify(body)) : undefined
  const defaultContentType: Record<string, string> = isNativeBody ? {} : { "Content-Type": "application/json" }

  const response = await fetch(url, {
    method,
    headers: {
      ...defaultContentType,
      ...authHeader,
      ...headers,
    },
    body: serializedBody,
    signal: AbortSignal.timeout(timeoutInMs),
    credentials: "include",
    ...(next ? { next } : {}),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    throw new ApiError(response.status, text)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}
