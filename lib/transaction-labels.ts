import type { ExpenseRead } from "@/types/expense"
import type { IncomeRead } from "@/types/income"

/** Rótulo + descrição de um tipo de transação, compartilhado por tabelas e forms. */
export type TypeMeta = { label: string; hint: string }

export const EXPENSE_TYPE_META: Record<ExpenseRead["expense_type"], TypeMeta> = {
  one_time: {
    label: "Avulso",
    hint: "Uma única ocorrência em uma data específica.",
  },
  fixed: {
    label: "Fixo",
    hint: "Recorrência mensal não cobrada automaticamente (ex.: aluguel, aula de música).",
  },
  automatic_debit: {
    label: "Débito automático",
    hint: "Recorrência mensal debitada automaticamente.",
  },
  installment: {
    label: "Parcelado",
    hint: "Compra única dividida em N parcelas mensais.",
  },
}

export const INCOME_TYPE_META: Record<IncomeRead["income_type"], TypeMeta> = {
  one_time: {
    label: "Pontual",
    hint: "Uma entrada única em uma data específica.",
  },
  recurring: {
    label: "Recorrente",
    hint: "Entrada que se repete mensalmente.",
  },
}
