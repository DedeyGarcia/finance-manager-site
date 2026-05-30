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
import AddIncomeSheet from "./add-income-sheet"
import MonthSelector from "./month-selector"

type Props = {
  categories: Category[]
}

export default function LayoutHeader({ categories }: Props) {
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)

  return (
    <div className="flex flex-row items-center border-b px-4 py-4 sm:px-8">
      <SidebarTrigger />
      <div className="sm:ml-2">
        <MonthSelector />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="ml-auto">
            <PlusIcon /> Adicionar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>O que deseja adicionar?</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setExpenseOpen(true)}>
              Gasto
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setIncomeOpen(true)}>
              Receita
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddIncomeSheet
        open={incomeOpen}
        onOpenChange={setIncomeOpen}
        categories={categories}
      />

      <AddExpenseSheet
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        categories={categories}
      />
    </div>
  )
}
