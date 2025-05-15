"use client";

import { Moon, Sun, User2Icon } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";
import { useSidebar } from "@/components/ui/sidebar";
import { Separator } from "./ui/separator";
import { useEffect, useState } from "react";

interface NavUserProps {
  user?: {
    firstName?: string;
    lastName?: string;
  };
}

export function NavUser({ user }: NavUserProps) {
  const { theme, setTheme } = useTheme();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <>
        {!isCollapsed && <Separator />}
        <div className="flex justify-between items-center p-2 rounded-md relative">
          {!isCollapsed && (
            <div className="flex items-center space-x-1">
              <User2Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{user?.firstName}</span>
              <span className="text-sm">{user?.lastName}</span>
            </div>
          )}
          <div className={`${isCollapsed ? "absolute right-0 py-2" : "flex"}`}>
            <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {!isCollapsed && <Separator />}
      <div className="flex justify-between items-center p-2 rounded-md relative">
        {!isCollapsed && (
          <div className="flex items-center space-x-1">
            <User2Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{user?.firstName}</span>
            <span className="text-sm">{user?.lastName}</span>
          </div>
        )}
        <div className={`${isCollapsed ? "absolute right-0 py-2" : "flex"}`}>
          <UserButton
            appearance={{
              elements: {
                avatarBox: "h-12 w-12",
              },
              baseTheme: theme === "dark" ? dark : undefined,
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Action label="signOut" />
              <UserButton.Action label="manageAccount" />
              <UserButton.Action
                label={theme === "dark" ? "Modo Claro" : "Modo Oscuro"}
                labelIcon={
                  theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )
                }
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                }}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </>
  );
}
