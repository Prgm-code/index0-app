import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  Download,
  Share2,
  Star,
  Trash2,
  FileText,
  Tag,
  MessageSquare,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function FilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [isStarred, setIsStarred] = useState(false);
  const { id } = await params;

  // Mock file data
  const file = {
    id: id,
    name: "Informe trimestral Q1 2023.pdf",
    type: "pdf",
    size: "2.4 MB",
    createdAt: "15 de marzo, 2023",
    updatedAt: "20 de marzo, 2023",
    tags: ["Finanzas", "Informe", "2023"],
    extractedContent: {
      summary:
        "Este informe detalla los resultados financieros del primer trimestre de 2023. Incluye análisis de ventas, gastos operativos, márgenes de beneficio y proyecciones para el resto del año. Los ingresos aumentaron un 15% respecto al mismo período del año anterior, mientras que los gastos operativos se mantuvieron estables.",
      entities: [
        { type: "Organización", value: "Acme Inc." },
        { type: "Fecha", value: "Q1 2023" },
        { type: "Cantidad", value: "$1.2M en ingresos" },
        { type: "Porcentaje", value: "15% de crecimiento" },
      ],
      keywords: [
        "finanzas",
        "trimestral",
        "ingresos",
        "gastos",
        "proyecciones",
        "crecimiento",
      ],
    },
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b bg-background p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-semibold truncate">{file.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsStarred(!isStarred)}
            >
              <Star
                className={cn(
                  "h-5 w-5",
                  isStarred ? "text-yellow-400 fill-yellow-400" : ""
                )}
              />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4 grid md:grid-cols-3 gap-6">
          {/* Document preview */}
          <div className="md:col-span-2 flex flex-col">
            <div className="bg-white border rounded-lg shadow-sm p-4 mb-6">
              <div className="aspect-[3/4] bg-gray-50 rounded-md flex items-center justify-center">
                <div className="text-center p-8">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-red-500" />
                  <h3 className="text-lg font-medium mb-2">{file.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {file.size}
                  </p>
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
                  <p className="text-sm leading-relaxed">
                    {file.extractedContent.summary}
                  </p>
                </TabsContent>
                <TabsContent value="entities" className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {file.extractedContent.entities.map((entity, index) => (
                      <div key={index} className="bg-accent/50 p-3 rounded-md">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          {entity.type}
                        </p>
                        <p className="font-medium">{entity.value}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="keywords" className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {file.extractedContent.keywords.map((keyword, index) => (
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
                  <p className="font-medium">Documento PDF</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tamaño</p>
                  <p className="font-medium">{file.size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creado</p>
                  <p className="font-medium">{file.createdAt}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modificado</p>
                  <p className="font-medium">{file.updatedAt}</p>
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

            {/* Related files */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">
                Archivos relacionados
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      Informe trimestral Q4 2022.pdf
                    </p>
                    <p className="text-xs text-muted-foreground">1.8 MB</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors">
                  <FileText className="h-5 w-5 text-red-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      Proyecciones 2023.pdf
                    </p>
                    <p className="text-xs text-muted-foreground">3.2 MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div className="bg-white border rounded-lg shadow-sm p-4">
              <h2 className="text-lg font-semibold mb-4">Actividad reciente</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Descargado</p>
                    <p className="text-xs text-muted-foreground">Hace 2 días</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Comentado</p>
                    <p className="text-xs text-muted-foreground">Hace 3 días</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Share2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Compartido</p>
                    <p className="text-xs text-muted-foreground">Hace 5 días</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
