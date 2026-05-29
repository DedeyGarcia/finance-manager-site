import { queryKeys } from "@/lib/query-keys"
import { DashboardService } from "@/services/dashboard"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { Suspense } from "react"
import SummaryCard from "./components/summary-card"

export default async function DashboardPage() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: () => DashboardService.getDashboard(),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-8">
        <Suspense fallback={null}>
          <SummaryCard />
        </Suspense>
      </div>
    </HydrationBoundary>
  )
}
