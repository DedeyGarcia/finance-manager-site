import type { DashboardQueryParams } from "@/types/dashboard"

/**
 * Factory de queryKeys do TanStack Query.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * O que é uma queryKey?
 * ──────────────────────────────────────────────────────────────────────────
 * É a "identidade" de uma query no cache. Sempre uma tupla (array):
 *   ["dashboard"]                          → uma query
 *   ["dashboard", { month: 5, year: 2026 }] → outra query (cache separado)
 *   ["dashboard", { month: 6, year: 2026 }] → outra query ainda
 *
 * Duas queries com a MESMA key compartilham cache. Mudou qualquer item da
 * tupla → cache novo, refetch novo.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Como funciona invalidateQueries (a parte que importa de verdade):
 * ──────────────────────────────────────────────────────────────────────────
 * `invalidateQueries({ queryKey: K })` faz match por PREFIXO: invalida toda
 * query cuja key COMEÇA com K. Exemplos com K = ["dashboard"]:
 *
 *   ["dashboard"]                          ✓ invalida
 *   ["dashboard", { month: 5 }]            ✓ invalida
 *   ["dashboard", "summary", { month: 5 }] ✓ invalida
 *   ["expenses"]                            ✗ não toca
 *
 * Por isso a hierarquia importa: o nível mais raso (`all`) varre tudo da
 * entidade; níveis mais profundos invalidam só uma fatia específica.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Por que `as const`?
 * ──────────────────────────────────────────────────────────────────────────
 * Sem `as const`, o TS infere `string[]` (array mutável de strings) e você
 * perde tipagem literal. Com `as const`, vira tupla readonly com tipos
 * literais — autocomplete, refactor seguro, e o tipo carrega informação
 * útil pra ferramentas que olham a key (ex: devtools, libs auxiliares).
 *
 *   ["dashboard"]            → string[]
 *   ["dashboard"] as const   → readonly ["dashboard"]
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Convenção de níveis (padrão da comunidade TanStack):
 * ──────────────────────────────────────────────────────────────────────────
 *   all        → raiz da entidade. Invalida TUDO da entidade.
 *   lists()    → todas as listagens (qualquer filtro).
 *   list(f)    → uma listagem específica com filtro f.
 *   details()  → todos os detalhes.
 *   detail(id) → um detalhe específico.
 *
 * Não precisa criar todos os níveis. Crie só o que a entidade tem. O
 * dashboard, por exemplo, não tem "lista" nem "detail por id" — só um
 * resumo por período.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Como usar em mutation:
 * ──────────────────────────────────────────────────────────────────────────
 *   const createExpense = useMutation({
 *     mutationFn: (...) => apiFetch("/api/v1/expenses", { method: "POST", ... }),
 *     onSuccess: () => {
 *       // refetch automático de todo dashboard, qualquer mês:
 *       qc.invalidateQueries({ queryKey: queryKeys.dashboard.all })
 *     },
 *   })
 */
export const queryKeys = {
  dashboard: {
    all: ["dashboard"] as const,
    summary: (params?: DashboardQueryParams) =>
      [...queryKeys.dashboard.all, params ?? {}] as const,
  },
}
