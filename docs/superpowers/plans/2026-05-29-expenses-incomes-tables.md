# Tabelas de Gastos e Receitas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir as telas `/expenses` e `/incomes` como tabelas (lista-mestre) com busca/filtro/ordenação/paginação client-side, exclusão com confirmação, rodapé com total ciente do mês, e navegação na sidebar.

**Architecture:** Prefetch SSR (`prefetchQuery` + `HydrationBoundary`) + leitura client-side com TanStack Query, e TanStack Table (padrão shadcn radix Data Table) fazendo todo o trabalho de tabela no navegador. Mutations de exclusão via rota proxy do Next com optimistic update. Total do rodapé calculado no cliente a partir das linhas filtradas, usando a regra de período do domínio.

**Tech Stack:** Next.js 16 App Router, React 19, TanStack Query, TanStack Table v8, shadcn/ui (radix), Tailwind v4, date-fns, zustand.

**Verificação:** O projeto **não possui runner de testes** (sem vitest/jest nem script de teste). A verificação de cada tarefa usa `npm run typecheck` e `npm run lint`; a tarefa final roda `npm run build` + smoke manual no app via `npm run dev`. Não introduzir framework de teste — fora de escopo.

**Spec de referência:** [docs/superpowers/specs/2026-05-29-expenses-incomes-tables-design.md](../specs/2026-05-29-expenses-incomes-tables-design.md)

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `lib/expense.ts` (criar) | `getMonthlyImpact` + `isActiveInPeriod` (lógica pura compartilhada) |
| `app/(authenticated)/dashboard/hooks/use-create-expense.ts` (modificar) | passar a importar `getMonthlyImpact` |
| `types/expense.ts` / `types/income.ts` (modificar) | + tipo da resposta de lista |
| `lib/query-keys.ts` (modificar) | + chaves `expenses` e `incomes` |
| `components/ui/badge.tsx` / `components/ui/alert-dialog.tsx` (criar via shadcn) | primitivos novos |
| `services/expense.ts` / `services/income.ts` (criar) | leitura server-only de `/expenses/` e `/incomes/` |
| `app/api/expenses/route.ts` / `app/api/incomes/route.ts` (modificar) | proxy GET + POST |
| `app/api/expenses/[id]/route.ts` / `app/api/incomes/[id]/route.ts` (criar) | proxy DELETE (204) |
| `components/ui/data-table.tsx` (criar) | `<DataTable>` genérico + `DataTableSortHeader` |
| `app/(authenticated)/expenses/**` (criar) | hooks, colunas, botão excluir, tabela, page, loading |
| `app/(authenticated)/incomes/**` (criar) | espelho (sem coluna impacto/mês) |
| `components/app-sidebar.tsx` (modificar) | navegação |
| `app/(authenticated)/dashboard/components/month-selector.tsx` (modificar) | desacoplar spinner do dashboard |
| `app/(authenticated)/layout.tsx` (modificar) | TODO de reorganização adiada |

---

## Task 1: Helpers compartilhados + tipos + query-keys

**Files:**
- Create: `lib/expense.ts`
- Modify: `types/expense.ts`, `types/income.ts`, `lib/query-keys.ts`
- Modify: `app/(authenticated)/dashboard/hooks/use-create-expense.ts`

- [ ] **Step 1: Criar `lib/expense.ts`**

```ts
import type { ExpenseRead } from "@/types/expense"

type MonthlyImpactInput = {
  amount: string | number
  expense_type: ExpenseRead["expense_type"]
  installments_count: number | null
}

/** Impacto mensal: amount/installments para parcelamento; senão o amount cheio. */
export function getMonthlyImpact(expense: MonthlyImpactInput): number {
  const amount =
    typeof expense.amount === "string" ? parseFloat(expense.amount) : expense.amount
  if (
    expense.expense_type === "installment" &&
    expense.installments_count &&
    expense.installments_count > 0
  ) {
    return amount / expense.installments_count
  }
  return amount
}

/**
 * Regra de período do domínio (CLAUDE.md):
 *   start <= periodEnd && (end === null || end >= periodStart)
 * Datas em ISO "yyyy-MM-dd" — comparação lexicográfica é equivalente à cronológica.
 */
export function isActiveInPeriod(
  impactStart: string,
  impactEnd: string | null,
  periodStart: string,
  periodEnd: string
): boolean {
  return (
    impactStart <= periodEnd && (impactEnd === null || impactEnd >= periodStart)
  )
}
```

- [ ] **Step 2: Adicionar o tipo de resposta de lista em `types/expense.ts`**

Arquivo final:

```ts
import type { components } from "@/docs/api.types"

export type ExpenseCreate = components["schemas"]["ExpenseCreate"]
export type ExpenseRead = components["schemas"]["ExpenseRead"]
export type ExpenseListResponse =
  components["schemas"]["RawListResponse_ExpenseRead_"]
```

- [ ] **Step 3: Idem em `types/income.ts`**

Arquivo final:

```ts
import type { components } from "@/docs/api.types"

export type IncomeCreate = components["schemas"]["IncomeCreate"]
export type IncomeRead = components["schemas"]["IncomeRead"]
export type IncomeListResponse =
  components["schemas"]["RawListResponse_IncomeRead_"]
```

- [ ] **Step 4: Adicionar chaves em `lib/query-keys.ts`**

Substituir o objeto `queryKeys` (mantendo o bloco `dashboard`) por:

```ts
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    summary: (params?: DashboardQueryParams) =>
      [...queryKeys.dashboard.all, params ?? {}] as const,
  },
  expenses: {
    all: ["expenses"] as const,
    list: () => [...queryKeys.expenses.all, "list"] as const,
  },
  incomes: {
    all: ["incomes"] as const,
    list: () => [...queryKeys.incomes.all, "list"] as const,
  },
}
```

- [ ] **Step 5: Refatorar `use-create-expense.ts` para usar o helper**

Remover a função local `getMonthlyImpact` (linhas 17-22) e importar do helper. No topo, adicionar:

```ts
import { getMonthlyImpact } from "@/lib/expense"
```

Remover o bloco:

```ts
function getMonthlyImpact(expense: ExpenseCreate) {
  const amount = toMoney(expense.amount)
  return expense.expense_type === "installment"
    ? amount / expense.installments_count
    : amount
}
```

A função `toMoney` continua usada em `applyOptimisticExpense`; **não remover**. O resto do arquivo permanece igual (o `getMonthlyImpact` importado tem assinatura compatível com `ExpenseCreate`).

- [ ] **Step 6: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 7: Commit**

```bash
git add lib/expense.ts types/expense.ts types/income.ts lib/query-keys.ts "app/(authenticated)/dashboard/hooks/use-create-expense.ts"
git commit -m "feat: add expense/income shared helpers, list types and query keys"
```

---

## Task 2: Primitivos shadcn (badge, alert-dialog)

**Files:**
- Create: `components/ui/badge.tsx`, `components/ui/alert-dialog.tsx`

- [ ] **Step 1: Adicionar via shadcn CLI**

Run: `npx shadcn@latest add badge alert-dialog --yes`
Expected: cria `components/ui/badge.tsx` e `components/ui/alert-dialog.tsx`. Se a CLI perguntar sobre sobrescrever algo existente, recusar (só queremos os dois novos).

- [ ] **Step 2: Verificar que os arquivos existem e tipam**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/badge.tsx components/ui/alert-dialog.tsx components.json
git commit -m "feat: add shadcn badge and alert-dialog primitives"
```

---

## Task 3: Services server-only

**Files:**
- Create: `services/expense.ts`, `services/income.ts`

- [ ] **Step 1: Criar `services/expense.ts`**

```ts
import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { ExpenseListResponse, ExpenseRead } from "@/types/expense"

export const ExpenseService = {
  getAllExpenses: async (): Promise<ExpenseRead[]> => {
    const res = await apiFetch<ExpenseListResponse>("/expenses/")
    return res.data
  },
}
```

- [ ] **Step 2: Criar `services/income.ts`**

```ts
import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { IncomeListResponse, IncomeRead } from "@/types/income"

export const IncomeService = {
  getAllIncomes: async (): Promise<IncomeRead[]> => {
    const res = await apiFetch<IncomeListResponse>("/incomes/")
    return res.data
  },
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add services/expense.ts services/income.ts
git commit -m "feat: add expense/income server services for full lists"
```

---

## Task 4: Rotas proxy do Next

**Files:**
- Modify: `app/api/expenses/route.ts`, `app/api/incomes/route.ts`
- Create: `app/api/expenses/[id]/route.ts`, `app/api/incomes/[id]/route.ts`

> Importante: não usar `/expenses/all` nem `/incomes/all`; esses endpoints são de teste. A lista autenticada usa `GET /expenses/` e `GET /incomes/`.

- [ ] **Step 1: adicionar `GET` em `app/api/expenses/route.ts`** (desembrulha `.data` para casar com o hook client-side)

```ts
import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { ExpenseCreate, ExpenseListResponse, ExpenseRead } from "@/types/expense"
import { NextRequest } from "next/server"

export async function GET() {
  return forward(async () => {
    const res = await apiFetch<ExpenseListResponse>("/expenses/")
    return res.data
  })
}
```

- [ ] **Step 2: `app/api/expenses/[id]/route.ts`**

```ts
import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import { NextRequest } from "next/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return forward(() => apiFetch(`/expenses/${id}`, { method: "DELETE" }), 204)
}
```

- [ ] **Step 3: adicionar `GET` em `app/api/incomes/route.ts`**

```ts
import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import type { IncomeCreate, IncomeListResponse, IncomeRead } from "@/types/income"
import { NextRequest } from "next/server"

export async function GET() {
  return forward(async () => {
    const res = await apiFetch<IncomeListResponse>("/incomes/")
    return res.data
  })
}
```

- [ ] **Step 4: `app/api/incomes/[id]/route.ts`**

```ts
import { apiFetch } from "@/lib/api-client"
import { forward } from "@/lib/forward"
import { NextRequest } from "next/server"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return forward(() => apiFetch(`/incomes/${id}`, { method: "DELETE" }), 204)
}
```

- [ ] **Step 5: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 6: Commit**

```bash
git add app/api/expenses app/api/incomes
git commit -m "feat: add proxy routes for listing all and deleting expenses/incomes"
```

---

## Task 5: Componente `DataTable` genérico

**Files:**
- Create: `components/ui/data-table.tsx`

> Segue o padrão canônico shadcn radix Data Table. Controles de paginação usam `Button` (prev/próxima), como na referência shadcn — substitui a menção a `pagination.tsx` do spec, que é para links numerados.

- [ ] **Step 1: Criar `components/ui/data-table.tsx`**

```tsx
"use client"

import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDownIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  toolbar?: (table: TanstackTable<TData>) => React.ReactNode
  footer?: (table: TanstackTable<TData>) => React.ReactNode
  emptyMessage?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbar,
  footer,
  emptyMessage = "Nenhum resultado.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    initialState: { pagination: { pageSize: 25 } },
    state: { sorting, columnFilters },
  })

  return (
    <div className="space-y-4">
      {toolbar?.(table)}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {footer ? <TableFooter>{footer(table)}</TableFooter> : null}
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} item(ns)
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Header de coluna ordenável reutilizável. */
export function DataTableSortHeader<TData, TValue>({
  column,
  label,
}: {
  column: Column<TData, TValue>
  label: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      className="-ml-3 h-8"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {label}
      <ArrowUpDownIcon className="ml-2 size-4" />
    </Button>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add components/ui/data-table.tsx
git commit -m "feat: add generic DataTable component with sortable header"
```

---

## Task 6: Hooks de gastos (read + delete)

**Files:**
- Create: `app/(authenticated)/expenses/hooks/use-expenses.ts`
- Create: `app/(authenticated)/expenses/hooks/use-delete-expense.ts`

- [ ] **Step 1: `use-expenses.ts`**

```tsx
"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ExpenseRead } from "@/types/expense"
import { useQuery } from "@tanstack/react-query"

export function useExpenses() {
  return useQuery({
    queryKey: queryKeys.expenses.list(),
    queryFn: () => apiFetch<ExpenseRead[]>("/api/expenses"),
  })
}
```

- [ ] **Step 2: `use-delete-expense.ts`** (optimistic + invalida dashboard)

```tsx
"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { ExpenseRead } from "@/types/expense"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/expenses/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses.list() })
      const previous = queryClient.getQueryData<ExpenseRead[]>(
        queryKeys.expenses.list()
      )
      queryClient.setQueryData<ExpenseRead[]>(
        queryKeys.expenses.list(),
        (current) => current?.filter((expense) => expense.id !== id)
      )
      return { previous }
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.expenses.list(), context.previous)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.expenses.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/expenses/hooks"
git commit -m "feat: add expenses read and delete hooks"
```

---

## Task 7: Botão de exclusão de gasto

**Files:**
- Create: `app/(authenticated)/expenses/components/delete-expense-button.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { ExpenseRead } from "@/types/expense"
import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useDeleteExpense } from "../hooks/use-delete-expense"

export function DeleteExpenseButton({ expense }: { expense: ExpenseRead }) {
  const [open, setOpen] = useState(false)
  const deleteExpense = useDeleteExpense()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Excluir ${expense.title}`}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{expense.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteExpense.mutate(expense.id)}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/expenses/components/delete-expense-button.tsx"
git commit -m "feat: add delete-expense confirmation button"
```

---

## Task 8: Colunas de gastos

**Files:**
- Create: `app/(authenticated)/expenses/components/expenses-columns.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
"use client"

import { DataTableSortHeader } from "@/components/ui/data-table"
import { Badge } from "@/components/ui/badge"
import { getMonthlyImpact } from "@/lib/expense"
import { formatCurrency } from "@/lib/utils"
import type { ExpenseRead } from "@/types/expense"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const EXPENSE_TYPE_LABELS: Record<ExpenseRead["expense_type"], string> = {
  one_time: "Avulsa",
  fixed: "Fixo",
  automatic_debit: "Débito automático",
  installment: "Parcela",
}

function formatMonth(iso: string) {
  return format(new Date(`${iso}T00:00:00`), "MMM/yy", { locale: ptBR })
}

function formatVigencia(start: string, end: string | null) {
  return end ? `${formatMonth(start)} → ${formatMonth(end)}` : `${formatMonth(start)} → ∞`
}

export function getExpenseColumns(
  categoryName: (id: string | null) => string
): ColumnDef<ExpenseRead>[] {
  return [
    {
      accessorKey: "title",
      header: "Título",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "expense_type",
      header: ({ column }) => <DataTableSortHeader column={column} label="Tipo" />,
      cell: ({ row }) => (
        <Badge variant="secondary">
          {EXPENSE_TYPE_LABELS[row.original.expense_type]}
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
        formatVigencia(row.original.impact_start_date, row.original.impact_end_date),
    },
    {
      id: "actions",
      cell: ({ row }) => <DeleteExpenseButton expense={row.original} />,
    },
  ]
}
```

- [ ] **Step 2: Adicionar o import do botão de exclusão (topo do arquivo)**

```tsx
import { DeleteExpenseButton } from "./delete-expense-button"
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/expenses/components/expenses-columns.tsx"
git commit -m "feat: add expenses table column definitions"
```

---

## Task 9: Componente da tabela de gastos (toolbar + rodapé do mês)

**Files:**
- Create: `app/(authenticated)/expenses/components/expenses-table.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
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
import { getMonthlyImpact, isActiveInPeriod } from "@/lib/expense"
import { monthToPeriod } from "@/lib/month-period"
import { useMonthStore } from "@/lib/stores/month-store"
import { formatCurrency } from "@/lib/utils"
import type { Category } from "@/types/category"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useMemo } from "react"
import { useExpenses } from "../hooks/use-expenses"
import { EXPENSE_TYPE_LABELS, getExpenseColumns } from "./expenses-columns"

export function ExpensesTable({ categories }: { categories: Category[] }) {
  const { data: expenses = [] } = useExpenses()
  const year = useMonthStore((state) => state.year)
  const month = useMonthStore((state) => state.month)

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((category) => [category.id, category.name]))
    return (id: string | null) => (id ? (map.get(id) ?? "—") : "—")
  }, [categories])

  const columns = useMemo(() => getExpenseColumns(categoryName), [categoryName])

  const monthLabel = format(new Date(year, month - 1, 1), "MMM/yy", {
    locale: ptBR,
  })

  return (
    <DataTable
      columns={columns}
      data={expenses}
      emptyMessage="Nenhuma despesa cadastrada."
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
              (table.getColumn("expense_type")?.getFilterValue() as string) ?? "all"
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
            <SelectContent>
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
          const expense = row.original
          return isActiveInPeriod(
            expense.impact_start_date,
            expense.impact_end_date,
            period_start,
            period_end
          )
            ? sum + getMonthlyImpact(expense)
            : sum
        }, 0)

        return (
          <TableRow>
            <TableCell colSpan={columns.length} className="font-mono">
              Comprometido em {monthLabel}:{" "}
              <strong>{formatCurrency(total)}</strong>
            </TableCell>
          </TableRow>
        )
      }}
    />
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/expenses/components/expenses-table.tsx"
git commit -m "feat: add expenses table with toolbar filters and month-aware total"
```

---

## Task 10: Página e loading de gastos

**Files:**
- Create: `app/(authenticated)/expenses/page.tsx`, `app/(authenticated)/expenses/loading.tsx`

- [ ] **Step 1: `page.tsx`** (prefetch + categorias + HydrationBoundary)

```tsx
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
        <ExpensesTable categories={categories} />
      </div>
    </HydrationBoundary>
  )
}
```

- [ ] **Step 2: `loading.tsx`** (skeleton)

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-8">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-96 w-full rounded-md" />
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/expenses/page.tsx" "app/(authenticated)/expenses/loading.tsx"
git commit -m "feat: add expenses page with SSR prefetch and loading skeleton"
```

---

## Task 11: Hooks de receitas (read + delete)

**Files:**
- Create: `app/(authenticated)/incomes/hooks/use-incomes.ts`
- Create: `app/(authenticated)/incomes/hooks/use-delete-income.ts`

- [ ] **Step 1: `use-incomes.ts`**

```tsx
"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { IncomeRead } from "@/types/income"
import { useQuery } from "@tanstack/react-query"

export function useIncomes() {
  return useQuery({
    queryKey: queryKeys.incomes.list(),
    queryFn: () => apiFetch<IncomeRead[]>("/api/incomes"),
  })
}
```

- [ ] **Step 2: `use-delete-income.ts`**

```tsx
"use client"

import { apiFetch } from "@/lib/api-client"
import { queryKeys } from "@/lib/query-keys"
import type { IncomeRead } from "@/types/income"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export function useDeleteIncome() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/incomes/${id}`, { method: "DELETE" }),

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.incomes.list() })
      const previous = queryClient.getQueryData<IncomeRead[]>(
        queryKeys.incomes.list()
      )
      queryClient.setQueryData<IncomeRead[]>(
        queryKeys.incomes.list(),
        (current) => current?.filter((income) => income.id !== id)
      )
      return { previous }
    },

    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.incomes.list(), context.previous)
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.incomes.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/incomes/hooks"
git commit -m "feat: add incomes read and delete hooks"
```

---

## Task 12: Botão de exclusão de receita

**Files:**
- Create: `app/(authenticated)/incomes/components/delete-income-button.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import type { IncomeRead } from "@/types/income"
import { Trash2Icon } from "lucide-react"
import { useState } from "react"
import { useDeleteIncome } from "../hooks/use-delete-income"

export function DeleteIncomeButton({ income }: { income: IncomeRead }) {
  const [open, setOpen] = useState(false)
  const deleteIncome = useDeleteIncome()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Excluir ${income.title}`}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{income.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => deleteIncome.mutate(income.id)}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/incomes/components/delete-income-button.tsx"
git commit -m "feat: add delete-income confirmation button"
```

---

## Task 13: Colunas de receitas

**Files:**
- Create: `app/(authenticated)/incomes/components/incomes-columns.tsx`

> Sem coluna "impacto/mês" (receita não parcela). Tipo usa o mapa de `income_type`.

- [ ] **Step 1: Criar o arquivo**

```tsx
"use client"

import { Badge } from "@/components/ui/badge"
import { DataTableSortHeader } from "@/components/ui/data-table"
import { formatCurrency } from "@/lib/utils"
import type { IncomeRead } from "@/types/income"
import type { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DeleteIncomeButton } from "./delete-income-button"

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
      cell: ({ row }) => <DeleteIncomeButton income={row.original} />,
    },
  ]
}
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/incomes/components/incomes-columns.tsx"
git commit -m "feat: add incomes table column definitions"
```

---

## Task 14: Componente da tabela de receitas

**Files:**
- Create: `app/(authenticated)/incomes/components/incomes-table.tsx`

> Total do rodapé = soma do `amount` dos registros ativos no mês (receita não tem impacto parcelado).

- [ ] **Step 1: Criar o componente**

```tsx
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
            period_start,
            period_end
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
```

- [ ] **Step 2: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add "app/(authenticated)/incomes/components/incomes-table.tsx"
git commit -m "feat: add incomes table with toolbar filters and month-aware total"
```

---

## Task 15: Página e loading de receitas

**Files:**
- Create: `app/(authenticated)/incomes/page.tsx`, `app/(authenticated)/incomes/loading.tsx`

- [ ] **Step 1: `page.tsx`**

```tsx
import { queryKeys } from "@/lib/query-keys"
import { CategoryService } from "@/services/category"
import { IncomeService } from "@/services/income"
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query"
import { IncomesTable } from "./components/incomes-table"

export default async function IncomesPage() {
  const queryClient = new QueryClient()

  const [, categories] = await Promise.all([
    queryClient.prefetchQuery({
      queryKey: queryKeys.incomes.list(),
      queryFn: IncomeService.getAllIncomes,
    }),
    CategoryService.getCategories(),
  ])

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="flex flex-1 flex-col px-4 py-4 sm:px-8">
        <IncomesTable categories={categories} />
      </div>
    </HydrationBoundary>
  )
}
```

- [ ] **Step 2: `loading.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-8">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-96 w-full rounded-md" />
    </div>
  )
}
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/incomes/page.tsx" "app/(authenticated)/incomes/loading.tsx"
git commit -m "feat: add incomes page with SSR prefetch and loading skeleton"
```

---

## Task 16: Navegação na sidebar

**Files:**
- Modify: `components/app-sidebar.tsx`

- [ ] **Step 1: Substituir o `SidebarContent` vazio por um menu de navegação**

No topo do arquivo, adicionar imports (manter os existentes):

```tsx
"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  LogOut,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
```

Definir os itens acima do componente:

```tsx
const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Gastos", href: "/expenses", icon: TrendingDownIcon },
  { title: "Receitas", href: "/incomes", icon: TrendingUpIcon },
]
```

Dentro do componente, antes do `return`, ler o pathname:

```tsx
const pathname = usePathname()
```

Substituir o bloco:

```tsx
<SidebarContent>
  <SidebarGroup />
  <SidebarGroup />
</SidebarContent>
```

por:

```tsx
<SidebarContent>
  <SidebarGroup>
    <SidebarGroupContent>
      <SidebarMenu>
        {navItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={pathname === item.href}>
              <Link href={item.href}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroupContent>
  </SidebarGroup>
</SidebarContent>
```

- [ ] **Step 2: Verificar tipos e lint**

Run: `npm run typecheck`
Expected: sem erros. Se algum nome de export do `sidebar` (ex.: `SidebarGroupContent`, `SidebarMenuButton`) não existir, conferir os exports em `components/ui/sidebar.tsx` e ajustar para os nomes corretos.

- [ ] **Step 3: Commit**

```bash
git add components/app-sidebar.tsx
git commit -m "feat: add sidebar navigation for dashboard, expenses and incomes"
```

---

## Task 17: Desacoplar o MonthSelector do dashboard + TODO de reorganização

**Files:**
- Modify: `app/(authenticated)/dashboard/components/month-selector.tsx`
- Modify: `app/(authenticated)/layout.tsx`

- [ ] **Step 1: Trocar `useDashboard` por `useIsFetching` no `month-selector.tsx`**

Remover o import:

```tsx
import { useDashboard } from "../hooks/use-dashboard"
```

Adicionar `useIsFetching` ao import do TanStack Query no topo:

```tsx
import { useIsFetching } from "@tanstack/react-query"
```

Substituir:

```tsx
// Mesma queryKey do SummaryCard → compartilha cache (sem fetch extra).
const { isFetching } = useDashboard()
```

por:

```tsx
// Indicador global: reflete a query da página atual (dashboard, gastos ou
// receitas) sem acoplar o seletor de mês a uma query específica.
const isFetching = useIsFetching() > 0
```

O restante do componente (que usa `isFetching` para o spinner) permanece igual.

- [ ] **Step 2: Adicionar TODO de reorganização no `layout.tsx`**

Adicionar, logo acima do import do `LayoutHeader`:

```tsx
// TODO: LayoutHeader/MonthSelector/add-*-sheet vivem em dashboard/components mas
// são usados por todas as páginas autenticadas. Mover para um chrome
// compartilhado se surgir uma página autenticada com layout distinto.
```

- [ ] **Step 3: Verificar tipos**

Run: `npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add "app/(authenticated)/dashboard/components/month-selector.tsx" "app/(authenticated)/layout.tsx"
git commit -m "refactor: decouple month selector spinner from dashboard query"
```

---

## Task 18: Verificação final (lint + build + smoke manual)

**Files:** nenhum (só verificação)

- [ ] **Step 1: Lint**

Run: `npm run lint`
Expected: sem erros.

- [ ] **Step 2: Build de produção**

Run: `npm run build`
Expected: build conclui sem erros de tipo/compilação.

- [ ] **Step 3: Smoke manual**

Run: `npm run dev` e, autenticado, verificar:
- Sidebar navega entre Dashboard, Gastos e Receitas; item ativo destacado.
- `/expenses`: lista carrega; busca por título, filtro de tipo e de categoria funcionam; ordenação por Tipo/Valor/Impacto/Vigência funciona; paginação aparece com >25 itens.
- Rodapé: "Comprometido em \<mês\>" muda ao trocar o mês no header e ao aplicar filtros; sem filtros, bate com `total_expenses` do dashboard no mesmo mês.
- Excluir um gasto pede confirmação, some da lista na hora e o total do dashboard atualiza ao voltar.
- `/incomes`: mesmos comportamentos, com "Receita prevista em \<mês\>".
- No `/expenses` e `/incomes`, abrir o seletor de mês não dispara request de `/api/dashboard` (conferir aba Network).

- [ ] **Step 4: Commit (se algum ajuste foi necessário no smoke)**

```bash
git add -A
git commit -m "fix: address issues found during manual smoke verification"
```

---

## Self-review (cobertura do spec)

- Modelo lista-mestre, 1 linha/registro → Tasks 8/9/13/14 (colunas + tabela, sem filtro de mês nas linhas). ✓
- Rodapé ciente do mês (opção 2), avulsa só no mês dela → footer em Tasks 9/14 via `isActiveInPeriod` + `getMonthlyImpact`. ✓
- Prefetch SSR + client-side (abordagem C) → Tasks 10/15 (page) + 6/11 (hooks). ✓
- Só excluir → Tasks 7/12 + 6/11 (mutations com optimistic + invalida dashboard). ✓
- Padrão shadcn radix Data Table → Task 5. ✓
- Toolbar (busca + tipo + categoria), ordenação, paginação 25 → Tasks 5/9/14. ✓
- Badge de tipo + AlertDialog → Tasks 2/7/8/12/13. ✓
- Sidebar nav → Task 16. ✓
- MonthSelector desacoplado → Task 17. ✓
- Limpeza estrutural adiada (só TODO) → Task 17 Step 2. ✓
- Helpers compartilhados (`getMonthlyImpact` extraído) → Task 1. ✓
- Fora de escopo (widgets dashboard, edit/view, settings) → não há tarefas (correto). ✓
