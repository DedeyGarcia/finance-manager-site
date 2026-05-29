"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import { useDashboard } from "../hooks/use-dashboard"
import { Separator } from "@/components/ui/separator"

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
        <h1 className="font-serif text-5xl font-bold italic">
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
          <FieldLabel htmlFor="spent-percentage font-mono">
            <span>Já gastei · {spentPercentage.toFixed(2)}%</span>
            <span className="ml-auto">
              {formatCurrency(dashboard.total_expenses)} /{" "}
              {formatCurrency(dashboard.total_incomes)}
            </span>
          </FieldLabel>
          <Progress value={spentPercentage} id="spent-percentage" />
        </Field>

        <Separator orientation="horizontal" className="my-4" />

        <div className="flex flex-1">
          <div className="flex flex-1 flex-col gap-1">
            <h4 className="text-sm text-muted-foreground">Déb. Automático</h4>
            <h2 className="font-mono text-lg font-medium">
              {formatCurrency(dashboard.total_automatic_expenses)}
            </h2>
          </div>
          <Separator orientation="vertical" className="mx-4" />
          <div className="flex flex-1 flex-col gap-1">
            <h4 className="text-sm text-muted-foreground">Fixos</h4>
            <h2 className="font-mono text-lg font-medium">
              {formatCurrency(dashboard.total_fixed_expenses)}
            </h2>
          </div>
          <Separator orientation="vertical" className="mx-4" />
          <div className="flex flex-1 flex-col gap-1">
            <h4 className="text-sm text-muted-foreground">Parcelas</h4>
            <h2 className="font-mono text-lg font-medium">
              {formatCurrency(dashboard.total_installment_expenses)}
            </h2>
          </div>
          <Separator orientation="vertical" className="mx-4" />
          <div className="flex flex-1 flex-col gap-1">
            <h4 className="text-sm text-muted-foreground">Receitas</h4>
            <h2 className="font-mono text-lg font-medium">
              {formatCurrency(dashboard.total_incomes)}
            </h2>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
