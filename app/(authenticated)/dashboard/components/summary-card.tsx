"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { cn, formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useDashboard } from "../hooks/use-dashboard"

export default function SummaryCard() {
  const { data: dashboard, isPlaceholderData } = useDashboard()

  // Defensivo: não deve ocorrer após a hidratação (a key bate com o prefetch
  // do page.tsx); o loading.tsx cobre o carregamento inicial da rota.
  if (!dashboard) return null

  const totalIncomes = parseFloat(dashboard.total_incomes)
  const totalExpenses = parseFloat(dashboard.total_expenses)

  const spentPercentage =
    totalIncomes > 0 ? (totalExpenses / totalIncomes) * 100 : 0

  return (
    <Card
      className={cn(
        "transition-opacity",
        isPlaceholderData && "opacity-60"
      )}
    >
      <CardContent className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Ainda sobra esse mês
        </h3>
        <h1 className="font-serif text-3xl font-bold wrap-break-word italic sm:text-5xl">
          {formatCurrency(dashboard.total_balance)}
        </h1>
        <p className="text-sm text-muted-foreground">
          de{" "}
          <strong className="font-mono text-sm font-medium text-card-foreground">
            {formatCurrency(dashboard.total_incomes)}
          </strong>{" "}
          que entram no mês, você irá gastar{" "}
          <strong className="font-mono text-sm font-medium text-card-foreground">
            {formatCurrency(dashboard.total_expenses)}
          </strong>{" "}
          em débitos automáticos, gastos fixos, parcelas e compras avulsas
        </p>

        <Field className="w-full">
          <FieldLabel
            htmlFor="spent-percentage"
            className="flex-wrap font-mono"
          >
            <span>Já gastei · {spentPercentage.toFixed(2)}%</span>
            <span className="ml-auto">
              {formatCurrency(dashboard.total_expenses)} /{" "}
              {formatCurrency(dashboard.total_incomes)}
            </span>
          </FieldLabel>
          <Progress value={spentPercentage} id="spent-percentage" />
        </Field>

        <Separator orientation="horizontal" className="my-4" />

        <div className="grid grid-cols-2 gap-x-4 gap-y-5 md:grid-cols-3 xl:grid-cols-5 xl:divide-x">
          <div className="flex min-w-0 flex-col gap-1 xl:pr-4">
            <h4 className="text-sm text-muted-foreground">Déb. Automático</h4>
            <h2 className="font-mono text-lg font-medium wrap-break-word">
              {formatCurrency(dashboard.total_automatic_expenses)}
            </h2>
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:px-4">
            <h4 className="text-sm text-muted-foreground">Fixos</h4>
            <h2 className="font-mono text-lg font-medium wrap-break-word">
              {formatCurrency(dashboard.total_fixed_expenses)}
            </h2>
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:px-4">
            <h4 className="text-sm text-muted-foreground">Parcelas</h4>
            <h2 className="font-mono text-lg font-medium wrap-break-word">
              {formatCurrency(dashboard.total_installment_expenses)}
            </h2>
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:px-4">
            <h4 className="text-sm text-muted-foreground">Avulsos</h4>
            <h2 className="font-mono text-lg font-medium wrap-break-word">
              {formatCurrency(dashboard.total_one_time_expenses)}
            </h2>
          </div>
          <div className="flex min-w-0 flex-col gap-1 xl:pl-4">
            <h4 className="text-sm text-muted-foreground">Receitas</h4>
            <h2 className="font-mono text-lg font-medium wrap-break-word">
              {formatCurrency(dashboard.total_incomes)}
            </h2>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
