"use client"

import { DataTable } from "@/components/ui/data-table"
import { Input } from "@/components/ui/input"
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
import { useMemo } from "react"
import { useIncomes } from "../hooks/use-incomes"
import { INCOME_TYPE_LABELS, getIncomeColumns } from "./incomes-columns"

export function IncomesTable({ categories }: { categories: Category[] }) {
  const { data: incomes = [] } = useIncomes()
  const year = useMonthStore((state) => state.year)
  const month = useMonthStore((state) => state.month)

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((category) => [category.id, category.name]))
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—")
  }, [categories])

  const columns = useMemo(() => getIncomeColumns(categoryName), [categoryName])

  const monthLabel = format(new Date(year, month - 1, 1), "MMM/yy", {
    locale: ptBR,
  })

  return (
    <DataTable
      columns={columns}
      data={incomes}
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
              (table.getColumn("income_type")?.getFilterValue() as string) ?? "all"
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
            <SelectContent>
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
              (table.getColumn("category_id")?.getFilterValue() as string) ?? "all"
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
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      footer={(table) => {
        const { period_start, period_end } = monthToPeriod({ year, month })
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
            <TableCell colSpan={columns.length} className="font-mono">
              Receita prevista em {monthLabel}:{" "}
              <strong>{formatCurrency(total)}</strong>
            </TableCell>
          </TableRow>
        )
      }}
    />
  )
}
