import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

export default function AddExpenseSheet() {
  return (
    <Sheet>
      <SheetTrigger>Open</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Adicionar Despesa</SheetTitle>
          <SheetDescription>
            Preencha os campos abaixo para adicionar uma despesa.
          </SheetDescription>
        </SheetHeader>
        <SheetFooter></SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
