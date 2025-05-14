import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

//NextIntl
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
const intlMiddleware = createIntlMiddleware(routing);

// const isDashboardRoute = createRouteMatcher(["/:locale/admin(.*)"]);
// const isApiRoute = createRouteMatcher(["/api(.*)"]);
const isAdminRoute = createRouteMatcher(["/:locale/admin(.*)"]);
const isClientDashboardRoute = createRouteMatcher(["/:locale/client(.*)"]);
const isProtectedRoute = createRouteMatcher(["/:locale/admin(.*)"]);
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

export default clerkMiddleware(async (auth, req) => {
  console.log("Request URL:", req.url);
  const request = await req;
  const { pathname, searchParams } = new URL(request.url);
  // Primero se permite el acceso a rutas públicas
  if (isPublicRoute(request)) {
    // 1) Sigue igual para APIs/trpc

    console.log("is public route");
    if (isProtectedRoute(req)) await auth.protect();
    if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
      return NextResponse.next();
    }
    // 2) Si es **exactamente** `/sign-in` (sin redirect_url), pásala sin i18n
    if (pathname === "/sign-in" && !searchParams.has("redirect_url")) {
      return NextResponse.next();
    }
    // 3) resto de públicas → prefijo de idioma
    return intlMiddleware(request);
  }

  // Se obtienen los claims de la sesión y la metadata del usuario
  const { sessionClaims } = await auth();
  const userRole = sessionClaims?.metadata?.role;
  // const companies = sessionClaims?.metadata?.companies;
  const userSession = sessionClaims?.sid;
  console.log("sessionClaims", sessionClaims);
  console.log("userSession", userSession);
  console.log("userRole", userRole);
  // console.log("companyId", companyId);

  // Si el usuario llega a la ruta raíz o a una ruta de "redirect" especial, redirige según su rol
  const url = new URL(req.url);
  if (url.pathname === "/" || url.pathname === "/redirect-after-signin") {
    if (userRole === "admin") {
      return NextResponse.redirect(
        new URL(`/es/admin/${userSession}/shipments/list`, req.url)
      );
    } else if (userRole === "user") {
      return NextResponse.redirect(
        new URL(`/es/client/${userSession}/shipments/tracking`, req.url)
      );
    } else {
      return NextResponse.redirect(new URL(`/`, req.url));
    }
  }

  // Restricción de acceso a rutas de administrador
  if (isAdminRoute(request)) {
    console.log("Admin route accessed");
    if (userRole !== "admin") {
      const url = new URL("/", req.url);
      return NextResponse.redirect(url);
    }
  }

  // // Restricción de acceso a rutas del dashboard (usuarios autenticados)
  // if (isDashboardRoute(request) || isApiRoute(request)) {
  //   console.log("Protected route accessed (Dashboard/API)");
  //   if (!sessionClaims) {
  //     console.warn("Access denied: User is not authenticated");
  //     return NextResponse.redirect(new URL("/sign-in", req.url));
  //   }
  // }

  // Restricción de acceso al dashboard de clientes
  if (isClientDashboardRoute(request)) {
    await auth.protect();
    console.log("Client Dashboard accessed");
    // if (userRole !== "client" || !companies) {
    //   console.warn("Access denied: User is not a client or has no companies");
    //   return NextResponse.redirect(new URL("/", req.url));
    // }
    return NextResponse.next();
  }

  // Aplicar protección por defecto (requiere autenticación)
  await auth.protect();
  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    console.log("API route accessed, skipping i18n middleware");
    return NextResponse.next();
  }

  // Para todas las demás (páginas), aplicamos el middleware de i18n
  console.log("Applying i18n middleware");
  return intlMiddleware(req);
});

export const config = {
  matcher: [
    // Evitar que se ejecute en archivos estáticos

    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|mp4|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Aplicar siempre en rutas de API/trpc (solo Clerk, sin i18n)
    "/(api|trpc)(.*)",
  ],
};
