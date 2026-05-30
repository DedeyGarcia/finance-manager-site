import { differenceInCalendarMonths } from "date-fns"

import type { ExpenseRead } from "@/types/expense"

export type MonthlyImpactInput = {
  amount: string | number
  expense_type: ExpenseRead["expense_type"]
  installments_count: number
}

/**
 * Trunca um valor monetário nos centavos. O epsilon evita perder um centavo por
 * imprecisão de ponto flutuante quando o valor é exato (ex: 100.00 representado
 * internamente como 99.999999…).
 */
function floorToCents(value: number): number {
  return Math.floor(value * 100 + 1e-6) / 100
}

function toNumber(amount: string | number): number {
  return typeof amount === "string" ? parseFloat(amount) : amount
}

/**
 * Impacto mensal "regular": amount/installments para parcelamento, senão o amount
 * cheio — sempre truncado nos centavos. Não considera qual parcela é o mês (não
 * aplica a sobra da 1ª parcela); use {@link getMonthlyImpactInPeriod} para o valor
 * exato de um mês. Serve para ordenação e prévia otimista do dashboard.
 */
export function getMonthlyImpact(expense: MonthlyImpactInput): number {
  return floorToCents(toNumber(expense.amount) / expense.installments_count)
}

/**
 * Valor de uma parcela específica. A 1ª parcela absorve a sobra de centavos do
 * arredondamento; as demais ficam com o valor truncado. É o padrão mais comum das
 * maquininhas/bancos — a sobra pode ir para a última conforme a config do lojista,
 * mas a 1ª é o default. Ex: 1146.68/12 → 1ª = 95.63, demais = 95.55.
 */
export function getInstallmentAmount(
  amount: number,
  installmentsCount: number,
  currentInstallment: number
): number {
  const regular = floorToCents(amount / installmentsCount)
  if (currentInstallment <= 1) {
    return Math.round((amount - (installmentsCount - 1) * regular) * 100) / 100
  }
  return regular
}

export type PeriodImpactInput = MonthlyImpactInput & {
  impact_start_date: string
}

/**
 * Impacto do mês selecionado: para parcelamento, devolve o valor da parcela
 * daquele mês (a 1ª carrega a sobra); senão, o amount cheio truncado.
 */
export function getMonthlyImpactInPeriod(
  expense: PeriodImpactInput,
  periodStart: string
): number {
  const amount = toNumber(expense.amount)
  if (expense.expense_type !== "installment" || expense.installments_count <= 1) {
    return floorToCents(amount)
  }
  const current = getCurrentInstallment(expense.impact_start_date, periodStart)
  return getInstallmentAmount(amount, expense.installments_count, current)
}

/**
 * Número da parcela atual relativa ao período selecionado (CLAUDE.md):
 *   parcela_atual = diferença_meses(impact_start_date, period_start) + 1
 * Datas em ISO "yyyy-MM-dd".
 */
export function getCurrentInstallment(
  impactStart: string,
  periodStart: string
): number {
  const start = new Date(`${impactStart}T00:00:00`)
  const period = new Date(`${periodStart}T00:00:00`)
  return differenceInCalendarMonths(period, start) + 1
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
