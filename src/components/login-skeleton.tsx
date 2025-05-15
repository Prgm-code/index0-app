// file: @/components/signin-skeleton.tsx

import { Skeleton } from "@/components/ui/skeleton";

export function SignInSkeleton() {
  return (
    <div className="min-h-[500px] min-w-96 mx-auto flex flex-col items-center space-y-4 p-8 bg-white rounded-md shadow-md">
      {/* Título principal (ej: "Iniciar sesión") */}
      <Skeleton className="h-6 w-1/2" />

      {/* Subtítulo (ej: "para continuar con...") */}
      <Skeleton className="h-4 w-3/4" />

      {/* Botones de Proveedores (Google / Microsoft) */}
      <div className="flex w-full justify-center space-x-2">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-10 w-1/2" />
      </div>

      {/* Separador visual (el "o") */}
      <Skeleton className="h-4 w-4 rounded-full" />

      {/* Campo de correo */}
      <div className="w-full space-y-2">
        {/* Etiqueta (ej: "Correo electrónico") */}
        <Skeleton className="h-4 w-1/3" />
        {/* Input */}
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Botón Continuar */}
      <Skeleton className="h-10 w-full" />

      {/* Pie / etiqueta de modo desarrollo */}
      <Skeleton className="h-4 w-1/2" />
      {/* Simulación de "Secured by Clerk" */}
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
