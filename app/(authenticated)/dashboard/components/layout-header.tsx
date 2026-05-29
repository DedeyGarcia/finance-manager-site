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
import AddExpenseSheet from "./add-expense-sheet"

export default function LayoutHeader() {
  const [expenseOpen, setExpenseOpen] = useState(false)

  return (
    <div className="flex flex-row items-center border-b px-8 py-4">
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

      <AddExpenseSheet open={expenseOpen} onOpenChange={setExpenseOpen} />
    </div>
  )
}
