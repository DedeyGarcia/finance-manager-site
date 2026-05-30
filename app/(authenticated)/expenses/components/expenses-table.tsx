"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TableCell, TableRow } from "@/components/ui/table"
import { getMonthlyImpact, isActiveInPeriod } from "@/lib/expense"
import { monthToPeriod } from "@/lib/month-period"
import { useMonthStore } from "@/lib/stores/month-store"
import { formatCurrency } from "@/lib/utils"
import type { Category } from "@/types/category"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useMemo, useState } from "react"
import { useExpenses } from "../hooks/use-expenses"
import { EXPENSE_TYPE_LABELS, getExpenseColumns } from "./expenses-columns"

export function ExpensesTable({ categories }: { categories: Category[] }) {
  const { data: expenses = [] } = useExpenses()
  const year = useMonthStore((state) => state.year)
  const month = useMonthStore((state) => state.month)
  const [onlyActive, setOnlyActive] = useState(true)

  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === "expense"),
    [categories]
  )

  const categoryName = useMemo(() => {
    const map = new Map(
      expenseCategories.map((category) => [category.id, category.name])
    )
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—")
  }, [expenseCategories])

  const { period_start, period_end } = useMemo(
    () => monthToPeriod({ year, month }),
    [year, month]
  )

  const rows = useMemo(() => {
    if (!onlyActive) return expenses
    return expenses.filter((expense) =>
      isActiveInPeriod(
        expense.impact_start_date,
        expense.impact_end_date ?? null,
        period_start!,
        period_end!
      )
    )
  }, [expenses, onlyActive, period_start, period_end])

  const columns = useMemo(
    () => getExpenseColumns(categoryName, expenseCategories, period_start!),
    [categoryName, expenseCategories, period_start]
  )

  const monthLabel = format(new Date(year, month - 1, 1), "MMM/yy", {
    locale: ptBR,
  })

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="Nenhum gasto cadastrado."
      toolbar={(table) => (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Buscar por título"
            value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("title")?.setFilterValue(event.target.value)
            }
            className="max-w-xs"
          />
          <Select
            value={
              (table.getColumn("expense_type")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("expense_type")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              avoidCollisions={false}
            >
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={
              (table.getColumn("category_id")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("category_id")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              side="bottom"
              align="start"
              avoidCollisions={false}
            >
              <SelectItem value="all">Todas as categorias</SelectItem>
              {expenseCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="expenses-only-active" className="cursor-pointer">
            <Checkbox
              id="expenses-only-active"
              checked={onlyActive}
              onCheckedChange={(checked) => setOnlyActive(checked === true)}
            />
            Somente vigentes em {monthLabel}
          </Label>
        </div>
      )}
      footer={(table) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => {
          const expense = row.original
          return isActiveInPeriod(
            expense.impact_start_date,
            expense.impact_end_date ?? null,
            period_start!,
            period_end!
          )
            ? sum + getMonthlyImpact(expense)
            : sum
        }, 0)

        return (
          <TableRow>
            <TableCell colSpan={columns.length}>
              Total de gastos em {monthLabel}:{" "}
              <strong className="font-mono">{formatCurrency(total)}</strong>
            </TableCell>
          </TableRow>
        )
      }}
    />
  )
}
