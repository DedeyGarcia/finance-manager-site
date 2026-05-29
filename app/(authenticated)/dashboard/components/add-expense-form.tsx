"use client"

import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { addMonths, format, isValid, parse } from "date-fns"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { FormLabel } from "@/components/form-label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DatePickerField } from "@/components/date-picker-field"
import {
  expenseCreateSchema,
  type ExpenseCreateFormData,
  type ExpenseCreateFormInput,
} from "@/lib/schemas/expense"
import type { Category } from "@/types/category"
import { ExpenseCreate } from "@/types/expense"
import { useCreateExpense } from "../hooks/use-create-expense"

type Props = {
  id: string
  categories: Category[]
  onSubmitted?: (data: ExpenseCreateFormData) => void
}

const EXPENSE_TYPE_LABELS: Record<
  ExpenseCreateFormData["expense_type"],
  { label: string; hint: string }
> = {
  one_time: {
    label: "Avulsa",
    hint: "Uma única ocorrência em uma data específica.",
  },
  fixed: {
    label: "Fixa",
    hint: "Recorrência mensal não cobrada automáticamente (ex.: aluguel, aula de música).",
  },
  automatic_debit: {
    label: "Débito automático",
    hint: "Recorrência mensal debitada automaticamente.",
  },
  installment: {
    label: "Parcelada",
    hint: "Compra única dividida em N parcelas mensais.",
  },
}

export default function AddExpenseForm({ id, categories, onSubmitted }: Props) {
  const createExpense = useCreateExpense()

  const form = useForm<ExpenseCreateFormInput, unknown, ExpenseCreateFormData>({
    resolver: zodResolver(expenseCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      category_id: "",
      expense_type: "one_time",
      installments_count: "1",
      impact_start_date: format(new Date(), "yyyy-MM-dd"),
      impact_end_date: "",
      purchase_date: "",
      source_text: "",
    },
  })

  const [expenseType, impactStartDate, installmentsCount] = useWatch({
    control: form.control,
    name: ["expense_type", "impact_start_date", "installments_count"],
  })

  const { isSubmitted } = form.formState
  const isInstallment = expenseType === "installment"
  const isRecurring =
    expenseType === "fixed" || expenseType === "automatic_debit"
  const impactStartDescription =
    expenseType === "automatic_debit" || isInstallment
      ? "Vencimento da fatura ou data do pagamento."
      : "Data em que foi realizado o pagamento"

  useEffect(() => {
    form.setValue("installments_count", isInstallment ? "2" : "1", {
      shouldValidate: true,
    })
  }, [isInstallment, form])

  useEffect(() => {
    if (!isInstallment) return
    if (!impactStartDate) return
    if (!/^[1-9]\d*$/.test(installmentsCount)) return
    const count = Number(installmentsCount)
    if (count < 2) return
    const start = parse(impactStartDate, "yyyy-MM-dd", new Date())
    if (!isValid(start)) return
    const end = format(addMonths(start, count - 1), "yyyy-MM-dd")
    form.setValue("impact_end_date", end, { shouldValidate: true })
  }, [isInstallment, impactStartDate, installmentsCount, form])

  useEffect(() => {
    if (!isSubmitted) return

    void form.trigger(["impact_end_date", "installments_count"])
  }, [expenseType, isSubmitted, form])

  function emptyToNull(value: string | undefined) {
    return value?.trim() ? value.trim() : null
  }

  function toExpenseCreate(data: ExpenseCreateFormData): ExpenseCreate {
    return {
      category_id: data.category_id,
      title: data.title,
      description: emptyToNull(data.description),
      amount: data.amount,
      expense_type: data.expense_type,
      purchase_date: emptyToNull(data.purchase_date),
      impact_start_date: data.impact_start_date,
      impact_end_date: emptyToNull(data.impact_end_date),
      installments_count: data.installments_count,
      source_text: emptyToNull(data.source_text),
    }
  }

  async function onSubmit(data: ExpenseCreateFormData) {
    await createExpense.mutateAsync(toExpenseCreate(data))
    onSubmitted?.(data)
  }

  return (
    <form id={id} onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          name="title"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FormLabel htmlFor={field.name} required>
                Título
              </FormLabel>
              <Input
                {...field}
                id={field.name}
                placeholder="Ex.: Conta de luz"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Controller
            name="amount"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FormLabel htmlFor={field.name} required>
                  Valor total
                </FormLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="0,00"
                  aria-invalid={fieldState.invalid}
                />
                {isInstallment ? (
                  <FieldDescription>
                    Valor total da compra, não da parcela.
                  </FieldDescription>
                ) : null}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="category_id"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FormLabel htmlFor={field.name} required>
                  Categoria
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                  >
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    side="bottom"
                    avoidCollisions={false}
                  >
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="expense_type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FormLabel htmlFor={field.name} required>
                Tipo de despesa
              </FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  side="bottom"
                  avoidCollisions={false}
                >
                  {Object.entries(EXPENSE_TYPE_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {EXPENSE_TYPE_LABELS[field.value].hint}
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {isInstallment && (
          <Controller
            name="installments_count"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FormLabel htmlFor={field.name} required>
                  Nº de parcelas
                </FormLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="2"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        )}

        <Controller
          name="purchase_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Data da compra</FieldLabel>
              <DatePickerField
                id={field.name}
                value={field.value}
                onChange={field.onChange}
                ariaInvalid={fieldState.invalid}
              />
              <FieldDescription>
                Quando a transação aconteceu de verdade.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Controller
            name="impact_start_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FormLabel htmlFor={field.name} required>
                  Início do impacto
                </FormLabel>
                <DatePickerField
                  id={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  ariaInvalid={fieldState.invalid}
                />
                <FieldDescription>{impactStartDescription}</FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="impact_end_date"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FormLabel htmlFor={field.name} required={!isRecurring}>
                  Fim do impacto
                </FormLabel>
                <DatePickerField
                  id={field.name}
                  value={field.value}
                  onChange={field.onChange}
                  ariaInvalid={fieldState.invalid}
                  disabled={isInstallment}
                  clearable={!isInstallment}
                />
                {isInstallment ? (
                  <FieldDescription>
                    Calculado automaticamente pelo número de parcelas.
                  </FieldDescription>
                ) : null}
                {isRecurring && (
                  <FieldDescription>
                    Deixe em branco para recorrência indefinida.
                  </FieldDescription>
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </div>

        <Controller
          name="description"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Descrição</FieldLabel>
              <Textarea
                {...field}
                value={field.value ?? ""}
                id={field.name}
                rows={3}
                placeholder="Notas adicionais"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="source_text"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Fonte</FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                id={field.name}
                placeholder="Ex.: Cartão BB, PIX, Débito automático"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {form.formState.errors.root && (
          <FieldError errors={[form.formState.errors.root]} />
        )}
      </FieldGroup>
    </form>
  )
}
