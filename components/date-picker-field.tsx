"use client"

import { format, parse, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  id?: string
  value: string | null | undefined
  onChange: (value: string) => void
  placeholder?: string
  ariaInvalid?: boolean
  disabled?: boolean
  clearable?: boolean
}

const ISO = "yyyy-MM-dd"
const DISPLAY = "dd/MM/yyyy"

function parseIso(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = parse(value, ISO, new Date())
  return isValid(date) ? date : undefined
}

export function DatePickerField({
  id,
  value,
  onChange,
  placeholder = "Selecione a data",
  ariaInvalid,
  disabled,
  clearable = true,
}: Props) {
  const selected = parseIso(value)
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            className={cn(
              "w-full justify-start pr-8 font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected
              ? format(selected, DISPLAY, { locale: ptBR })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={4}
          className="z-60 w-auto p-0"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(date) => {
              onChange(date ? format(date, ISO) : "")
              setOpen(false)
            }}
            locale={ptBR}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {clearable && selected && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Limpar data"
          onClick={() => onChange("")}
          className="absolute top-1/2 right-1 size-6 -translate-y-1/2 text-muted-foreground !transition-colors hover:bg-muted hover:text-foreground active:!scale-[0.98] active:!translate-y-[calc(-50%+0.5px)]"
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
