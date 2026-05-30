import { queryKeys } from "@/lib/query-keys"
import { CategoryService } from "@/services/category"
import { ExpenseService } from "@/services/expense"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { ExpensesTable } from "./components/expenses-table"

export default async function ExpensesPage() {
  const queryClient = new QueryClient()

  const [, categories] = await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.expenses.list(),
      queryFn: ExpenseService.getAllExpenses,
    }),
    CategoryService.getCategories(),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-8">
        <h1 className="mb-2 font-serif text-4xl font-bold italic">
          Meus Gastos
        </h1>
        <ExpensesTable categories={categories} />
      </div>
    </HydrationBoundary>
  )
}
