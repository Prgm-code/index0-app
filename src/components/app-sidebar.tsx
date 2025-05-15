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
} from "@/components/ui/sidebar";
import Image from "next/image";
import { useTranslations } from "next-intl";

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

  const userData = {
    firstName: user?.firstName,
    lastName: user?.lastName,
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b border-black/10 dark:border-white/10">
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
