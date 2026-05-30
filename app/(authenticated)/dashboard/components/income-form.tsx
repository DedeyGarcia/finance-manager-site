"use client"

import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
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
  incomeCreateSchema,
  type IncomeCreateFormData,
  type IncomeCreateFormInput,
} from "@/lib/schemas/income"
import { INCOME_TYPE_META } from "@/lib/transaction-labels"
import type { Category } from "@/types/category"
import type { IncomeCreate, IncomeRead, IncomeUpdate } from "@/types/income"

type Props = {
  id: string
  categories: Category[]
  defaultValues: IncomeCreateFormInput
  onSubmit: (data: IncomeCreateFormData) => Promise<void>
}

function emptyToNull(value: string | undefined) {
  return value?.trim() ? value.trim() : null
}

/** Valores iniciais para o formulário de criação. */
export function getIncomeFormDefaults(): IncomeCreateFormInput {
  const today = format(new Date(), "yyyy-MM-dd")
  return {
    title: "",
    description: "",
    amount: "",
    category_id: "",
    income_type: "one_time",
    received_date: "",
    impact_start_date: today,
    impact_end_date: today,
    source_text: "",
  }
}

/** Converte uma receita existente nos valores do formulário (modo edição). */
export function incomeToFormInput(income: IncomeRead): IncomeCreateFormInput {
  return {
    title: income.title,
    description: income.description ?? "",
    amount: income.amount,
    category_id: income.category_id ?? "",
    income_type: income.income_type,
    received_date: income.received_date ?? "",
    impact_start_date: income.impact_start_date,
    impact_end_date: income.impact_end_date ?? "",
    source_text: income.source_text ?? "",
  }
}

/** Mapeia os dados validados do form para o payload da API (create/update). */
export function toIncomePayload(
  data: IncomeCreateFormData
): IncomeCreate & IncomeUpdate {
  return {
    category_id: data.category_id,
    title: data.title,
    description: emptyToNull(data.description),
    amount: data.amount,
    income_type: data.income_type,
    received_date: emptyToNull(data.received_date),
    impact_start_date: data.impact_start_date,
    impact_end_date: emptyToNull(data.impact_end_date),
    source_text: emptyToNull(data.source_text),
  }
}

export default function IncomeForm({
  id,
  categories,
  defaultValues,
  onSubmit,
}: Props) {
  const form = useForm<IncomeCreateFormInput, unknown, IncomeCreateFormData>({
    resolver: zodResolver(incomeCreateSchema),
    defaultValues,
  })

  const [incomeType, impactStartDate] = useWatch({
    control: form.control,
    name: ["income_type", "impact_start_date"],
  })

  const { isSubmitted } = form.formState
  const isOneTime = incomeType === "one_time"
  const isRecurring = incomeType === "recurring"
  const impactStartDescription = isRecurring
    ? "Data inicial da recorrência."
    : "Data em que a receita impacta o orçamento."

  useEffect(() => {
    if (!isOneTime) return
    if (!impactStartDate) return

    form.setValue("impact_end_date", impactStartDate, {
      shouldValidate: true,
    })
  }, [isOneTime, impactStartDate, form])

  useEffect(() => {
    if (!isSubmitted) return

    void form.trigger("impact_end_date")
  }, [incomeType, isSubmitted, form])

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
                placeholder="Ex.: Salário"
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
                  Valor
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
          name="income_type"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FormLabel htmlFor={field.name} required>
                Tipo de receita
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
                  {Object.entries(INCOME_TYPE_META).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {INCOME_TYPE_META[field.value].hint}
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="received_date"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Data de recebimento</FieldLabel>
              <DatePickerField
                id={field.name}
                value={field.value}
                onChange={field.onChange}
                ariaInvalid={fieldState.invalid}
              />
              <FieldDescription>
                Quando o dinheiro entrou de verdade.
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
                  disabled={isOneTime}
                  clearable={!isOneTime}
                />
                {isOneTime ? (
                  <FieldDescription>
                    Igual ao início para receitas pontuais.
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
                placeholder="Ex.: Empresa, cliente, reembolso"
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
