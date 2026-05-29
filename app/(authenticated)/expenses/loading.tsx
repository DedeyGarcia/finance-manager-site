import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-8">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-48" />
      </div>
      <Skeleton className="h-96 w-full rounded-md" />
    </div>
  )
}
