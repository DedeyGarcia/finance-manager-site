"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LayoutDashboardIcon,
  LogOut,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { logoutAction } from "@/lib/actions/auth"
import type { User } from "@/types/user"

type Props = {
  user: User
}

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
  { title: "Gastos", href: "/expenses", icon: TrendingDownIcon },
  { title: "Receitas", href: "/incomes", icon: TrendingUpIcon },
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AppSidebar({ user }: Props) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-3 px-3 py-3 border-t border-border/60">
          <Avatar size="default" className="shrink-0 ring-2 ring-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-medium text-foreground truncate leading-tight">
              {user.name}
            </span>
            <span className="text-xs text-muted-foreground truncate leading-tight">
              {user.email}
            </span>
          </div>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  onClick={() => logoutAction()}
                >
                  <LogOut className="size-4" />
                  <span className="sr-only">Sair</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
