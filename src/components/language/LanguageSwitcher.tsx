"use client";
import React from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import US from "country-flag-icons/react/3x2/US";
import ES from "country-flag-icons/react/3x2/ES";

const LanguageSwitcher = () => {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();

  const languages = [
    { code: "en", label: "English", flag: <US className="h-4 w-4" /> },
    { code: "es", label: "Español", flag: <ES className="h-4 w-4" /> },
  ];

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale !== locale) {
      router.replace(pathname, { locale: newLocale });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-gray-800 hover:text-gray-900 dark:text-white dark:hover:text-white/80"
        >
          <Globe className="h-4 w-4" />
          <span className="ml-2 hidden md:inline-flex">
            {locale === "en" ? "EN" : "ES"}
          </span>
          <span className="sr-only">Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="backdrop-blur-md bg-white/80 dark:bg-black/60 border-gray-200 dark:border-white/20"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`${
              locale === lang.code
                ? "bg-gray-100 dark:bg-white/20"
                : "hover:bg-gray-50 dark:hover:bg-white/10"
            } text-gray-800 dark:text-white flex items-center justify-between gap-2`}
          >
            <span>{lang.label}</span>
            {lang.flag}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
