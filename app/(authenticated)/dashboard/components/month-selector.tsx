"use client"

import { useState } from "react"
import { useIsFetching } from "@tanstack/react-query"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Loader2Icon,
  Undo2Icon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getCurrentMonth } from "@/lib/month-period"
import { useMonthStore } from "@/lib/stores/month-store"
import { cn } from "@/lib/utils"

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function monthLabel(year: number, month: number, pattern: string) {
  return capitalize(format(new Date(year, month - 1, 1), pattern, { locale: ptBR }))
}

export default function MonthSelector() {
  const year = useMonthStore((state) => state.year)
  const month = useMonthStore((state) => state.month)
  const setMonth = useMonthStore((state) => state.setMonth)
  const goPrev = useMonthStore((state) => state.goPrev)
  const goNext = useMonthStore((state) => state.goNext)
  const goToday = useMonthStore((state) => state.goToday)

  const today = getCurrentMonth()
  const isCurrentMonth = year === today.year && month === today.month

  // Indicador global: reflete a query da página atual sem acoplar ao dashboard.
  const isFetching = useIsFetching() > 0

  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(year)

  function handleOpenChange(next: boolean) {
    if (next) setViewYear(year)
    setOpen(next)
  }

  function handleSelect(selectedMonth: number) {
    setMonth(viewYear, selectedMonth)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Mês anterior"
        onClick={goPrev}
      >
        <ChevronLeftIcon />
      </Button>

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="font-medium sm:min-w-36"
          >
            <span className="sm:hidden">{monthLabel(year, month, "LLL yyyy")}</span>
            <span className="hidden sm:inline">
              {monthLabel(year, month, "LLLL yyyy")}
            </span>
            {isFetching ? (
              <Loader2Icon className="ml-1 size-4 animate-spin text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="ml-1 size-4 text-muted-foreground" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="center" sideOffset={4} className="w-64 p-3">
          <div className="mb-3 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Ano anterior"
              onClick={() => setViewYear((y) => y - 1)}
            >
              <ChevronLeftIcon />
            </Button>
            <span className="text-sm font-medium">{viewYear}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Próximo ano"
              onClick={() => setViewYear((y) => y + 1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>

          <div className="grid grid-cols-4 gap-1">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
              const isSelected = viewYear === year && m === month
              return (
                <Button
                  key={m}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className={cn("font-normal", isSelected && "font-medium")}
                  onClick={() => handleSelect(m)}
                >
                  {monthLabel(viewYear, m, "LLL")}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Próximo mês"
        onClick={goNext}
      >
        <ChevronRightIcon />
      </Button>

      {!isCurrentMonth && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Voltar para o mês atual"
          title="Voltar para o mês atual"
          onClick={goToday}
          className="size-7 rounded-full"
        >
          <Undo2Icon className="size-3.5" />
        </Button>
      )}
    </div>
  )
}
