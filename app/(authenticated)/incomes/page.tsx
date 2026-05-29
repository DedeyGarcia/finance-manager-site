import { queryKeys } from "@/lib/query-keys"
import { CategoryService } from "@/services/category"
import { IncomeService } from "@/services/income"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { IncomesTable } from "./components/incomes-table"

export default async function IncomesPage() {
  const queryClient = new QueryClient()

  const [, categories] = await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.incomes.list(),
      queryFn: IncomeService.getAllIncomes,
    }),
    CategoryService.getCategories(),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-8">
        <IncomesTable categories={categories} />
      </div>
    </HydrationBoundary>
  )
}
