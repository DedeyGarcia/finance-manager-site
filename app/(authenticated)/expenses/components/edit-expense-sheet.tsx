"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import ExpenseForm, {
  expenseToFormInput,
  toExpensePayload,
} from "@/app/(authenticated)/dashboard/components/expense-form"
import type { Category } from "@/types/category"
import type { ExpenseRead } from "@/types/expense"
import { useUpdateExpense } from "../hooks/use-update-expense"

type Props = {
  expense: ExpenseRead
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FORM_ID = "edit-expense-form"

export default function EditExpenseSheet({
  expense,
  categories,
  open,
  onOpenChange,
}: Props) {
  const updateExpense = useUpdateExpense()

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Editar Gasto"
      description="Atualize os campos abaixo para editar o gasto."
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
      <ExpenseForm
        id={FORM_ID}
        categories={categories}
        defaultValues={expenseToFormInput(expense)}
        onSubmit={async (data) => {
          updateExpense.mutate({
            id: expense.id,
            input: toExpensePayload(data),
          })
          onOpenChange(false)
        }}
      />
    </ResponsiveSheet>
  )
}
