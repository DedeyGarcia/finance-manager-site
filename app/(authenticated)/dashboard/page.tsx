import { getCurrentMonth, monthToPeriod } from "@/lib/month-period"
import { queryKeys } from "@/lib/query-keys"
import { DashboardService } from "@/services/dashboard"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import SummaryCard from "./components/summary-card"

export default async function DashboardPage() {
  const queryClient = new QueryClient()
  const period = monthToPeriod(getCurrentMonth())

  await queryClient.prefetchQuery({
    queryKey: queryKeys.dashboard.summary(period),
    queryFn: () => DashboardService.getDashboard(period),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-8">
        <SummaryCard />
      </div>
    </HydrationBoundary>
  )
}
