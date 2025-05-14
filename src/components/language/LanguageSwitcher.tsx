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
        <Button variant="ghost">
          <Globe className="h-4 w-4" />
          <span className="ml-2 hidden md:inline-flex">
            {locale === "en" ? "EN" : "ES"}
          </span>
          <span className="sr-only">Cambiar idioma</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={locale === lang.code ? "bg-accent" : ""}
          >
            {lang.label}
            {lang.flag}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
