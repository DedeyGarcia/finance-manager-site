"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import IncomeForm, {
  incomeToFormInput,
  toIncomePayload,
} from "@/app/(authenticated)/dashboard/components/income-form"
import type { Category } from "@/types/category"
import type { IncomeRead } from "@/types/income"
import { useUpdateIncome } from "../hooks/use-update-income"

type Props = {
  income: IncomeRead
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FORM_ID = "edit-income-form"

export default function EditIncomeSheet({
  income,
  categories,
  open,
  onOpenChange,
}: Props) {
  const updateIncome = useUpdateIncome()

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Receita"
      description="Atualize os campos abaixo para editar a receita."
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID}>
            Salvar
          </Button>
        </>
      }
    >
      <IncomeForm
        id={FORM_ID}
        categories={categories}
        defaultValues={incomeToFormInput(income)}
        onSubmit={async (data) => {
          updateIncome.mutate({
            id: income.id,
            input: toIncomePayload(data),
          })
          onOpenChange(false)
        }}
      />
    </ResponsiveSheet>
  )
}
