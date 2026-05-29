import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AddExpenseSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Despesa</SheetTitle>
          <SheetDescription>
            Preencha os campos abaixo para adicionar uma despesa.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter />
      </SheetContent>
    </Sheet>
  )
}
