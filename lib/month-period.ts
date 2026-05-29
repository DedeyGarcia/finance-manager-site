import { endOfMonth, format, startOfMonth } from "date-fns"

import type { DashboardQueryParams } from "@/types/dashboard"

const ISO = "yyyy-MM-dd"

export type Month = {
  year: number
  /** 1-12 */
  month: number
}

/**
 * Converte um mês (year, month 1-12) no período da API.
 * O `Date` do JS usa mês 0-11, por isso o `month - 1` fica encapsulado aqui —
 * o resto do app só lida com 1-12.
 */
export function monthToPeriod({
  year,
  month,
}: Month): NonNullable<DashboardQueryParams> {
  const reference = new Date(year, month - 1, 1)
  return {
    period_start: format(startOfMonth(reference), ISO),
    period_end: format(endOfMonth(reference), ISO),
  }
}

export function getCurrentMonth(): Month {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
