"use client"

import { Button } from "@/components/ui/button"
import { ResponsiveSheet } from "@/components/responsive-sheet"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FORM_ID = "add-expense-form"

export default function AddExpenseSheet({ open, onOpenChange }: Props) {
  const handleSubmit = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    // TODO: integrar com React Hook Form + mutation
    onOpenChange(false)
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="Adicionar Despesa"
      description="Preencha os campos abaixo para adicionar uma despesa."
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
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {/* campos aqui */}
      </form>
    </ResponsiveSheet>
  )
}
