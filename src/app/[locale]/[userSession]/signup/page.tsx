import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold">Index0</h1>
            <h2 className="mt-6 text-3xl font-bold tracking-tight">Crear una cuenta</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <div className="mt-6">
              <form action="#" method="POST" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">Nombre</Label>
                    <div className="mt-2">
                      <Input id="first-name" name="first-name" type="text" autoComplete="given-name" required />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="last-name">Apellido</Label>
                    <div className="mt-2">
                      <Input id="last-name" name="last-name" type="text" autoComplete="family-name" required />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Correo electrónico</Label>
                  <div className="mt-2">
                    <Input id="email" name="email" type="email" autoComplete="email" required />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="mt-2">
                    <Input id="password" name="password" type="password" autoComplete="new-password" required />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mínimo 8 caracteres, incluyendo una letra mayúscula y un número
                  </p>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" className="mt-1" />
                  <Label htmlFor="terms" className="text-sm">
                    Acepto los{" "}
                    <Link href="/terms" className="font-medium text-primary hover:underline">
                      términos de servicio
                    </Link>{" "}
                    y la{" "}
                    <Link href="/privacy" className="font-medium text-primary hover:underline">
                      política de privacidad
                    </Link>
                  </Label>
                </div>

                <div>
                  <Button type="submit" className="w-full">
                    Crear cuenta
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
                Almacenamiento inteligente para tus documentos
              </h2>
              <p className="text-lg text-muted-foreground">
                Index0 utiliza inteligencia artificial para clasificar y extraer información de tus documentos,
                permitiéndote encontrar exactamente lo que buscas en segundos. Organiza tus archivos con una estructura
                de carpetas intuitiva y accede a ellos desde cualquier dispositivo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
