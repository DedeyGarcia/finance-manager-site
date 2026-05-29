import "server-only"

import { apiFetch } from "@/lib/api-client"
import type { User } from "@/types/user"

export const AuthService = {
  getMe: () => apiFetch<User>("/auth/me"),
}
