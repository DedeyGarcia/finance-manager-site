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
import { isActiveInPeriod } from "@/lib/expense"
import { monthToPeriod } from "@/lib/month-period"
import { useMonthStore } from "@/lib/stores/month-store"
import { formatCurrency } from "@/lib/utils"
import type { Category } from "@/types/category"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useMemo, useState } from "react"
import { useIncomes } from "../hooks/use-incomes"
import { INCOME_TYPE_LABELS, getIncomeColumns } from "./incomes-columns"

export function IncomesTable({ categories }: { categories: Category[] }) {
  const { data: incomes = [] } = useIncomes()
  const year = useMonthStore((state) => state.year)
  const month = useMonthStore((state) => state.month)
  const [onlyActive, setOnlyActive] = useState(true)

  const incomeCategories = useMemo(
    () => categories.filter((category) => category.kind === "income"),
    [categories]
  )

  const categoryName = useMemo(() => {
    const map = new Map(
      incomeCategories.map((category) => [category.id, category.name])
    )
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—")
  }, [incomeCategories])

  const columns = useMemo(
    () => getIncomeColumns(categoryName, incomeCategories),
    [categoryName, incomeCategories]
  )

  const { period_start, period_end } = useMemo(
    () => monthToPeriod({ year, month }),
    [year, month]
  )

  const rows = useMemo(() => {
    if (!onlyActive) return incomes
    return incomes.filter((income) =>
      isActiveInPeriod(
        income.impact_start_date,
        income.impact_end_date,
        period_start!,
        period_end!
      )
    )
  }, [incomes, onlyActive, period_start, period_end])

  const monthLabel = format(new Date(year, month - 1, 1), "MMM/yy", {
    locale: ptBR,
  })

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyMessage="Nenhuma receita cadastrada."
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
              (table.getColumn("income_type")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("income_type")
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
              {Object.entries(INCOME_TYPE_LABELS).map(([value, label]) => (
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
              {incomeCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label htmlFor="incomes-only-active" className="cursor-pointer">
            <Checkbox
              id="incomes-only-active"
              checked={onlyActive}
              onCheckedChange={(checked) => setOnlyActive(checked === true)}
            />
            Somente vigentes em {monthLabel}
          </Label>
        </div>
      )}
      footer={(table) => {
        const total = table.getFilteredRowModel().rows.reduce((sum, row) => {
          const income = row.original
          return isActiveInPeriod(
            income.impact_start_date,
            income.impact_end_date,
            period_start!,
            period_end!
          )
            ? sum + parseFloat(income.amount)
            : sum
        }, 0)

        return (
          <TableRow>
            <TableCell colSpan={columns.length}>
              Receita prevista em {monthLabel}:{" "}
              <strong className="font-mono">{formatCurrency(total)}</strong>
            </TableCell>
          </TableRow>
        )
      }}
    />
  )
}
