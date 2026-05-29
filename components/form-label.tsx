import { FieldLabel } from "@/components/ui/field"
import type { ComponentProps } from "react"

type Props = ComponentProps<typeof FieldLabel> & { required?: boolean }

export function FormLabel({ required, children, ...props }: Props) {
  return (
    <FieldLabel {...props}>
      {children}
      {required && <span aria-hidden="true">*</span>}
    </FieldLabel>
  )
}
