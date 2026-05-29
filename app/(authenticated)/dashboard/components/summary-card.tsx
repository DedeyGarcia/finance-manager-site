"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
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
        <h1 className="text-4xl font-bold">
          {formatCurrency(dashboard.total_balance)}
        </h1>
        <p className="text-sm text-muted-foreground">
          de{" "}
          <strong className="text-sm font-medium text-card-foreground">
            {formatCurrency(dashboard.total_incomes)}
          </strong>{" "}
          que entram no mês, você irá gastar{" "}
          <strong className="text-sm font-medium text-card-foreground">
            {formatCurrency(dashboard.total_expenses)}
          </strong>{" "}
          em débitos automáticos, gastos fixos e parcelas
        </p>

        <Field className="w-full">
          <FieldLabel htmlFor="spent-percentage">
            <span>Já gastei · {spentPercentage.toFixed(2)}%</span>
            <span className="ml-auto">
              {formatCurrency(dashboard.total_expenses)} /{" "}
              {formatCurrency(dashboard.total_incomes)}
            </span>
          </FieldLabel>
          <Progress value={spentPercentage} id="spent-percentage" />
        </Field>
      </CardContent>
    </Card>
  )
}
