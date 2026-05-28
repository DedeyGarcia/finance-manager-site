"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { apiFetch, ApiError } from "@/lib/api-client"
import type { components } from "@/docs/api.types"
import type { LoginFormData, SignupFormData } from "@/lib/schemas/auth"

type TokenResponse = components["schemas"]["TokenResponse"]

export async function loginAction(
  data: LoginFormData
): Promise<{ error: string } | never> {
  let token: string
  try {
    // OAuth2 Password Flow exige application/x-www-form-urlencoded e campo "username"
    // (mesmo recebendo e-mail). URLSearchParams seta o Content-Type correto automaticamente.
    const body = new URLSearchParams({
      username: data.email,
      password: data.password,
    })
    const result = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body,
    })
    token = result.access_token
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      return { error: "E-mail ou senha inválidos" }
    }
    return { error: "Erro ao fazer login. Tente novamente." }
  }

  ;(await cookies()).set("session_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  redirect("/dashboard")
}

export async function logoutAction() {
  ;(await cookies()).delete("session_token")
  redirect("/login")
}

export async function signupAction(
  data: SignupFormData
): Promise<{ error: string } | never> {
  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: { name: data.name, email: data.email, password: data.password },
    })
  } catch (e) {
    if (e instanceof ApiError && e.status === 409) {
      return { error: "Este e-mail já está em uso" }
    }
    return { error: "Erro ao criar conta. Tente novamente." }
  }

  let token: string
  try {
    const loginBody = new URLSearchParams({
      username: data.email,
      password: data.password,
    })
    const result = await apiFetch<TokenResponse>("/auth/login", {
      method: "POST",
      body: loginBody,
    })
    token = result.access_token
  } catch {
    redirect("/login")
  }

  ;(await cookies()).set("session_token", token!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
  redirect("/dashboard")
}
