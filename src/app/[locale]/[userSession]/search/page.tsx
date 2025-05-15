"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileCard } from "@/components/file-card"
import { Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")

  // Mock search results
  const searchResults = [
    {
      name: "Informe trimestral.pdf",
      type: "pdf",
      size: "2.4 MB",
      updatedAt: "Hace 2 días",
      relevance: "Alto",
      matchContext: "...los resultados del <mark>trimestre</mark> muestran un incremento del 15% en...",
    },
    {
      name: "Presentación cliente.pptx",
      type: "ppt",
      size: "4.1 MB",
      updatedAt: "Hace 1 semana",
      relevance: "Medio",
      matchContext: "...propuesta para el <mark>cliente</mark> incluye análisis de...",
    },
    {
      name: "Contrato servicio.docx",
      type: "word",
      size: "1.2 MB",
      updatedAt: "Hace 3 días",
      relevance: "Alto",
      matchContext: "...términos del <mark>contrato</mark> especifican que el servicio...",
    },
    {
      name: "Análisis mercado.pdf",
      type: "pdf",
      size: "3.7 MB",
      updatedAt: "Hace 5 días",
      relevance: "Medio",
      matchContext: "...el <mark>análisis</mark> de tendencias indica que el sector...",
    },
    {
      name: "Presupuesto 2023.xlsx",
      type: "excel",
      size: "1.8 MB",
      updatedAt: "Hace 1 mes",
      relevance: "Bajo",
      matchContext: "...el <mark>presupuesto</mark> asignado para marketing es de...",
    },
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <h1 className="text-2xl font-bold">Búsqueda avanzada</h1>
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filtros de búsqueda</SheetTitle>
                  <SheetDescription>Refina tus resultados con estos filtros</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Tipo de archivo</h3>
                    <div className="space-y-2">
                      {["PDF", "Word", "Excel", "PowerPoint", "Imagen", "Texto"].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox id={`type-${type}`} />
                          <Label htmlFor={`type-${type}`}>{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Fecha de modificación</h3>
                    <div className="space-y-2">
                      {["Hoy", "Esta semana", "Este mes", "Este año", "Personalizado"].map((date) => (
                        <div key={date} className="flex items-center space-x-2">
                          <Checkbox id={`date-${date}`} />
                          <Label htmlFor={`date-${date}`}>{date}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Etiquetas</h3>
                    <div className="space-y-2">
                      {["Trabajo", "Personal", "Importante", "Finanzas", "Contratos"].map((tag) => (
                        <div key={tag} className="flex items-center space-x-2">
                          <Checkbox id={`tag-${tag}`} />
                          <Label htmlFor={`tag-${tag}`}>{tag}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between mt-6">
                    <Button variant="outline">Limpiar filtros</Button>
                    <Button>Aplicar filtros</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <Select defaultValue="relevance">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="date">Fecha (reciente)</SelectItem>
                <SelectItem value="name">Nombre (A-Z)</SelectItem>
                <SelectItem value="size">Tamaño</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full max-w-2xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar en documentos, contenido y etiquetas..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>Buscar</Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="content">Contenido</TabsTrigger>
            <TabsTrigger value="filename">Nombre de archivo</TabsTrigger>
            <TabsTrigger value="tags">Etiquetas</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-6">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {searchResults.length} resultados para "{searchQuery || "todos los documentos"}"
              </p>
            </div>

            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <FileCard
                      name={result.name}
                      type={result.type}
                      size={result.size}
                      updatedAt={result.updatedAt}
                      viewMode={viewMode}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            result.relevance === "Alto"
                              ? "bg-green-100 text-green-800"
                              : result.relevance === "Medio"
                                ? "bg-yellow-100 text-yellow-800"
                                : result.relevance === "Medio"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {result.relevance} relevancia
                        </span>
                      </div>
                      <div className="text-sm mb-3">
                        <p dangerouslySetInnerHTML={{ __html: result.matchContext }} />
                      </div>
                      <div className="text-xs text-muted-foreground">Última modificación: {result.updatedAt}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="content" className="mt-6">
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-muted-foreground">Busca en el contenido de tus documentos</p>
                <p className="text-sm text-muted-foreground mt-1">
                  La búsqueda por contenido utiliza IA para encontrar información dentro de tus documentos
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="filename" className="mt-6">
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-muted-foreground">Busca por nombre de archivo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Encuentra documentos por su nombre exacto o parcial
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="tags" className="mt-6">
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-muted-foreground">Busca por etiquetas</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Encuentra documentos clasificados con etiquetas específicas
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
