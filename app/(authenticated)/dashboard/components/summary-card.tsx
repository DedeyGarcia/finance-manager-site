"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { useDashboard } from "../hooks/use-dashboard"

export default function SummaryCard() {
  const { data: dashboard } = useDashboard()

  const totalIncomes = parseFloat(dashboard.total_incomes)
  const totalExpenses = parseFloat(dashboard.total_expenses)

  const spentPercentage =
    totalIncomes > 0 ? (totalExpenses / totalIncomes) * 100 : 0

  return (
    <Card>
      <CardContent className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Ainda sobra esse mês
        </h3>
        <h1 className="font-serif text-3xl font-bold italic wrap-break-word sm:text-5xl">
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
          em débitos automáticos, gastos fixos e parcelas
        </p>

        <Field className="w-full">
          <FieldLabel htmlFor="spent-percentage" className="flex-wrap font-mono">
            <span>Já gastei · {spentPercentage.toFixed(2)}%</span>
            <span className="ml-auto">
              {formatCurrency(dashboard.total_expenses)} /{" "}
              {formatCurrency(dashboard.total_incomes)}
            </span>
          </FieldLabel>
          <Progress value={spentPercentage} id="spent-percentage" />
        </Field>

        <Separator orientation="horizontal" className="my-4" />

        <div className="flex flex-col sm:flex-row">
          <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-1 sm:gap-0">
            <div className="flex flex-col gap-1 sm:flex-1">
              <h4 className="text-sm text-muted-foreground">Déb. Automático</h4>
              <h2 className="font-mono text-lg font-medium">
                {formatCurrency(dashboard.total_automatic_expenses)}
              </h2>
            </div>
            <Separator
              orientation="vertical"
              className="mx-4 hidden sm:block"
            />
            <div className="flex flex-col gap-1 sm:flex-1">
              <h4 className="text-sm text-muted-foreground">Fixos</h4>
              <h2 className="font-mono text-lg font-medium">
                {formatCurrency(dashboard.total_fixed_expenses)}
              </h2>
            </div>
            <Separator
              orientation="vertical"
              className="mx-4 hidden sm:block"
            />
            <div className="flex flex-col gap-1 sm:flex-1">
              <h4 className="text-sm text-muted-foreground">Parcelas</h4>
              <h2 className="font-mono text-lg font-medium">
                {formatCurrency(dashboard.total_installment_expenses)}
              </h2>
            </div>
            <Separator
              orientation="vertical"
              className="mx-4 hidden sm:block"
            />
            <div className="flex flex-col gap-1 sm:flex-1">
              <h4 className="text-sm text-muted-foreground">Receitas</h4>
              <h2 className="font-mono text-lg font-medium">
                {formatCurrency(dashboard.total_incomes)}
              </h2>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
