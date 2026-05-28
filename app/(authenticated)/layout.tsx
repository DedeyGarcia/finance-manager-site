import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { apiFetch } from "@/lib/api-client"
import type { User } from "@/types/user"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await apiFetch<User>("/auth/me")

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  )
}
