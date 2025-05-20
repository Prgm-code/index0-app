import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@pheralb/toast";
import { ThemeProvider } from "@/providers/theme-provider";
import { esMX, enUS } from "@clerk/localizations";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { unstable_ViewTransition as ViewTransition } from "react";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Base metadata that will be overridden by generateMetadata
// export const metadata: Metadata = {
//   title: "Index0",
//   description:
//     "Index0 is a document management system with an AI assistant powered by RAG technology that retrieves information from your indexed files.",
// };

// Dynamic metadata generator based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Convert locale to OpenGraph format (e.g., 'es' to 'es_MX', 'en' to 'en_US')
  const ogLocale = locale === "en" ? "en_US" : "es_MX";

  return {
    title: "Index0",
    description:
      "Index0 is a document management system with an AI assistant powered by RAG technology that retrieves information from your indexed files.",
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: "https://www.index0.app",
      title: "Index0",
      description:
        "Index0 is a document management system with an AI assistant powered by RAG technology that retrieves information from your indexed files.",
      siteName: "Index0",
      images: [
        {
          url: "/og_en.png",
          width: 1200,
          height: 630,
          alt: "Index0",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Index0",
      description:
        "Index0 is a document management system with an AI assistant powered by RAG technology that retrieves information from your indexed files.",
      images: ["/images/og-image.jpg"],
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  console.log("locale", locale);
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <ViewTransition default="slow-fade">
      <ClerkProvider localization={locale === "en" ? enUS : esMX}>
        <html lang={locale} suppressHydrationWarning>
          <head>
            <meta property="og:image" content="<generated>" />
            <meta property="og:image:type" content="<generated>" />
            <meta property="og:image:width" content="<generated>" />
            <meta property="og:image:height" content="<generated>" />
            <meta property="twitter:image" content="<generated>" />
            <meta property="twitter:image:type" content="<generated>" />
            <meta property="twitter:image:width" content="<generated>" />
            <meta property="twitter:image:height" content="<generated>" />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased overflow-x-hidden`}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <NextIntlClientProvider>{children}</NextIntlClientProvider>

              <Toaster />
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    </ViewTransition>
  );
}
