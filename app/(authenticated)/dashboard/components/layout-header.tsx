"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { PlusIcon } from "lucide-react"
import type { Category } from "@/types/category"
import AddExpenseSheet from "./add-expense-sheet"

type Props = {
  categories: Category[]
}

export default function LayoutHeader({ categories }: Props) {
  const [expenseOpen, setExpenseOpen] = useState(false)

  return (
    <div className="flex flex-row items-center border-b px-4 py-4 sm:px-8">
      <SidebarTrigger />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="ml-auto">
            <PlusIcon /> Adicionar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>O que deseja adicionar?</DropdownMenuLabel>
            <DropdownMenuItem>Receita</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setExpenseOpen(true)}>
              Despesa
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddExpenseSheet
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        categories={categories}
      />
    </div>
  )
}
