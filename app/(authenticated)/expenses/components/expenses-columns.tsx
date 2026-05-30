"use client"

import { DataTableSortHeader } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { getCurrentInstallment, getMonthlyImpact } from "@/lib/expense"
import { formatCurrency } from "@/lib/utils"
import type { Category } from "@/types/category"
import type { ExpenseRead } from "@/types/expense"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ExpenseRowActions } from "./expense-row-actions"

export const EXPENSE_TYPE_LABELS: Record<ExpenseRead["expense_type"], string> =
  {
    one_time: "Avulso",
    fixed: "Fixo",
    automatic_debit: "Débito automático",
    installment: "Parcela",
  }

function formatMonth(iso: string) {
  return format(new Date(`${iso}T00:00:00`), "MMM/yy", { locale: ptBR })
}

function formatDate(iso: string | null) {
  return iso
    ? format(new Date(`${iso}T00:00:00`), "dd/MM/yy", { locale: ptBR })
    : "—"
}

function formatVigencia(start: string, end: string | null) {
  return end
    ? `${formatMonth(start)} → ${formatMonth(end)}`
    : `${formatMonth(start)} → ∞`
}

function installmentLabel(
  expense: ExpenseRead,
  periodStart: string
): string | null {
  if (expense.expense_type !== "installment") return null
  const total = expense.installments_count
  const current = getCurrentInstallment(expense.impact_start_date, periodStart)
  if (current > total) return "Quitada"
  if (current < 1) return `${total}×`
  return `${current}/${total}`
}

export function getExpenseColumns(
  categoryName: (id: string | null) => string,
  categories: Category[],
  periodStart: string
): ColumnDef<ExpenseRead>[] {
  return [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      accessorKey: "expense_type",
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Tipo" />
      ),
      cell: ({ row }) => {
        const installment = installmentLabel(row.original, periodStart)
        return (
          <Badge variant="secondary">
            {EXPENSE_TYPE_LABELS[row.original.expense_type]}
            {installment && (
              <span className="font-mono text-muted-foreground">
                · {installment}
              </span>
            )}
          </Badge>
        )
      },
      filterFn: "equals",
    },
    {
      accessorKey: "category_id",
      header: "Categoria",
      cell: ({ row }) => categoryName(row.original.category_id),
      filterFn: "equals",
    },
    {
      accessorKey: "purchase_date",
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Compra" />
      ),
      cell: ({ row }) => formatDate(row.original.purchase_date),
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Valor total" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">{formatCurrency(row.original.amount)}</span>
      ),
      sortingFn: (a, b) =>
        parseFloat(a.original.amount) - parseFloat(b.original.amount),
    },
    {
      id: "monthly_impact",
      accessorFn: (row) => getMonthlyImpact(row),
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Impacto/mês" />
      ),
      cell: ({ row }) => (
        <span className="font-mono">
          {formatCurrency(getMonthlyImpact(row.original))}
        </span>
      ),
      sortingFn: "basic",
    },
    {
      accessorKey: "impact_start_date",
      header: ({ column }) => (
        <DataTableSortHeader column={column} label="Vigência" />
      ),
      cell: ({ row }) =>
        formatVigencia(
          row.original.impact_start_date,
          row.original.impact_end_date
        ),
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }) => (
        <ExpenseRowActions expense={row.original} categories={categories} />
      ),
    },
  ]
}
