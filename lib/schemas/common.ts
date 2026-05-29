import { z } from "zod"

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/

export const moneyInputSchema = z
  .string()
  .trim()
  .min(1, "Valor obrigatório")
  .refine((value) => MONEY_PATTERN.test(value), "Use um valor monetário válido")
  .refine((value) => Number(value) > 0, "Valor deve ser maior que zero")
  .transform(Number)

export const requiredIsoDate = (message: string) =>
  z.string().min(1, message).pipe(z.iso.date("Use uma data válida"))

export const optionalIsoDate = z
  .union([z.iso.date("Use uma data válida"), z.literal("")])
  .optional()
