import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//NextIntl
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Define supported locales
const LOCALES = ["en", "es"];
const DEFAULT_LOCALE = "es";

// Create the nextIntl middleware with our routing config
const intlMiddleware = createIntlMiddleware(routing);

// Route matchers
const isClientDashboardRoute = createRouteMatcher(["/:locale/(.*)"]);
const isProtectedRoute = createRouteMatcher(["/:locale/admin(.*)"]);
const isApiRoute = createRouteMatcher(["/api/(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/",
  "/es",
  "/en",
  "/api/uploads/video(/.*)?",
  "/accept-invitation(.*)",
  "/api/webhooks/clerk(.*)",
  "/sign-out(.*)",
  // Añadimos las versiones con locale
  "/:locale/sign-in(.*)", // ← versiones con prefijo
  "/:locale/sign-up(.*)",
  "/:locale/sign-out(.*)",
  "/:locale/accept-invitation(.*)",
]);

// Helper para obtener el locale preferido
const getPreferredLocale = (request: Request): string => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Intentar obtener locale de la URL actual - match only first segment
  const urlLocaleMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
  if (urlLocaleMatch && LOCALES.includes(urlLocaleMatch[1])) {
    return urlLocaleMatch[1];
  }

  // Verificar el header Accept-Language
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().substring(0, 2).toLowerCase());

    for (const lang of languages) {
      if (LOCALES.includes(lang)) {
        return lang;
      }
    }
  }

  // Por defecto usar español
  return DEFAULT_LOCALE;
};

// Check if a path has duplicate locales and fix it
// Example: /es/es/sess_123 -> /es/sess_123
const fixDuplicateLocale = (pathname: string): string | null => {
  // Check for duplicate locale pattern (e.g., /es/es/ or /en/en/)
  for (const locale of LOCALES) {
    const duplicatePattern = new RegExp(`^\\/${locale}\\/${locale}\\/`);
    if (duplicatePattern.test(pathname)) {
      // Remove the duplicate
      return pathname.replace(duplicatePattern, `/${locale}/`);
    }
  }
  return null; // No duplicate found
};

// Parse path to extract locale and remaining path
const parsePath = (
  pathname: string
): { locale: string | null; path: string } => {
  const segments = pathname.split("/").filter(Boolean);

  // Check if first segment is a valid locale
  if (segments.length > 0 && LOCALES.includes(segments[0])) {
    return {
      locale: segments[0],
      path: segments.slice(1).join("/"),
    };
  }

  return {
    locale: null,
    path: segments.join("/"),
  };
};

export default clerkMiddleware(async (auth, req) => {
  console.log("Request URL:", req.url);
  const request = await req;
  const { pathname, searchParams } = new URL(request.url);

  // Check for duplicate locale pattern and fix it
  const fixedPath = fixDuplicateLocale(pathname);
  if (fixedPath) {
    console.log(`Fixing duplicate locale: ${pathname} -> ${fixedPath}`);
    return NextResponse.redirect(new URL(fixedPath, request.url));
  }

  // 1. Manejo de rutas API
  if (isApiRoute(request)) {
    // Permitir webhooks de Clerk y uploads sin autenticación
    if (
      pathname.startsWith("/api/webhooks/clerk") ||
      pathname.startsWith("/api/uploads/video")
    ) {
      return NextResponse.next();
    }
    // Resto de APIs requieren autenticación
    await auth.protect();
    return NextResponse.next();
  }

  // 2. Manejo de rutas públicas
  if (isPublicRoute(request)) {
    console.log("is public route");
    if (isProtectedRoute(req)) await auth.protect();
    if (pathname === "/sign-in" && !searchParams.has("redirect_url")) {
      return NextResponse.next();
    }
    return intlMiddleware(request);
  }

  // 3. Validación de sesión y redirección al dashboard
  const { sessionClaims } = await auth();
  const userSession = sessionClaims?.sid;

  // Redirección después del login o en la ruta raíz
  if (pathname === "/" || pathname === "/redirect-after-signin") {
    if (!userSession) {
      const locale = getPreferredLocale(request);
      return NextResponse.redirect(new URL(`/${locale}/sign-in`, req.url));
    }

    const locale = getPreferredLocale(request);
    return NextResponse.redirect(
      new URL(`/${locale}/${userSession}/dashboard`, req.url)
    );
  }

  // 4. Handle locale changes for existing paths
  const parsed = parsePath(pathname);
  const preferredLocale = getPreferredLocale(request);

  // If URL has no locale or wrong locale, redirect with correct locale
  if (!parsed.locale || parsed.locale !== preferredLocale) {
    if (userSession && pathname.includes(userSession)) {
      // For user session pages, extract the path after locale
      const sessionPathMatch = pathname.match(/^(?:\/[a-z]{2})?\/(.*)/);
      if (sessionPathMatch && sessionPathMatch[1]) {
        const newPath = `/${preferredLocale}/${sessionPathMatch[1]}`;
        console.log(`Redirecting to correct locale: ${pathname} -> ${newPath}`);
        return NextResponse.redirect(new URL(newPath, request.url));
      }
    }
  }

  // 5. Protección del dashboard de clientes
  if (isClientDashboardRoute(request)) {
    await auth.protect();
    console.log("Client Dashboard accessed");
    return NextResponse.next();
  }

  // 6. Protección por defecto y manejo de i18n
  await auth.protect();
  return intlMiddleware(request);
});

export const config = {
  matcher: [
    // Evitar que se ejecute en archivos estáticos
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|mp4|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Aplicar siempre en rutas de API/trpc (solo Clerk, sin i18n)
    "/(api|trpc)(.*)",
  ],
};
