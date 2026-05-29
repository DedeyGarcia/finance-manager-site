"use client"

import { Badge } from "@/components/ui/badge"
import { DataTableSortHeader } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/utils"
import type { IncomeRead } from "@/types/income"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { IncomeRowActions } from "./income-row-actions"

export const INCOME_TYPE_LABELS: Record<IncomeRead["income_type"], string> = {
  one_time: "Avulsa",
  recurring: "Recorrente",
}

function formatMonth(iso: string) {
  return format(new Date(`${iso}T00:00:00`), "MMM/yy", { locale: ptBR })
}

function formatVigencia(start: string, end: string | null) {
  return end ? `${formatMonth(start)} → ${formatMonth(end)}` : `${formatMonth(start)} → ∞`
}

export function getIncomeColumns(
  categoryName: (id: string | null) => string
): ColumnDef<IncomeRead>[] {
  return [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "income_type",
      header: ({ column }) => <DataTableSortHeader column={column} label="Tipo" />,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {INCOME_TYPE_LABELS[row.original.income_type]}
        </Badge>
      ),
      filterFn: "equals",
    },
    {
      accessorKey: "category_id",
      header: "Categoria",
      cell: ({ row }) => categoryName(row.original.category_id),
      filterFn: "equals",
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Valor" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">{formatCurrency(row.original.amount)}</span>
      ),
      sortingFn: (a, b) =>
        parseFloat(a.original.amount) - parseFloat(b.original.amount),
    },
    {
      accessorKey: "impact_start_date",
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Vigência" />
      ),
      cell: ({ row }) =>
        formatVigencia(row.original.impact_start_date, row.original.impact_end_date),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => <IncomeRowActions income={row.original} />,
    },
  ]
}
