"use client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Reads ficam "fresh" por 1min após o último fetch. Dentro dessa
            // janela, refetchOnMount / refetchOnWindowFocus / refetchOnReconnect
            // NÃO disparam — o cache é servido direto. Mutations que chamam
            // invalidateQueries forçam refetch independente do staleTime.
            staleTime: 60_000,
          },
        },
      })
  )
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
