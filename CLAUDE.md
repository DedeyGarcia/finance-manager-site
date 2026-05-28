# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos principais

```bash
npm run dev        # servidor de desenvolvimento (Next.js)
npm run build      # build de produção
npm run typecheck  # verificação de tipos sem emitir arquivos
npm run lint       # ESLint
npm run format     # Prettier em todos os .ts/.tsx
```

## Stack e arquitetura

**Next.js 16 App Router** com **React 19**, **TypeScript**, **Tailwind CSS v4** e **shadcn/ui**.

Estratégia de dados:
- `apiFetch` funciona tanto no server quanto no client, mas a origem muda:
  - **No server**: lê o cookie httpOnly e bate direto em `FINANCE_MANAGER_API_URL` (backend FastAPI).
  - **No client**: bate em rota interna do Next (`/api/...`) que age como proxy/middleware — essa rota lê o cookie httpOnly e repassa pro backend com `Authorization: Bearer`. Sem essa rota intermediária, a chamada falha (cookie httpOnly inacessível do JS + CORS).
  - Toda nova chamada client-side exige a rota Next correspondente criada antes.
- **SSR (Server Components)** para leitura de dados — fetch nas Server Actions/page.tsx.
- **TanStack Query** para mutações no cliente (criar, editar, deletar) — `mutationFn` chama `apiFetch("/api/v1/...")` na rota Next.
- **TanStack Query para reads compartilhados/reativos** — quando o dado é consumido por vários componentes da mesma página OU precisa atualizar em toda a UI após uma mutation (ex: editar perfil → nome reflete na sidebar sem reload), use prefetch no Server Component + `HydrationBoundary` + `useQuery` no client. Para reads pontuais e estáticos (ex: usuário exibido no footer da sidebar), passe como prop direto do Server Component — evita hidratação e dispensa criar a rota proxy `/api/...`. Critério de migração: passou a existir mutation que invalida essa key → migra pra TanStack. Exemplo de referência (extraído de outro projeto — `queryKeys` e `PedalsService` aqui são placeholders; neste repo as estruturas equivalentes ainda não existem):
  ```tsx
  // page.tsx (Server Component)
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.pedals.lists(),
    queryFn: PedalsService.getPedals,
  })
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PedalsPageShell>
        <PedalsTable />
      </PedalsPageShell>
    </HydrationBoundary>
  )
  ```
  E a mutation correspondente no client, batendo na rota proxy do Next:
  ```tsx
  const createPedal = useMutation({
    mutationFn: (input: CreatePedalRequest) =>
      apiFetch("/api/v1/pedals", { method: "POST", body: input }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: queryKeys.pedals.all })
    },
  })
  ```
- `next-themes` já instalado; `ThemeProvider` em `components/theme-provider.tsx` envolve o layout. Atalho `d` alterna dark/light.

Fontes: Inter (sans), Merriweather (serif), JetBrains Mono (mono) — variáveis CSS `--font-sans`, `--font-serif`, `--font-mono`.

## API backend

Base URL: `http://localhost:8000` (dev)  
Autenticação: `Authorization: Bearer <token>` (JWT)  
Login usa `application/x-www-form-urlencoded`. O campo chama-se `username` (padrão OAuth2), mas o valor enviado é o **e-mail** do usuário.

Os tipos TypeScript da API estão em [docs/api.types.ts](docs/api.types.ts) — gerado por `openapi-typescript` a partir do schema do backend FastAPI. Use `components["schemas"]["NomeDoSchema"]` para tipar payloads.

Atenção: o campo `amount` retorna como `string` na API (Python `Decimal`), não como `number`. Faça o parse com `parseFloat` ou uma lib Decimal para exibição e cálculos.

## Domínio: modelo de dados

O app é um **planejador de compromissos financeiros mensais**. A pergunta central é: *quanto do mês já está comprometido e quanto vai sobrar?*

Tabelas: `users`, `categories`, `expenses`, `incomes`.

**`expenses`** — tudo que sai do orçamento:
- `expense_type`: `one_time` | `fixed` | `automatic_debit` | `installment`
- `installments_count`: sempre presente, default `1`; para parcelamentos armazena o total de parcelas
- `amount`: valor **total** da compra (não a parcela)

**`incomes`** — tudo que entra no orçamento:
- `income_type`: `one_time` | `recurring`

Ambos compartilham a lógica de datas:
- `impact_start_date` — primeira data de impacto no orçamento (obrigatório)
- `impact_end_date` — última data de impacto (`null` = recorrência indefinida)
- `purchase_date` / `received_date` — data real da transação (opcional)

## Regras de negócio críticas

**Consulta de período** — um registro entra no dashboard/lista se:
```
impact_start_date <= period_end
AND (impact_end_date IS NULL OR impact_end_date >= period_start)
```

**Impacto mensal de parcelamentos** — calculado no frontend:
```
impacto_mensal = amount / installments_count
```
Para `installments_count = 1`, a divisão é neutra. O `amount` da API é sempre o valor total.

**Número da parcela atual** (para exibir "3/12"):
```
parcela_atual = diferença_meses(impact_start_date, period_start) + 1
```

**Recorrências mensais** (`fixed`, `automatic_debit`, `recurring`) repetem no mesmo dia de `impact_start_date` a cada mês. Não há campo `status` na V0 — para encerrar uma recorrência, define-se `impact_end_date`.

**Categorias** são globais/default na V0 (`user_id = null`). Na V1 serão customizáveis por usuário.

## Telas previstas (V0)

- **Dashboard** (`/`) — resumo do mês: receita total, gastos comprometidos, sobra prevista, gastos por tipo
- **Gastos** (`/expenses`) — listagem com filtros por tipo (`one_time`, `fixed`, `automatic_debit`, `installment`)
- **Receitas** (`/incomes`) — listagem com filtros por tipo (`one_time`, `recurring`)
- **Configurações** (`/settings`) — dados da conta, categorias (read-only na V0)

## Convenções de código

- **Forms**: sempre usar **React Hook Form**. Nunca controlar estado de formulário com `useState`.
- **Componentes**: priorizar componentes de biblioteca (shadcn/ui, Radix) antes de criar do zero.
- **Fetch**: nunca usar `fetch` diretamente — sempre através do wrapper tipado do projeto (a ser criado em `lib/api/`). O wrapper receberá os tipos gerados em `docs/api.types.ts`.
- Seguir DRY, KISS e YAGNI: sem abstrações prematuras, sem código para casos hipotéticos futuros.

## Tema CSS

Tema customizado já definido em [app/globals.css](app/globals.css) com variáveis `oklch` (paleta roxa/azul). Não altere as variáveis de cor sem alinhamento explícito. O tema é aplicado via classe `.dark` no `<html>`, controlado por `next-themes`.
