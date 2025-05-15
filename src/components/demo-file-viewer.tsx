"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronLeft, Download, FileText, Tag } from "lucide-react"

interface FileContent {
  summary: string
  entities: { type: string; value: string }[]
  keywords: string[]
}

interface DemoFile {
  id: string
  name: string
  type: string
  size: string
  updatedAt: string
  tags: string[]
  aiProcessed: boolean
  content: FileContent
}

interface DemoFileViewerProps {
  file: DemoFile
  onBack: () => void
}

export function DemoFileViewer({ file, onBack }: DemoFileViewerProps) {
  const getFileIcon = () => {
    switch (file.type) {
      case "pdf":
        return <FileText className="h-16 w-16 text-red-500" />
      case "word":
      case "docx":
        return <FileText className="h-16 w-16 text-blue-600" />
      case "excel":
      case "xlsx":
        return <FileText className="h-16 w-16 text-green-500" />
      case "ppt":
      case "pptx":
        return <FileText className="h-16 w-16 text-orange-500" />
      default:
        return <FileText className="h-16 w-16 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <h2 className="text-xl font-semibold">{file.name}</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Document preview */}
        <div className="md:col-span-2 flex flex-col">
          <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
            <div className="aspect-[3/4] bg-gray-50 rounded-md flex items-center justify-center">
              <div className="text-center p-8">
                {getFileIcon()}
                <h3 className="text-lg font-medium mb-2">{file.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{file.size}</p>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-white border rounded-lg shadow-sm">
            <Tabs defaultValue="summary">
              <div className="px-4 pt-4">
                <h2 className="text-lg font-semibold mb-4">Análisis de IA</h2>
                <TabsList className="w-full">
                  <TabsTrigger value="summary">Resumen</TabsTrigger>
                  <TabsTrigger value="entities">Entidades</TabsTrigger>
                  <TabsTrigger value="keywords">Palabras clave</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="summary" className="p-4">
                <p className="text-sm leading-relaxed">{file.content.summary}</p>
              </TabsContent>
              <TabsContent value="entities" className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {file.content.entities.map((entity, index) => (
                    <div key={index} className="bg-accent/50 p-3 rounded-md">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{entity.type}</p>
                      <p className="font-medium">{entity.value}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="keywords" className="p-4">
                <div className="flex flex-wrap gap-2">
                  {file.content.keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* File info */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Información</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Tipo</p>
                <p className="font-medium">Documento {file.type.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamaño</p>
                <p className="font-medium">{file.size}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última modificación</p>
                <p className="font-medium">{file.updatedAt}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-primary/10">
                    Procesado por IA
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Etiquetas</h2>
              <Button variant="ghost" size="sm">
                <Tag className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {file.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Demo explanation */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Demostración de análisis</h3>
            <p className="text-sm text-muted-foreground">
              Este es un ejemplo de cómo Index0 procesa y analiza automáticamente tus documentos con IA. Cada documento
              subido es analizado para extraer información clave, facilitando la búsqueda y organización.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
