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
- **SSR (Server Components)** para leitura de dados — fetch nas Server Actions/page.tsx com token JWT do cookie/header.
- **TanStack Query** para mutações no cliente (criar, editar, deletar).
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

## Tema CSS

Tema customizado já definido em [app/globals.css](app/globals.css) com variáveis `oklch` (paleta roxa/azul). Não altere as variáveis de cor sem alinhamento explícito. O tema é aplicado via classe `.dark` no `<html>`, controlado por `next-themes`.
