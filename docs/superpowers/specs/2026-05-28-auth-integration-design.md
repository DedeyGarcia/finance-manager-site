# Design: Integração de Auth (Login & Signup)

**Data:** 2026-05-28  
**Autor:** Andrey Garcia

## Contexto

As páginas de login e signup existem como UI estática (sem estado, sem validação, sem chamadas à API). Precisamos integrá-las com React Hook Form + Zod, fazer as requests para o backend FastAPI, armazenar o token como cookie `httpOnly`, e proteger as rotas do app com middleware.

## Decisões de design

- **Server Actions** para login e signup: chamadas server-to-server, cookie `httpOnly` setado no servidor, `redirect()` nativo após sucesso.
- **React Hook Form + Zod** nos formulários: validação client-side antes de ir ao servidor; erros retornados pela action são exibidos inline no form.
- **Middleware Next.js** para proteção de rotas: verifica presença do cookie `session_token`; redireciona para `/login` se ausente.

## Arquitetura

```
Client Component (RHF)
    │
    ▼ onSubmit(data)
Server Action (lib/actions/auth.ts)   ← Node.js, sem expor URL da API
    │
    ├─▶ apiFetch('/auth/login' | '/auth/register')  → Backend :8000
    │
    ├─▶ cookies().set('session_token', token, { httpOnly: true })
    │
    └─▶ redirect('/')   OU   return { error: string }
                │
                ▼
         middleware.ts verifica cookie em todas as rotas (app)
```

## Fluxo de login

1. Zod valida (email obrigatório, formato email; senha obrigatória) — inline, sem ir ao servidor
2. `loginAction({ email, password })` é chamada
3. Action monta `URLSearchParams({ username: email, password })` (OAuth2 form-urlencoded)
4. `apiFetch<TokenResponse>('/auth/login', { method: 'POST', body })` — server-to-server
5. `cookies().set('session_token', token, { httpOnly: true, sameSite: 'lax', path: '/' })`
6. `redirect('/')` — usuário vai pro dashboard

**Em caso de erro:** action retorna `{ error: 'Email ou senha inválidos' }` → exibido abaixo do form via `setError('root', ...)`

## Fluxo de signup

1. Zod valida (nome ≥ 2 chars; email format; senha ≥ 8 chars; confirmação === senha)
2. `signupAction({ name, email, password })` é chamada
3. `apiFetch<UserRead>('/auth/register', { method: 'POST', body: { name, email, password } })`
4. Em seguida, faz auto-login: `apiFetch<TokenResponse>('/auth/login', { body: URLSearchParams(...) })`
5. `cookies().set('session_token', token, ...)` + `redirect('/')`

**Em caso de erro no registro:** `return { error: 'Este e-mail já está em uso' }` (ou mensagem genérica)

## Middleware

Arquivo: `middleware.ts` na raiz do projeto.

- Rotas públicas: `/login`, `/signup`
- Rotas protegidas: tudo mais (exceto `_next/static`, `_next/image`, `favicon.ico`, `api/`)
- Sem token → redirect para `/login`
- Com token tentando acessar `/login` ou `/signup` → redirect para `/`

## Arquivos afetados

| Arquivo | Ação |
|---------|------|
| `lib/schemas/auth.ts` | CRIAR — schemas Zod para login e signup |
| `lib/actions/auth.ts` | CRIAR — `loginAction` e `signupAction` com `"use server"` |
| `middleware.ts` | CRIAR — proteção de rotas |
| `components/login-form.tsx` | MODIFICAR — `"use client"`, RHF + zodResolver, chamar loginAction |
| `components/signup-form.tsx` | MODIFICAR — adicionar campo `name`, `"use client"`, RHF + zodResolver, chamar signupAction |

## Verificação

1. `npm run typecheck` — sem erros de tipo
2. `npm run build` — build de produção sem erros
3. Teste manual:
   - Acessar `/` sem token → redireciona para `/login` ✓
   - Login com credenciais inválidas → erro inline ✓
   - Login com credenciais válidas → redireciona para `/` ✓
   - Signup com email já usado → erro inline ✓
   - Signup com dados válidos → auto-login + redireciona para `/` ✓
   - Acessar `/login` autenticado → redireciona para `/` ✓
