"use client";
import { AppSidebar } from "@/components/app-sidebar";
import LanguageSwitcher from "@/components/language/LanguageSwitcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import {
  BookOpen,
  File,
  FileSearch,
  FileSpreadsheet,
  FolderSearch,
  Home,
  LayoutDashboard,
  Settings,
  Clock,
  Star,
  Share2,
  Tag,
  Trash,
  Briefcase,
  User,
  FolderGit2,
  Folder,
} from "lucide-react";

import { useTranslations } from "next-intl";
import { useSession } from "@clerk/nextjs";

const getSidebarData = (userSession: string, t: any) => {
  return {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Index0",
        logo: "/index0-logo-transparente.webp",
        plan: t("plan"),
      },
    ],
    navMain: [
      {
        title: t("home"),
        url: `/client/${userSession}/dashboard`,
        icon: Home,
        items: [],
      },
      {
        title: t("dashboard"),
        url: `/client/${userSession}/dashboard`,
        icon: LayoutDashboard,
        items: [],
      },
      {
        title: t("documents.list"),
        url: `/client/${userSession}/documents/list`,
        icon: File,
        items: [],
      },
      {
        title: t("documents.recent"),
        url: `/client/${userSession}/documents/recent`,
        icon: Clock,
        items: [],
      },
      {
        title: t("documents.favorites"),
        url: `/client/${userSession}/documents/favorites`,
        icon: Star,
        items: [],
      },
      {
        title: t("documents.shared"),
        url: `/client/${userSession}/documents/shared`,
        icon: Share2,
        items: [],
      },
      {
        title: t("documents.tags"),
        url: `/client/${userSession}/documents/tags`,
        icon: Tag,
        items: [],
      },
      {
        title: t("documents.trash"),
        url: `/client/${userSession}/documents/trash`,
        icon: Trash,
        items: [],
      },
      {
        title: t("documents.title"),
        url: "#",
        icon: File,
        items: [
          {
            title: t("documents.upload"),
            url: `/client/${userSession}/documents/upload`,
          },
          {
            title: t("documents.search"),
            url: `/client/${userSession}/documents/search`,
          },
          {
            title: t("documents.view"),
            url: `/client/${userSession}/documents/view`,
          },
        ],
      },
      {
        title: t("reports.title"),
        url: "#",
        icon: FileSpreadsheet,
        items: [
          {
            title: t("reports.monthly"),
            url: `/client/${userSession}/reports/monthly`,
          },
          {
            title: t("reports.annual"),
            url: `/client/${userSession}/reports/annual`,
          },
          {
            title: t("reports.statistics"),
            url: `/client/${userSession}/reports/statistics`,
          },
        ],
      },
      {
        title: t("settings"),
        url: `/client/${userSession}/settings`,
        icon: Settings,
        items: [],
      },
    ],
    projects: [
      {
        name: t("folders.title"),
        category: true,
      },
      {
        name: t("folders.work"),
        url: `/client/${userSession}/folders/work`,
        icon: Briefcase,
      },
      {
        name: t("folders.personal"),
        url: `/client/${userSession}/folders/personal`,
        icon: User,
      },
      {
        name: t("folders.projects"),
        url: `/client/${userSession}/folders/projects`,
        icon: FolderGit2,
      },
    ],
  };
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tBreadcrumb = useTranslations("breadcrumb");
  const t = useTranslations("menu");
  const { session } = useSession();
  const data = getSidebarData(session?.id ?? "", t);
  return (
    <SidebarProvider>
      <AppSidebar data={data} />
      <SidebarInset className="relative">
        <div
          className="fixed inset-0 z-0"
          style={{
            background:
              "linear-gradient(to bottom right, oklch(0.141 0.005 285.823), oklch(0.541 0.281 293.009), oklch(0.274 0.006 286.033))",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 min-h-screen bg-background/60 backdrop-blur-sm dark:bg-black/50">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-white/10 bg-white/10 dark:bg-black/30 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/20 sticky top-0">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1 text-gray-800 hover:text-gray-900 dark:text-white/80 dark:hover:text-white" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4 bg-gray-400/20 dark:bg-white/10"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block text-gray-800 dark:text-white/80">
                    <BreadcrumbLink
                      href="#"
                      className="hover:text-gray-900 dark:hover:text-white"
                    >
                      {tBreadcrumb("platform")}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-gray-600/60 dark:text-white/60" />
                  <BreadcrumbItem className="text-gray-800 dark:text-white/80">
                    <BreadcrumbPage className="text-gray-800 dark:text-white/80">
                      {tBreadcrumb("navigation")}
                    </BreadcrumbPage>
                    <BreadcrumbSeparator className="hidden md:block text-gray-600/60 dark:text-white/60" />
                    <BreadcrumbPage className="text-gray-800 dark:text-white/80">
                      {tBreadcrumb("ordersList")}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-gray-600/60 dark:text-white/60" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-800 dark:text-white/80">
                      {tBreadcrumb("moreOptions")}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="flex justify-end items-center ml-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          <div className="flex justify-center p-4 xl:p-8 animate-fade-up">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
/*  */
