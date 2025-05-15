"use client";

import * as React from "react";
import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useTranslations } from "next-intl";

export function NavProjects({
  projects,
}: {
  projects: {
    name: string;
    url?: string;
    icon?: LucideIcon;
    category?: boolean;
  }[];
}) {
  const { isMobile } = useSidebar();
  const t = useTranslations("menu");

  // Group projects by category
  const categories: Record<string, typeof projects> = {};
  let currentCategory = "default";

  projects.forEach((item) => {
    if (item.category) {
      currentCategory = item.name;
      if (!categories[currentCategory]) {
        categories[currentCategory] = [];
      }
    } else {
      if (!categories[currentCategory]) {
        categories[currentCategory] = [];
      }
      categories[currentCategory].push(item);
    }
  });

  return (
    <SidebarGroup>
      {Object.entries(categories).map(([category, items]) => (
        <React.Fragment key={category}>
          {category !== "default" && (
            <SidebarGroupLabel>{category}</SidebarGroupLabel>
          )}
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild tooltip={item.name}>
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
                {item.url && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction showOnHover>
                        <MoreHorizontal />
                        <span className="sr-only">More</span>
                      </SidebarMenuAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-48 rounded-lg"
                      side={isMobile ? "bottom" : "right"}
                      align={isMobile ? "end" : "start"}
                    >
                      <DropdownMenuItem>
                        <Folder className="text-muted-foreground" />
                        <span>View Folder</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Forward className="text-muted-foreground" />
                        <span>Share Folder</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Trash2 className="text-muted-foreground" />
                        <span>Delete Folder</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </React.Fragment>
      ))}
    </SidebarGroup>
  );
}
