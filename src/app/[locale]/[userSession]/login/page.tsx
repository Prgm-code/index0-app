import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold">Index0</h1>
            <h2 className="mt-6 text-3xl font-bold tracking-tight">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Regístrate
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form action="#" method="POST" className="space-y-6">
                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="mt-2">
                    <Input id="email" name="email" type="email" autoComplete="email" required />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="text-sm">
                      <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                        ¿Olvidaste tu contraseña?
                      </Link>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Input id="password" name="password" type="password" autoComplete="current-password" required />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <Label htmlFor="remember">Recordarme</Label>
                </div>

                <div>
                  <Button type="submit" className="w-full">
                    Iniciar sesión
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block lg:flex-1">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20">
          <div className="absolute inset-0 flex items-center justify-center p-12">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold text-foreground mb-6">
                Organiza, busca y extrae información de tus documentos con IA
              </h2>
              <p className="text-lg text-muted-foreground">
                Index0 te permite almacenar, clasificar y buscar en tus documentos de forma inteligente. Nuestra
                tecnología de IA analiza el contenido de tus archivos para que puedas encontrar exactamente lo que
                buscas en segundos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
