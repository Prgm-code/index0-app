"use client";

import { useEffect, useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { StorageUsage } from "@/components/StorageUsage";

export function NavMain({
  items,
  collapsible,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const t = useTranslations("menu");
  const [isFullyExpanded, setIsFullyExpanded] = useState<boolean>(
    collapsible !== "icon"
  );
  const isIconMode = collapsible === "icon";

  // Manejar el cambio de estado de la barra lateral con un retardo para la animación
  useEffect(() => {
    if (collapsible === "icon") {
      // Si se colapsa, ocultamos inmediatamente
      setIsFullyExpanded(false);
    } else {
      // Si se expande, esperamos a que termine la animación
      const timer = setTimeout(() => {
        setIsFullyExpanded(true);
      }, 300); // Ajusta este valor según la duración de la animación

      return () => clearTimeout(timer);
    }
  }, [collapsible]);

  return (
    <SidebarGroup>
      <StorageUsage isIconMode={isIconMode} isFullyExpanded={isFullyExpanded} />

      <SidebarGroupLabel>{t("main")}</SidebarGroupLabel>
      <SidebarMenu>
        {Array.isArray(items) &&
          items.map((item) => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={item.isActive}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton asChild>
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
