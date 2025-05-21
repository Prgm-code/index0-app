"use client";

import * as React from "react";

import { useUser, useSession } from "@clerk/nextjs";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { StorageUsage } from "./StorageUsage";

const GelymarLogo: React.FC = () => {
  return (
    <Image src="/Logo_transparent.png" alt="Logo" width={25} height={25} />
  );
};

// This is sample data.

export function AppSidebar({
  data,
  ...props
}: React.ComponentProps<typeof Sidebar> & { data: any }) {
  const { user } = useUser();
  const t = useTranslations("menu");
  const { state } = useSidebar();

  const userData = {
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
  };

  // Determinar si está en modo icono según el estado del sidebar
  const isIconMode = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-black/10 dark:border-white/10">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <StorageUsage isIconMode={isIconMode} isFullyExpanded={!isIconMode} />

        {/* <NavMain
          items={data.navMain}
          collapsible={isIconMode ? "icon" : "offcanvas"}
        /> */}
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            firstName: userData.firstName ?? "",
            lastName: userData.lastName ?? "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
