import { z } from "zod"
import { moneyInputSchema, optionalIsoDate, requiredIsoDate } from "./common"

export const INCOME_TYPES = ["one_time", "recurring"] as const

export const incomeCreateSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Título é obrigatório")
      .max(120, "Título muito longo"),
    description: z.string().max(500, "Descrição muito longa").optional(),
    amount: moneyInputSchema,
    category_id: z.uuid("Selecione uma categoria"),
    income_type: z.enum(INCOME_TYPES, { message: "Selecione um tipo" }),
    received_date: optionalIsoDate,
    impact_start_date: requiredIsoDate("Data de início obrigatória"),
    impact_end_date: optionalIsoDate,
    source_text: z.string().max(120, "Fonte muito longa").optional(),
  })
  .refine((data) => data.income_type !== "one_time" || !!data.impact_end_date, {
    path: ["impact_end_date"],
    message: "Data de fim obrigatória para receita pontual",
  })
  .refine(
    (data) =>
      data.income_type !== "one_time" ||
      data.impact_end_date === data.impact_start_date,
    {
      path: ["impact_end_date"],
      message: "Data de fim deve ser igual ao início para receita pontual",
    }
  )
  .refine(
    (data) =>
      !data.impact_end_date || data.impact_end_date >= data.impact_start_date,
    {
      path: ["impact_end_date"],
      message: "Data de fim deve ser maior ou igual à data de início",
    }
  )

export type IncomeCreateFormInput = z.input<typeof incomeCreateSchema>
export type IncomeCreateFormData = z.output<typeof incomeCreateSchema>
