import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthService } from "@/services/auth"
import { CategoryService } from "@/services/category"

// TODO: LayoutHeader/MonthSelector/add-*-sheet vivem em dashboard/components,
// mas são usados por todas as páginas autenticadas. Mover para um chrome
// compartilhado se surgir uma página autenticada com layout distinto.
import LayoutHeader from "./dashboard/components/layout-header"

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, categories] = await Promise.all([
    AuthService.getMe(),
    CategoryService.getCategories(),
  ])

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <main className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <LayoutHeader categories={categories} />
        {children}
      </main>
    </SidebarProvider>
  )
}
