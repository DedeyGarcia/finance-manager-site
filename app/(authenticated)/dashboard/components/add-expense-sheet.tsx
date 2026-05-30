"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import type { Category } from "@/types/category"
import { useCreateExpense } from "../hooks/use-create-expense"
import ExpenseForm, {
  getExpenseFormDefaults,
  toExpensePayload,
} from "./expense-form"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
}

const FORM_ID = "add-expense-form"

export default function AddExpenseSheet({
  open,
  onOpenChange,
  categories,
}: Props) {
  const expenseCategories = categories.filter((c) => c.kind === "expense")
  const createExpense = useCreateExpense()

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar Gasto"
      description="Preencha os campos abaixo para adicionar um gasto."
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
        categories={expenseCategories}
        defaultValues={getExpenseFormDefaults()}
        onSubmit={async (data) => {
          createExpense.mutate(toExpensePayload(data))
          onOpenChange(false)
        }}
      />
    </ResponsiveSheet>
  )
}
