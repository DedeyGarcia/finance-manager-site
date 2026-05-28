# Finance App V0 — Direção Decidida

## 1. Visão do produto

O app será um **planejador de compromissos financeiros mensais**, não um banco digital e não um rastreador completo de transações.

O foco principal da V0 é responder:

> Quanto do meu mês já está comprometido e quanto vai sobrar?

A ideia nasceu a partir de uma planilha manual de gastos e deve manter essa simplicidade: cadastrar receitas, gastos fixos, assinaturas, parcelamentos e algumas compras avulsas relevantes, sem entrar ainda na complexidade de saldo bancário, cartão de crédito real ou Open Finance.

---

## 2. Escopo da V0

A V0 terá:

- Receitas mensais
- Gastos fixos
- Assinaturas
- Parcelamentos
- Compras avulsas relevantes
- Categorias default
- Projeção mensal de sobra
- Dashboard do mês
- Listas/tabelas separadas de gastos e receitas

A V0 não terá:

- Open Finance
- Integração bancária
- Fechamento de fatura
- Limite de cartão
- Saldo em conta
- Importação de extrato
- Categorias customizadas pelo usuário
- Investimentos complexos
- Controle patrimonial
- Multiusuário avançado
- Status avançado de registros, como pausado/cancelado/arquivado

---

## 3. Decisão de modelagem

A modelagem escolhida será a **Opção B**, com tabelas separadas para `expenses` e `incomes`.

Motivo:

- A UI terá abas/tabelas separadas de receitas e gastos.
- A manutenção fica mais direta.
- O código fica mais semântico.
- Para a V0, é mais simples pensar: se entra dinheiro, vai em `incomes`; se sai dinheiro, vai em `expenses`.

Resumo mental:

```txt
expenses = tudo que tira dinheiro do orçamento
incomes = tudo que adiciona dinheiro ao orçamento
```

Mesmo com tabelas separadas, ambas usam a mesma lógica central:

```txt
impact_start_date
impact_end_date
category_id
amount
source_text
```

A pergunta central é:

> Em que data ou período isso impacta meu orçamento?

---

## 3.1. Decisão de nomenclatura de datas

A nomenclatura final da V0 será:

```txt
purchase_date       data real da compra, quando existir
received_date       data real do recebimento, quando existir
impact_start_date   primeira data em que o item impacta o orçamento
impact_end_date     última data em que o item impacta o orçamento, quando existir
period_start        início do período consultado no dashboard/listagens
period_end          fim do período consultado no dashboard/listagens
```

Os campos `impact_start_date` e `impact_end_date` são `DATE` reais.

Eles **não** devem ser normalizados automaticamente para o primeiro dia do mês.

Exemplos:

```txt
Compra no Pix em 2026-05-27:
purchase_date = 2026-05-27
impact_start_date = 2026-05-27
impact_end_date = 2026-05-27
```

```txt
Compra no crédito feita em 2026-05-27, com fatura vencendo em 2026-06-10:
purchase_date = 2026-05-27
impact_start_date = 2026-06-10
impact_end_date = 2026-06-10
```

```txt
Salário recorrente recebido aproximadamente no dia 05:
received_date = null
impact_start_date = 2026-05-05
impact_end_date = null
```

Para o dashboard mensal, o app consulta um intervalo de datas, por exemplo:

```txt
period_start = 2026-06-01
period_end = 2026-06-30
```

Assim, o app consegue saber tudo que impacta junho sem fingir que todo impacto acontece no primeiro dia do mês.

---

## 4. Tabelas principais

```txt
users
categories
expenses
incomes
```

---

## 5. Relações

Na V0, as categorias serão **globais/default**. Portanto, elas não pertencem diretamente ao usuário.

Relações da V0:

```txt
users 1 ─── N expenses
users 1 ─── N incomes

categories 1 ─── N expenses
categories 1 ─── N incomes
```

Ou seja:

- Um usuário pode ter vários gastos.
- Um usuário pode ter várias receitas.
- Uma categoria global pode ser usada por vários gastos.
- Uma categoria global pode ser usada por várias receitas.

A relação abaixo fica reservada para uma evolução futura:

```txt
users 1 ─── N categories
```

Na V1, quando categorias customizadas forem liberadas, a tabela `categories` poderá usar `user_id` nullable:

```txt
user_id = null      categoria padrão/global
user_id = user.id   categoria customizada daquele usuário
```

---

## 6. Tabela `users`

Guarda os usuários do sistema.

Campos:

```txt
id
name
email
password_hash
created_at
updated_at
```

Exemplo SQL:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

---

## 7. Tabela `categories`

Na V0, as categorias serão **default e globais**, criadas pelo sistema.

Isso significa que, inicialmente, categoria **não pertence ao usuário**. Ela pertence ao app.

Na V1, o usuário poderá criar, editar e arquivar categorias customizadas. Para facilitar essa evolução sem uma migração dolorosa, a recomendação é já deixar `user_id` como campo nullable.

Regra:

```txt
user_id = null      categoria padrão/global do sistema
user_id = user.id   categoria customizada daquele usuário
```

Na V0, todas as categorias default terão:

```txt
user_id = null
is_default = true
```

Campos:

```txt
id
user_id, nullable
name
kind
color
icon
sort_order
is_default
is_archived
created_at
updated_at
```

Onde `kind` pode ser:

```txt
income
expense
```

Exemplo SQL:

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
  color TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,

  is_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

Observação sobre unicidade:

Como `user_id` pode ser `null`, a constraint `UNIQUE (user_id, name, kind)` pode não se comportar como o esperado para categorias globais em todos os casos. Para a V0, dá para controlar isso via seed/migration. Na V1, se quiser blindar melhor, podem ser criados índices únicos parciais para separar categorias globais e categorias por usuário.

---

## 8. Categorias default da V0

### Categorias de gastos

```txt
Mercado
Transporte
Saúde
Educação
Casa
Lazer
Assinaturas
Compras
Investimentos
Outros
```

### Categorias de receitas

```txt
Salário
Freela
Renda extra
Reembolso
Outros
```

Observação importante:

`Parcelado`, `Assinatura` e `Fixo` não devem ser necessariamente categorias principais, porque isso é melhor representado por `expense_type`.

Exemplo:

```txt
Tênis
category = Compras
expense_type = installment
```

Regra mental:

```txt
category = natureza do gasto
expense_type = comportamento financeiro
```

---

## 9. Tabela `expenses`

Guarda tudo que tira dinheiro do orçamento.

Aqui entram:

- Compra avulsa
- Gasto fixo
- Assinatura
- Parcelamento
- Investimento mensal, por enquanto

Campos:

```txt
id
user_id
category_id
title
description
amount
expense_type
purchase_date
impact_start_date
impact_end_date
installments_count  obrigatório, default 1 (sempre presente; para não-parcelamentos vale 1)
source_text
created_at
updated_at
```

Tipos de gasto:

```txt
one_time          # compra avulsa
fixed             # gasto fixo pago manualmente (ex.: aluguel)
automatic_debit   # débito automático / assinatura recorrente (ex.: Spotify)
installment       # parcelamento
```

Exemplo SQL:

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),

  expense_type TEXT NOT NULL CHECK (
    expense_type IN (
      'one_time',
      'fixed',
      'automatic_debit',
      'installment'
    )
  ),

  purchase_date DATE,

  impact_start_date DATE NOT NULL,
  impact_end_date DATE,

  installments_count INTEGER NOT NULL DEFAULT 1 CHECK (installments_count > 0),

  source_text TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

> **Nota sobre `amount`:** `NUMERIC(12,2)` em SQL → no model SQLModel, use **`Decimal`** (`Field(max_digits=12, decimal_places=2, gt=0)`), **nunca `float`** (imprecisão binária em dinheiro).

---

## 10. Exemplos de `expenses`

### Compra avulsa no Pix ou débito

```txt
title: Tênis
amount: 500.00
expense_type: one_time
installments_count: 1
purchase_date: 2026-05-27
impact_start_date: 2026-05-27
impact_end_date: 2026-05-27
source_text: Pix
category: Compras
```

### Compra no crédito sem parcelar, caindo na próxima fatura

```txt
title: Tênis
amount: 500.00
expense_type: one_time
installments_count: 1
purchase_date: 2026-05-27
impact_start_date: 2026-06-10
impact_end_date: 2026-06-10
source_text: Crédito
category: Compras
```

### Débito automático (assinatura recorrente)

```txt
title: Spotify
amount: 40.90
expense_type: automatic_debit
installments_count: 1
purchase_date: null
impact_start_date: 2026-05-15
impact_end_date: null
source_text: Débito automático
category: Assinaturas
```

Interpretação:

- A assinatura começa a impactar em 2026-05-15.
- Como `impact_end_date` é `null`, ela continua impactando os meses seguintes.
- Na V0, débitos automáticos/assinaturas são tratados como recorrências mensais.

### Parcelamento

```txt
title: Celular
amount: 289.46
expense_type: installment
installments_count: 12
purchase_date: 2026-05-27
impact_start_date: 2026-06-10
impact_end_date: 2027-05-10
source_text: Crédito
category: Compras
```

Interpretação:

- `amount` é o valor **total** da compra (R$ 289,46).
- O impacto mensal no dashboard é `amount / installments_count` = R$ 24,12/mês.
- A primeira parcela impacta em 2026-06-10; a última em 2027-05-10.
- O app não precisa saber qual cartão foi usado na V0.

### Investimento mensal

Na V0, investimento pode ser tratado como gasto fixo categorizado.

```txt
title: Investimento mensal
amount: 500.00
expense_type: fixed
installments_count: 1
purchase_date: null
impact_start_date: 2026-05-05
impact_end_date: null
source_text: Automático
category: Investimentos
```

Conceitualmente, investimento não é gasto definitivo, mas para a V0 ele reduz a sobra utilizável do mês, então faz sentido tratá-lo como compromisso financeiro mensal.

---

## 11. Tabela `incomes`

Guarda tudo que adiciona dinheiro ao orçamento.

Aqui entram:

- Salário
- Freela
- Renda extra
- Reembolso
- Qualquer entrada pontual ou recorrente

Campos:

```txt
id
user_id
category_id
title
description
amount
income_type
received_date
impact_start_date
impact_end_date
source_text
created_at
updated_at
```

Tipos de receita:

```txt
one_time
recurring
```

Exemplo SQL:

```sql
CREATE TABLE incomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),

  income_type TEXT NOT NULL CHECK (
    income_type IN (
      'one_time',
      'recurring'
    )
  ),

  received_date DATE,

  impact_start_date DATE NOT NULL,
  impact_end_date DATE,

  source_text TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);
```

---

## 12. Exemplos de `incomes`

### Salário recorrente

```txt
title: Salário
amount: 5025.79
income_type: recurring
received_date: null
impact_start_date: 2026-05-06
impact_end_date: null
source_text: Empresa
category: Salário
```

Interpretação:

- O salário começa a impactar em 2026-05-06.
- Como `impact_end_date` é `null`, ele continua sendo considerado nos meses seguintes.
- Na V0, receitas recorrentes são tratadas como recorrências mensais.

### Freela pontual

```txt
title: Freela landing page
amount: 800.00
income_type: one_time
received_date: 2026-05-27
impact_start_date: 2026-05-27
impact_end_date: 2026-05-27
source_text: Cliente X
category: Freela
```

### Reembolso

```txt
title: Reembolso consulta
amount: 150.00
income_type: one_time
received_date: 2026-05-27
impact_start_date: 2026-05-27
impact_end_date: 2026-05-27
source_text: Plano de saúde
category: Reembolso
```

---

## 13. Regra central de impacto por período

Para montar o dashboard de um mês, o sistema busca tudo que impacta o intervalo daquele mês.

Na V0, não haverá campo `status`.

Um registro entra no dashboard de um período se o intervalo de impacto dele cruza o período consultado.

Exemplo:

```txt
period_start = 2026-06-01
period_end = 2026-06-30
```

### Buscar gastos do período

```sql
SELECT *
FROM expenses
WHERE user_id = :user_id
  AND impact_start_date <= :period_end
  AND (
    impact_end_date IS NULL
    OR impact_end_date >= :period_start
  );
```

### Buscar receitas do período

```sql
SELECT *
FROM incomes
WHERE user_id = :user_id
  AND impact_start_date <= :period_end
  AND (
    impact_end_date IS NULL
    OR impact_end_date >= :period_start
  );
```

Depois:

```txt
total_receitas = soma incomes.amount
total_gastos   = soma (expenses.amount / expenses.installments_count)
sobra_prevista = total_receitas - total_gastos
```

Para expenses com `installments_count = 1` (não-parcelamentos), a divisão é neutra — `amount / 1 = amount`.
Para parcelamentos, o impacto mensal é a parcela: `amount / installments_count`.

---

## 14. Lógica de recorrências mensais na V0

Na V0, os seguintes tipos serão tratados como recorrências mensais:

```txt
expenses.expense_type = fixed
expenses.expense_type = automatic_debit
incomes.income_type = recurring
```

O dia da recorrência será derivado de `impact_start_date`.

Exemplo:

```txt
Spotify:
impact_start_date = 2026-05-15
```

Interpretação:

```txt
começa em 15/05/2026
repete mensalmente no dia 15
```

Limitação conhecida:

- A V0 não terá regra complexa como “5º dia útil”.
- Para salário, o usuário pode escolher uma data aproximada ou a data mais comum de recebimento.
- Uma versão futura pode adicionar `recurrence_rule`, `recurrence_day`, `business_day_rule` ou outro campo específico para regras mais avançadas.

---

## 15. Lógica de parcelamento

A V0 não cria uma linha por parcela. Um parcelamento é **um único registro** com `amount` total e `installments_count`.

O impacto mensal no dashboard é calculado em runtime:

```txt
impacto_mensal = amount / installments_count
```

O item aparece em todos os períodos que cruzam o intervalo `[impact_start_date, impact_end_date]`.

Exemplo:

```txt
title: Celular
amount: 289.46
installments_count: 12
impact_start_date: 2026-06-10
impact_end_date: 2027-05-10

impacto_mensal = 289.46 / 12 = 24.12
aparece de junho/2026 até maio/2027
```

O frontend pode exibir "parcela X/Y" calculando a diferença de meses:

```txt
parcela_atual = diferença de meses entre impact_start_date e period_start + 1

Exemplo: period_start = 2026-08-01 → parcela 3/12
```

Esse cálculo é responsabilidade do frontend — a API retorna apenas `amount`, `installments_count`, `impact_start_date` e `impact_end_date`.

---

## 16. Compra avulsa e data de impacto

O app não vai rastrear cartão, saldo em conta ou fatura real na V0.

Em vez disso, ele vai perguntar algo mais simples:

> Quando essa compra pesa no seu orçamento?

Exemplos:

### Compra no Pix ou débito

```txt
purchase_date = hoje
impact_start_date = data da compra
impact_end_date = data da compra
```

### Compra no crédito sem parcelar

```txt
purchase_date = hoje
impact_start_date = data de vencimento da fatura
impact_end_date = data de vencimento da fatura
```

### Compra parcelada

```txt
purchase_date = hoje
impact_start_date = data de vencimento da primeira parcela/fatura
impact_end_date = data de vencimento da última parcela/fatura
installments_count = número de parcelas
```

Isso permite considerar compras grandes sem modelar cartão de crédito ainda.

---

## 17. Telas principais da V0

### Home / Dashboard

Objetivo:

> Mostrar como está o mês em poucos segundos.

Deve exibir:

- Receita total do período
- Gastos comprometidos
- Sobra prevista
- Gastos por tipo
- Próximos compromissos
- Parcelas acabando
- Botões rápidos para adicionar gasto e receita

### Gastos

Objetivo:

> Listar e gerenciar tudo que sai do orçamento.

Filtros:

- Todos
- Avulsos
- Fixos
- Assinaturas
- Parcelados

### Receitas

Objetivo:

> Listar e gerenciar tudo que entra no orçamento.

Filtros:

- Todas
- Recorrentes
- Pontuais

### Configurações

Objetivo:

> Ajustes básicos da conta e categorias default.

Na V0, categorias são apenas exibidas. Na V1, poderão ser editadas.

---

## 18. Fluxo de adicionar gasto

Campos comuns:

```txt
Título
Valor
Categoria
Tipo de gasto
Data da compra, quando existir
Data em que impacta o orçamento
Fonte
```

Tipos:

```txt
Compra avulsa
Gasto fixo
Débito automático
Parcelamento
```

Campos condicionais:

### Compra avulsa

```txt
Quando pesa no orçamento?
- Hoje
- Data da compra
- Data da fatura
- Escolher data
```

### Gasto fixo

```txt
Data inicial de impacto
Data final de impacto, opcional
```

### Débito automático

```txt
Data inicial de impacto
Data final de impacto, opcional
```

### Parcelamento

```txt
Data da compra
Data da primeira parcela/fatura
Número de parcelas
```

O sistema calcula a data final automaticamente usando a quantidade de parcelas.

---

## 19. Fluxo de adicionar receita

Campos comuns:

```txt
Título
Valor
Categoria
Tipo de receita
Fonte
```

Tipos:

```txt
Receita pontual
Receita recorrente
```

Campos condicionais:

### Receita pontual

```txt
Data de recebimento
Data de impacto no orçamento
```

### Receita recorrente

```txt
Data inicial de impacto
Data final de impacto, opcional
```

---

## 20. Status fica para versões futuras

Na V0, o campo `status` não será usado.

Motivo:

- `impact_start_date` e `impact_end_date` já resolvem a regra principal de ativação.
- Para encerrar uma assinatura, gasto fixo ou receita recorrente, basta definir `impact_end_date`.
- Isso evita complexidade prematura com estados como `active`, `paused` e `cancelled`.

Exemplo:

```txt
Assinatura começou em 2026-01-15
Foi encerrada em 2026-08-15

impact_start_date = 2026-01-15
impact_end_date = 2026-08-15
```

Possíveis campos para versões futuras:

```txt
status
archived_at
cancelled_at
paused_until
```

Esses campos só devem entrar quando houver necessidade real de pausar, arquivar ou preservar histórico sem alterar datas de impacto.

---

## 21. Direção final da V0

A V0 deve ser simples, clara e terminável.

O produto não é:

```txt
controle financeiro completo
```

O produto é:

```txt
planejador de compromissos financeiros mensais
```

A regra central é:

> Tudo gira em torno do impacto no orçamento dentro de um período consultado.

A modelagem escolhida é:

```txt
users
categories
expenses
incomes
```

Com:

```txt
expenses = saídas do orçamento
incomes = entradas no orçamento
categories = globais/default na V0, com user_id nullable para futura customização
```

E com possibilidade de evoluir depois para:

- Categorias customizadas
- Cartões
- Contas
- Faturas
- Importação de extrato
- Open Finance
- Regras de recorrência mais avançadas
- IA para categorização
- Insights financeiros

---

## 22. Contrato da API (referência para o frontend)

Base URL: `http://localhost:8000` (dev)

Autenticação: Bearer token JWT no header `Authorization: Bearer <token>`.

A documentação interativa completa está disponível em `/docs` (Swagger) e `/redoc` (ReDoc) com a API rodando. O schema OpenAPI completo para geração de client TypeScript está em `/openapi.json`.

---

### Auth

#### `POST /auth/register`
Cria um novo usuário.

Request body:
```json
{ "name": "string", "email": "string", "password": "string" }
```

Response `201`:
```json
{ "id": "uuid", "name": "string", "email": "string", "created_at": "datetime", "updated_at": "datetime" }
```

---

#### `POST /auth/login`
Autentica e retorna o token JWT. Usa `application/x-www-form-urlencoded` (padrão OAuth2).

Request body (form):
```
username=email@exemplo.com&password=senha
```

Response `200`:
```json
{ "access_token": "string", "token_type": "bearer" }
```

---

#### `GET /auth/me`
Retorna o usuário autenticado.

Response `200`: mesmo schema de `UserRead`.

---

### Categories

#### `GET /categories`
Lista categorias. Aceita query param `kind=expense|income`.

Response `200`:
```json
{ "data": [ CategoryRead ], "total": 15 }
```

`CategoryRead`:
```json
{
  "id": "uuid",
  "name": "string",
  "kind": "expense | income",
  "color": "string | null",
  "icon": "string | null",
  "sort_order": 0,
  "is_default": true,
  "is_archived": false,
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

#### `GET /categories/{category_id}`
Retorna uma categoria pelo id.

---

### Expenses

#### `GET /expenses`
Lista os gastos do usuário autenticado. Todos os filtros são opcionais via query params.

Filtros disponíveis:
```
category_id        uuid
title              string (match exato)
expense_type       one_time | fixed | automatic_debit | installment
amount_gte         decimal
amount_lte         decimal
purchase_date_gte  date (YYYY-MM-DD)
purchase_date_lte  date
impact_start_date_gte  date
impact_start_date_lte  date
impact_end_date_gte    date
impact_end_date_lte    date
```

Response `200`:
```json
{ "data": [ ExpenseRead ], "total": 10 }
```

`ExpenseRead`:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "category_id": "uuid | null",
  "title": "string",
  "description": "string | null",
  "amount": "decimal",
  "expense_type": "one_time | fixed | automatic_debit | installment",
  "purchase_date": "date | null",
  "impact_start_date": "date",
  "impact_end_date": "date | null",
  "installments_count": 1,
  "source_text": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

---

#### `POST /expenses`
Cria um gasto.

Request body (`ExpenseCreate`):
```json
{
  "category_id": "uuid",
  "title": "string",
  "description": "string | null",
  "amount": "decimal",
  "expense_type": "one_time | fixed | automatic_debit | installment",
  "purchase_date": "date | null",
  "impact_start_date": "date",
  "impact_end_date": "date | null",
  "installments_count": 1,
  "source_text": "string | null"
}
```

Regras de validação:
- `impact_end_date >= impact_start_date` quando presente
- `one_time`: `impact_end_date` obrigatório
- `installment`: `impact_end_date` e `installments_count > 1` obrigatórios
- `fixed` / `automatic_debit`: `installments_count` deve ser 1

Response `201`: `ExpenseRead`

---

#### `PATCH /expenses/{expense_id}`
Atualiza parcialmente um gasto. Todos os campos são opcionais.

Response `200`: `ExpenseRead`

---

#### `DELETE /expenses/{expense_id}`
Remove um gasto.

Response `204`: sem corpo.

---

#### `GET /expenses/{expense_id}`
Retorna um gasto pelo id.

Response `200`: `ExpenseRead`

---

### Incomes

Mesmo padrão de endpoints que expenses (`GET /`, `POST /`, `PATCH /{id}`, `DELETE /{id}`, `GET /{id}`).

Filtros disponíveis em `GET /incomes`:
```
category_id            uuid
title                  string
income_type            one_time | recurring
amount_gte / amount_lte
impact_start_date_gte / impact_start_date_lte
impact_end_date_gte / impact_end_date_lte
received_date_gte / received_date_lte
```

`IncomeRead`:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "category_id": "uuid | null",
  "title": "string",
  "description": "string | null",
  "amount": "decimal",
  "income_type": "one_time | recurring",
  "received_date": "date | null",
  "impact_start_date": "date",
  "impact_end_date": "date | null",
  "source_text": "string | null",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

Regras de validação:
- `impact_end_date >= impact_start_date` quando presente
- `one_time`: `impact_end_date` obrigatório

---

### Dashboard

#### `GET /dashboard`
Retorna o resumo financeiro de um período. Ambos os query params são opcionais — sem filtro retorna todos os registros do usuário.

Query params:
```
period_start  date (YYYY-MM-DD)  ex: 2026-06-01
period_end    date (YYYY-MM-DD)  ex: 2026-06-30
```

Um registro entra no período se:
```
impact_start_date <= period_end
AND (impact_end_date IS NULL OR impact_end_date >= period_start)
```

Response `200` (`DashboardRead`):
```json
{
  "total_incomes": "decimal",
  "total_expenses": "decimal",
  "total_balance": "decimal",
  "total_fixed_expenses": "decimal",
  "total_automatic_expenses": "decimal",
  "total_installment_expenses": "decimal",
  "total_one_time_expenses": "decimal",
  "total_recurring_incomes": "decimal",
  "total_one_time_incomes": "decimal"
}
```

`total_expenses` usa `amount / installments_count` por item, então já reflete o impacto mensal de parcelamentos.
`total_balance = total_incomes - total_expenses`.
