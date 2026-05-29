import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { Category, CategoryListResponse } from "@/types/category"

export const CategoryService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiFetch<CategoryListResponse>("/categories")
    return res.data
  },
}
