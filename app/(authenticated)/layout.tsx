import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AuthService } from "@/services/auth"
import { CategoryService } from "@/services/category"
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
      <main className="flex flex-1 flex-col">
        <LayoutHeader categories={categories} />
        {children}
      </main>
    </SidebarProvider>
  )
}
