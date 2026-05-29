"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import type { Category } from "@/types/category"
import AddIncomeForm from "./add-income-form"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
}

const FORM_ID = "add-income-form"

export default function AddIncomeSheet({
  open,
  onOpenChange,
  categories,
}: Props) {
  const incomeCategories = categories.filter((c) => c.kind === "income")

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar Receita"
      description="Preencha os campos abaixo para adicionar uma receita."
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
      <AddIncomeForm
        id={FORM_ID}
        categories={incomeCategories}
        onSubmitted={() => onOpenChange(false)}
      />
    </ResponsiveSheet>
  )
}
