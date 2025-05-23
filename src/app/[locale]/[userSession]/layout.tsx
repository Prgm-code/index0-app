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
  Briefcase,
  User,
  FolderGit2,
  Home,
  Folder,
  Upload,
  Search,
  FileText,
  FolderIcon,
  Sparkles,
  FileSearch,
} from "lucide-react";

import { useTranslations } from "next-intl";
import { useSession } from "@clerk/nextjs";

import { ChatCardComponent } from "@/components/chatBox/ChatCardComponent";
import { useQueryClerk } from "@/hooks/useQueryClerk";

// TODO: Add the sidebar data from the database
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
        plan: t("plan.free"),
      },
    ],
    navMain: [
      {
        title: t("folders.title"),
        url: `/${userSession}`,
        icon: Folder,
        items: [
          {
            title: t("home"),
            url: `/${userSession}`,
            icon: Folder,
            items: [],
          },
        ],
      },
      //   {
      //     title: t("dashboard"),
      //     url: `/client/${userSession}/dashboard`,
      //     icon: LayoutDashboard,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.list"),
      //     url: `/client/${userSession}/documents/list`,
      //     icon: File,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.recent"),
      //     url: `/client/${userSession}/documents/recent`,
      //     icon: Clock,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.favorites"),
      //     url: `/client/${userSession}/documents/favorites`,
      //     icon: Star,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.shared"),
      //     url: `/client/${userSession}/documents/shared`,
      //     icon: Share2,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.tags"),
      //     url: `/client/${userSession}/documents/tags`,
      //     icon: Tag,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.trash"),
      //     url: `/client/${userSession}/documents/trash`,
      //     icon: Trash,
      //     items: [],
      //   },
      //   {
      //     title: t("documents.title"),
      //     url: "#",
      //     icon: File,
      //     items: [
      //       {
      //         title: t("documents.upload"),
      //         url: `/client/${userSession}/documents/upload`,
      //       },
      //       {
      //         title: t("documents.search"),
      //         url: `/client/${userSession}/documents/search`,
      //       },
      //       {
      //         title: t("documents.view"),
      //         url: `/client/${userSession}/documents/view`,
      //       },
      //     ],
      //   },
      //   {
      //     title: t("reports.title"),
      //     url: "#",
      //     icon: FileSpreadsheet,
      //     items: [
      //       {
      //         title: t("reports.monthly"),
      //         url: `/client/${userSession}/reports/monthly`,
      //       },
      //       {
      //         title: t("reports.annual"),
      //         url: `/client/${userSession}/reports/annual`,
      //       },
      //       {
      //         title: t("reports.statistics"),
      //         url: `/client/${userSession}/reports/statistics`,
      //       },
      //     ],
      //   },
      //   {
      //     title: t("settings"),
      //     url: `/client/${userSession}/settings`,
      //     icon: Settings,
      //     items: [],
      //   },
    ],
    projects: [
      {
        name: t("files.title"),
        category: true,
      },
      {
        name: t("files.manage"),
        url: `/${userSession}`,
        icon: FolderIcon,
      },
      {
        name: t("files.search"),
        url: `/${userSession}/smart`,
        icon: Sparkles,
      },
      {
        name: t("files.view"),
        url: `/${userSession}/files`,
        icon: FileSearch,
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

  const { data: userMetadata, isLoading } = useQueryClerk();

  // console.log(userMetadata);

  return (
    <SidebarProvider>
      <AppSidebar data={data} />
      <SidebarInset className="relative">
        {/* FONDO DECORATIVO */}
        <div
          className="fixed inset-0 z-0"
          style={{
            background:
              "linear-gradient(to bottom right, oklch(0.141 0.005 285.823), oklch(0.541 0.281 293.009), oklch(0.274 0.006 286.033))",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10 flex flex-col h-[100dvh] min-h-0 bg-background/60 backdrop-blur-sm dark:bg-black/50">
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-white/10 bg-white/10 dark:bg-black/30 backdrop-blur-md supports-[backdrop-filter]:bg-white/5 dark:supports-[backdrop-filter]:bg-black/20 sticky top-0 z-50">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1 text-gray-800 hover:text-gray-900 dark:text-white/80 dark:hover:text-white" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4 bg-gray-400/20 dark:bg-white/10"
              />
              {/* <Breadcrumb>
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
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block text-gray-600/60 dark:text-white/60" />
                  <BreadcrumbItem className="text-gray-800 dark:text-white/80">
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
              </Breadcrumb> */}
              <div className="flex justify-end items-center ml-auto">
                <LanguageSwitcher />
              </div>
            </div>
          </header>
          {/* ---------- CONTENIDO GRID ---------- */}
          {/* 📌 flex-1 min-h-0 para tomar el resto del alto */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {/* 📌 h-full para que el grid llene el área disponible */}
            <div className="grid grid-cols-1 md:grid-cols-3 h-full p-4 xl:p-8 animate-fade-up gap-4">
              {/* COLUMNA PRINCIPAL */}
              {/* overflow-auto para que el scrolling ocurra aquí si hace falta */}

              <div className="col-span-2 w-full flex flex-col flex-1 h-[90vh] overflow-auto">
                {children}
              </div>

              {/* COLUMNA CHAT */}
              {/* 📌 flex col min-h-0 => el Chat hereda la altura */}
              <div className="flex flex-col min-h-0">
                <ChatCardComponent /> {/* ya tiene flex-1 min-h-0 */}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
/*  */
