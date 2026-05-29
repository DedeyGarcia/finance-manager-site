import { z } from "zod"

export const EXPENSE_TYPES = [
  "one_time",
  "fixed",
  "automatic_debit",
  "installment",
] as const

export const expenseCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(120, "Título muito longo"),
    description: z.string().max(500, "Descrição muito longa").optional(),
    amount: z
      .string()
      .trim()
      .min(1, "Valor obrigatório")
      .refine((v) => Number(v) > 0, "Valor deve ser maior que zero")
      .transform(Number),
    category_id: z.uuid("Selecione uma categoria"),
    expense_type: z.enum(EXPENSE_TYPES, { message: "Selecione um tipo" }),
    installments_count: z
      .string()
      .trim()
      .min(1, "Obrigatório")
      .refine((v) => /^[1-9]\d*$/.test(v), "Use um número inteiro positivo")
      .transform(Number),
    impact_start_date: z.string().min(1, "Data de início obrigatória"),
    impact_end_date: z.string().optional().or(z.literal("")),
    purchase_date: z.string().optional().or(z.literal("")),
    source_text: z.string().max(120, "Fonte muito longa").optional(),
  })
  .refine((data) => data.expense_type !== "one_time" || !!data.impact_end_date, {
    path: ["impact_end_date"],
    message: "Data de fim obrigatória para despesa avulsa",
  })
  .refine(
    (data) => data.expense_type !== "installment" || !!data.impact_end_date,
    {
      path: ["impact_end_date"],
      message: "Data de fim obrigatória para parcelamento",
    },
  )
  .refine(
    (data) =>
      data.expense_type !== "installment" || data.installments_count >= 2,
    {
      path: ["installments_count"],
      message: "Parcelamento exige pelo menos 2 parcelas",
    },
  )
  .refine(
    (data) =>
      !(
        data.expense_type === "fixed" ||
        data.expense_type === "automatic_debit"
      ) || data.installments_count === 1,
    {
      path: ["installments_count"],
      message: "Recorrências mensais devem ter 1 parcela",
    },
  )
  .refine(
    (data) =>
      !data.impact_end_date || data.impact_end_date >= data.impact_start_date,
    {
      path: ["impact_end_date"],
      message: "Data de fim deve ser maior ou igual à data de início",
    },
  )

export type ExpenseCreateFormInput = z.input<typeof expenseCreateSchema>
export type ExpenseCreateFormData = z.output<typeof expenseCreateSchema>
