import Link from "next/link";
import { Button } from "@/components/ui/button";
import LandingDrag from "@/components/LandingDrag";
import LanguageSwitcher from "@/components/language/LanguageSwitcher";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  const t = useTranslations();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-800 text-white">
      {/* Header */}
      {/* TODO: add iisloged clerck component to difference between login and signup */}
      <header className="px-6 py-4 border-b border-white/10 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10 sticky top-0 z-20 animate-fade-down animate-duration-[800ms]">
        <div className="mx-auto container flex items-center justify-between">
          <div className="flex items-center gap-4">
            {" "}
            <Image
              src="/index0-logo-transparente.webp"
              alt="Index0"
              width={48}
              height={48}
            />
            <h1 className="text-2xl font-bold animate-fade-in">Index0</h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <SignInButton mode="modal">
              <Button
                variant="ghost"
                className=" hover:text-white/80 animate-fade-in animate-delay-100 bg-white text-purple-900 hover:bg-white/60"
              >
                {t("navigation.login")}
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              <Button
                variant="ghost"
                className=" hover:text-white/80 animate-fade-in animate-delay-100 bg-white text-purple-900 hover:bg-white/60"
              >
                {t("navigation.signup")}
              </Button>
            </SignUpButton>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Copy */}
              <div className="flex-1 space-y-6 animate-fade-right animate-delay-300">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 animate-fade-in animate-delay-400">
                  {t("hero.title")}
                </h2>
                <p className="text-xl text-white/80 animate-fade-in animate-delay-500">
                  {t("hero.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-white text-purple-900 hover:bg-white/90 animate-jump animate-delay-600"
                    >
                      {t("navigation.startFree")}
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 animate-jump animate-delay-700"
                    >
                      {t("navigation.seeDemo")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Interactive Demo Component */}
              <div className="flex-1 animate-fade-left animate-delay-500">
                <LandingDrag />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-6 bg-black/20 backdrop-blur-lg view-animate-fade-up">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-center mb-12 text-white animate-fade-in">
              {t("features.title")}
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: t("features.organization.title"),
                  text: t("features.organization.description"),
                  iconPath:
                    "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
                },
                {
                  title: t("features.indexing.title"),
                  text: t("features.indexing.description"),
                  iconPath:
                    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
                },
                {
                  title: t("features.search.title"),
                  text: t("features.search.description"),
                  iconPath: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
                },
              ].map(({ title, text, iconPath }, index) => (
                <div
                  key={title}
                  className={`bg-white/5 backdrop-blur p-6 rounded-lg border border-white/10 hover:bg-white/10 transition animate-fade-up animate-delay-${
                    (index + 1) * 200
                  }`}
                >
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-purple-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={iconPath}
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white animate-fade-in animate-delay-100">
                    {title}
                  </h3>
                  <p className="text-white/70 animate-fade-in animate-delay-200">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <div className="mt-16 text-center px-6 view-animate-fade-up">
          <h2 className="text-3xl font-bold mb-6 text-white animate-fade-in">
            {t("cta.title")}
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8 animate-fade-in animate-delay-100">
            {t("cta.description")}
          </p>
          <Link href="#demo">
            <Button
              size="lg"
              className="px-8 bg-white text-purple-900 hover:bg-white/90 animate-bounce animate-infinite animate-duration-[2000ms]"
            >
              {t("cta.button")}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10 mt-16 animate-fade-up">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src="/index0-logo-transparente.webp"
                  alt="Index0"
                  width={32}
                  height={32}
                />
                <h2 className="text-xl font-bold text-white animate-fade-in">
                  Index0
                </h2>
              </div>
              <p className="text-sm text-white/60 animate-fade-in animate-delay-100">
                {t("footer.tagline")}
              </p>
            </div>
            <div className="flex gap-8">
              <Link
                href="/about"
                className="text-sm text-white/60 hover:text-white animate-fade-in animate-delay-200"
              >
                {t("navigation.about")}
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-white/60 hover:text-white animate-fade-in animate-delay-300"
              >
                {t("navigation.pricing")}
              </Link>
              <Link
                href="/contact"
                className="text-sm text-white/60 hover:text-white animate-fade-in animate-delay-400"
              >
                {t("navigation.contact")}
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-white/60 animate-fade-in animate-delay-500">
            &copy; {new Date().getFullYear()} Index0. {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}
