# Design: Tabelas de Gastos e Receitas (`/expenses`, `/incomes`)

Data: 2026-05-29

## Contexto e problema

O app é um planejador de compromissos financeiros mensais. Hoje existe só o dashboard
(`/dashboard`), com um `SummaryCard` por mês alimentado pelo endpoint `/dashboard`. Faltam as
telas de gestão dos registros: listar, filtrar, ordenar e excluir gastos e receitas.

A decisão central que destrava o resto: **o que a tabela representa em relação ao "mês"?**
Um gasto fixo ou uma parcela de 12x vive em vários meses — então a tabela não pode ser uma
visão recortada por mês sem repetir o mesmo registro N vezes.

## Decisões tomadas (brainstorming)

1. **Modelo da tabela = lista-mestre de compromissos.** Cada registro aparece **uma única vez**,
   com sua faixa de vigência. As linhas **nunca** são filtradas pelo mês do header. É a tela de
   gestão (CRUD). (Modelo A.)
2. **Rodapé ciente do mês.** As linhas não filtram por mês, mas o **total do rodapé** sim: mostra
   "Comprometido em \<mês\>" somando a contribuição de cada registro ativo no mês selecionado no
   header. Resolve como a compra avulsa entra na soma — ela só conta no mês dela. (Opção 2 do
   rodapé.)
3. **Camada de dados = prefetch SSR + client-side.** `page.tsx` faz `prefetchQuery` dos endpoints
   autenticados de lista (`/expenses/` e `/incomes/`) +
   `HydrationBoundary`; o client usa `useQuery` (mesma key) + TanStack Table fazendo
   ordenação/filtro/paginação no navegador. É o mesmo padrão do dashboard. (Abordagem C.) Isso
   também contorna o edge-case da regra de período: o filtro `impact_end_date_gte` do endpoint
   `/expenses/` não expressa `impact_end_date IS NULL`, então recortar período no servidor seria
   incorreto — fazer no cliente, com a regra completa, é mais simples e correto.
4. **Ações por linha = só excluir** nesta entrega. Visualizar/editar fica para depois.
5. **Tabela segue o padrão oficial do shadcn (variante radix):** Table + Data Table com TanStack
   React Table. Ver seção "Componente de tabela".

## Arquitetura

### Estrutura de arquivos

```
app/(authenticated)/
  expenses/
    page.tsx                      # server: prefetch /expenses/ + categorias, HydrationBoundary
    loading.tsx                   # skeleton da tabela
    components/
      expenses-table.tsx          # client: monta colunas (com categorias) + render do DataTable
      expenses-columns.tsx        # ColumnDef<ExpenseRead>[]
    hooks/
      use-expenses.ts             # useQuery -> /api/expenses
      use-delete-expense.ts       # useMutation DELETE + optimistic
  incomes/                        # espelho (sem coluna "impacto/mês")
    page.tsx
    loading.tsx
    components/
      incomes-table.tsx
      incomes-columns.tsx
    hooks/
      use-incomes.ts
      use-delete-income.ts

components/ui/data-table.tsx      # <DataTable> genérico reutilizável (shadcn)
components/ui/badge.tsx           # adicionar via shadcn
components/ui/alert-dialog.tsx    # adicionar via shadcn

app/api/expenses/route.ts         # GET/POST proxy -> /expenses/
app/api/expenses/[id]/route.ts    # DELETE proxy -> /expenses/{id} (204)
app/api/incomes/route.ts          # GET/POST proxy -> /incomes/
app/api/incomes/[id]/route.ts     # DELETE proxy -> /incomes/{id} (204)

services/expense.ts               # server-only: getAllExpenses()
services/income.ts                # server-only: getAllIncomes()
lib/expense.ts                    # getMonthlyImpact() + isActiveInPeriod() (compartilhados)
lib/query-keys.ts                 # + expenses, incomes
components/app-sidebar.tsx        # + navegação
```

### Camada de dados

- **Prefetch SSR:** `expenses/page.tsx` (Server Component) chama `ExpenseService.getAllExpenses()`
  (server-only, bate direto no backend) dentro de `prefetchQuery(queryKeys.expenses.list())`, e
  também busca categorias (`CategoryService.getCategories()`) para os nomes/filtro. Envolve a
  tabela em `HydrationBoundary`. Categorias entram como prop do client component (read pontual,
  sem rota proxy — conforme CLAUDE.md).
- **Client read:** `use-expenses.ts` → `useQuery` com a **mesma** `queryKey`, `queryFn` batendo em
  `/api/expenses`. Resposta tipada `RawListResponse_ExpenseRead_` = `{ data: ExpenseRead[], total }`.
  A tabela consome `.data`.
- **query-keys.ts:** adicionar
  ```ts
  expenses: { all: ["expenses"] as const, list: () => [...queryKeys.expenses.all, "list"] as const },
  incomes:  { all: ["incomes"]  as const, list: () => [...queryKeys.incomes.all,  "list"] as const },
  ```
- **Exclusão:** `use-delete-expense.ts` → `useMutation`, `mutationFn: (id) => apiFetch("/api/expenses/"+id, { method: "DELETE" })`.
  - `onMutate`: cancela e remove otimisticamente a linha do cache de `queryKeys.expenses.list()`,
    guardando o estado anterior para rollback.
  - `onError`: restaura o snapshot.
  - `onSettled`: `invalidateQueries({ queryKey: queryKeys.expenses.all })` **e**
    `invalidateQueries({ queryKey: queryKeys.dashboard.all })` (o total do mês muda). Mesmo padrão
    do `use-create-expense.ts` existente.
- **Rotas proxy:** usam o helper `forward` existente. O DELETE retorna 204 (o `forward` já trata).
  Espelham `app/api/dashboard/route.ts` e `app/api/expenses/route.ts`.

### Helpers compartilhados (`lib/expense.ts`)

Extrair de `use-create-expense.ts` (hoje inline) para reuso no rodapé e na coluna de impacto:

```ts
// amount/installments p/ "installment"; senão amount.
export function getMonthlyImpact(expense: { amount; expense_type; installments_count }): number

// regra de negócio do CLAUDE.md, com o caso impact_end_date === null:
// start <= periodEnd && (end === null || end >= periodStart)
export function isActiveInPeriod(start, end, periodStart, periodEnd): boolean
```

> Refator alvo: o `getMonthlyImpact` do `use-create-expense.ts` passa a importar de `lib/expense.ts`
> (DRY), sem mudar o comportamento do optimistic update.

## Componente de tabela (padrão shadcn radix Data Table)

Segue fielmente https://ui.shadcn.com/docs/components/radix/data-table e
https://ui.shadcn.com/docs/components/radix/table.

- **`components/ui/data-table.tsx`** — componente genérico. Assinatura base do shadcn
  (`{ columns, data }`) estendida com slots opcionais para a toolbar e o footer, já que duas
  tabelas compartilham a casca:
  ```ts
  interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    toolbar?: (table: Table<TData>) => React.ReactNode
    footer?: (table: Table<TData>) => React.ReactNode   // recebe o table p/ ler getFilteredRowModel
  }
  ```
  Internamente: `useReactTable({ data, columns, getCoreRowModel, getSortedRowModel,
  getFilteredRowModel, getPaginationRowModel, onSortingChange, onColumnFiltersChange, state: {
  sorting, columnFilters } })`, `initialState.pagination.pageSize = 25`. Renderiza com `flexRender`
  sobre `Table/TableHeader/TableBody/TableRow/TableHead/TableCell` e usa `TableFooter` para o slot
  `footer`. Controles de paginação com `table.previousPage()/nextPage()` (usando o
  `components/ui/pagination.tsx` existente).
- **Colunas (`expenses-columns.tsx`)** — `ColumnDef<ExpenseRead>[]`:
  - `title` — Título.
  - `expense_type` — Tipo, renderizado como `Badge` com label PT (mapa abaixo). Header com
    `column.toggleSorting()`.
  - `category_id` — Categoria: resolve nome via mapa `categoryId → name` (passado às colunas).
  - `amount` — Valor total: `parseFloat` + `formatCurrency`. Ordenável.
  - impacto/mês (coluna computada) — `getMonthlyImpact(row.original)` + `formatCurrency`. Ordenável.
  - vigência — `mmm/aa → mmm/aa`, ou `mmm/aa → ∞` quando `impact_end_date` é null. Ordenável por
    `impact_start_date`.
  - ações — `🗑` que abre o `AlertDialog` de confirmação (acessa `row.original`).
- **Colunas (`incomes-columns.tsx`)** — igual, **sem** a coluna impacto/mês; tipo usa o mapa de
  `income_type`.
- **Mapas de label (Tipo):**
  - expense: `fixed`→"Fixo", `automatic_debit`→"Débito automático", `installment`→"Parcela",
    `one_time`→"Avulsa".
  - income: `recurring`→"Recorrente", `one_time`→"Avulsa".
- **Ordenação:** client-side; default = vigência (`impact_start_date`) desc.
- **Filtros (toolbar):** busca por título via `table.getColumn("title")?.setFilterValue(value)`;
  `Select` de tipo e `Select` de categoria via column filters. As categorias do `Select` vêm da
  prop de categorias.
- **Rodapé ciente do mês (`TableFooter`):** lê `year/month` do `useMonthStore`, converte com
  `monthToPeriod`, e soma sobre `table.getFilteredRowModel().rows` (linhas filtradas, **não** só a
  página atual) a contribuição de cada registro `isActiveInPeriod(...)` usando `getMonthlyImpact`
  (expenses) / `amount` (incomes). Exibe "Comprometido em \<mês\>: R$ X" (expenses) /
  "Receita prevista em \<mês\>: R$ X" (incomes) + contagem de itens. Recalcula ao mudar mês ou
  filtros. Sem filtros, o número bate com o `total_expenses`/`total_incomes` do dashboard.
- **Exclusão UI:** `AlertDialog` "Excluir \<título\>? Esta ação não pode ser desfeita." → confirma →
  dispara a mutation. Feedback via remoção otimista da linha (sem lib de toast nesta entrega).
- **Estados:** `loading.tsx` por rota com skeleton de tabela; vazio = "Nenhuma despesa/receita
  cadastrada"; filtrado sem resultado = "Nenhum resultado".

## Navegação e header

- **`AppSidebar`** (hoje vazia) ganha `SidebarMenu` com: Dashboard (`/dashboard`), Gastos
  (`/expenses`), Receitas (`/incomes`). Ícones lucide; item ativo via `usePathname()`.
  (Configurações fica fora por ora para não criar link morto.)
- **`MonthSelector`** hoje usa `useDashboard()` só para o spinner — isso dispararia um fetch de
  dashboard em `/expenses` e `/incomes`. Trocar pelo `useIsFetching()` global do TanStack Query, que
  reflete a query da página atual sem acoplar ao dashboard.

## Limpeza estrutural — adiada (apenas TODO)

`LayoutHeader`, `MonthSelector` e as `add-*-sheet/form` moram em `dashboard/components/` mas são
usados pelo layout autenticado em todas as páginas. **Nesta entrega não mover.** Deixar um
comentário `// TODO: mover para chrome compartilhado se surgir página autenticada com layout
distinto` no `app/(authenticated)/layout.tsx` (ou no header). Motivo: ainda não está claro se
haverá uma página autenticada com layout diferente que justifique a reorganização.

## Fora de escopo (futuro)

Anotado aqui para não se perder:

- **Widgets do dashboard:** (A) gastos por categoria, (B) maiores compromissos do mês, (C) rosca de
  composição por tipo, (D) composição da receita (recorrente vs avulsa), (E) linha do tempo de
  parcelas. (A) e (B) exigem buscar a lista autenticada em `/expenses/` na página do dashboard; (C) exige adicionar
  recharts; (D) é barato (dado já vem no `/dashboard`); (E) é o mais complexo.
- **Visualizar/editar registro** (a API já tem `PATCH`).
- **Tela de configurações** (`/settings`) e link na sidebar.

## Critérios de aceite

- `/expenses` e `/incomes` listam todos os registros do usuário (lista-mestre, 1 linha por
  registro), com prefetch SSR + hidratação.
- Busca por título, filtro por tipo e por categoria, e ordenação funcionam client-side.
- Paginação client-side de 25/página.
- Rodapé mostra o total comprometido/previsto do mês do header, recalculando com filtros e troca de
  mês; sem filtros, bate com o dashboard.
- Excluir uma linha pede confirmação, remove otimisticamente e invalida dashboard + lista.
- Sidebar navega entre Dashboard, Gastos e Receitas, com item ativo destacado.
- `MonthSelector` não dispara fetch de dashboard nas páginas de tabela.
- `npm run typecheck`, `npm run lint` e `npm run build` passam.
```
