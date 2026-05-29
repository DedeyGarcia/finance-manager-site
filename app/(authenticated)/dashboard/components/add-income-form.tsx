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
import type { Category } from "@/types/category"
import type { IncomeCreate } from "@/types/income"
import { useCreateIncome } from "../hooks/use-create-income"

type Props = {
  id: string
  categories: Category[]
  onSubmitted?: (data: IncomeCreateFormData) => void
}

const INCOME_TYPE_LABELS: Record<
  IncomeCreateFormData["income_type"],
  { label: string; hint: string }
> = {
  one_time: {
    label: "Pontual",
    hint: "Uma entrada única em uma data específica.",
  },
  recurring: {
    label: "Recorrente",
    hint: "Entrada que se repete mensalmente.",
  },
}

function emptyToNull(value: string | undefined) {
  return value?.trim() ? value.trim() : null
}

function toIncomeCreate(data: IncomeCreateFormData): IncomeCreate {
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

export default function AddIncomeForm({ id, categories, onSubmitted }: Props) {
  const createIncome = useCreateIncome()

  const form = useForm<IncomeCreateFormInput, unknown, IncomeCreateFormData>({
    resolver: zodResolver(incomeCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      category_id: "",
      income_type: "one_time",
      received_date: "",
      impact_start_date: format(new Date(), "yyyy-MM-dd"),
      impact_end_date: format(new Date(), "yyyy-MM-dd"),
      source_text: "",
    },
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

  async function onSubmit(data: IncomeCreateFormData) {
    await createIncome.mutateAsync(toIncomeCreate(data))
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
                  {Object.entries(INCOME_TYPE_LABELS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                {INCOME_TYPE_LABELS[field.value].hint}
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
