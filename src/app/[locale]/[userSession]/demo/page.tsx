"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileCard } from "@/components/file-card";
import { FolderCard } from "@/components/folder-card";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DemoFileViewer } from "@/components/demo-file-viewer";

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Datos de demostración
  const demoFiles = [
    {
      id: "doc1",
      name: "Informe financiero Q1.pdf",
      type: "pdf",
      size: "2.4 MB",
      updatedAt: "Hace 2 días",
      tags: ["Finanzas", "Informe", "2023"],
      aiProcessed: true,
      content: {
        summary:
          "Este informe detalla los resultados financieros del primer trimestre de 2023. Incluye análisis de ventas, gastos operativos y proyecciones para el resto del año. Los ingresos aumentaron un 15% respecto al mismo período del año anterior.",
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
        ],
      },
    },
    {
      id: "doc2",
      name: "Contrato de servicio.docx",
      type: "word",
      size: "1.8 MB",
      updatedAt: "Hace 1 semana",
      tags: ["Legal", "Contrato", "Cliente"],
      aiProcessed: true,
      content: {
        summary:
          "Contrato de prestación de servicios de consultoría entre Acme Inc. y XYZ Corp. El acuerdo establece los términos para servicios de desarrollo de software por un período de 12 meses con opción de renovación.",
        entities: [
          { type: "Organización", value: "Acme Inc. (proveedor)" },
          { type: "Organización", value: "XYZ Corp. (cliente)" },
          { type: "Fecha", value: "01/01/2023 - 31/12/2023" },
          { type: "Cantidad", value: "$50,000 valor total" },
        ],
        keywords: [
          "contrato",
          "servicios",
          "consultoría",
          "software",
          "términos",
        ],
      },
    },
    {
      id: "doc3",
      name: "Plan estratégico 2023.pptx",
      type: "ppt",
      size: "4.2 MB",
      updatedAt: "Hace 3 días",
      tags: ["Estrategia", "Presentación", "2023"],
      aiProcessed: true,
      content: {
        summary:
          "Presentación del plan estratégico para 2023. Incluye análisis de mercado, objetivos comerciales, estrategias de marketing y proyecciones financieras. Se enfoca en la expansión a nuevos mercados y el lanzamiento de dos nuevos productos.",
        entities: [
          { type: "Proyecto", value: "Expansión Internacional" },
          { type: "Proyecto", value: "Lanzamiento Producto Alpha" },
          { type: "Fecha", value: "2023" },
          { type: "Mercado", value: "Europa y Asia" },
        ],
        keywords: [
          "estrategia",
          "expansión",
          "productos",
          "mercados",
          "objetivos",
        ],
      },
    },
    {
      id: "doc4",
      name: "Análisis de competencia.xlsx",
      type: "excel",
      size: "1.5 MB",
      updatedAt: "Hace 5 días",
      tags: ["Análisis", "Competencia", "Mercado"],
      aiProcessed: true,
      content: {
        summary:
          "Análisis detallado de los principales competidores en el mercado. Incluye comparativas de precios, características de productos, cuota de mercado y estrategias de marketing. Identifica oportunidades y amenazas para la empresa.",
        entities: [
          { type: "Competidor", value: "CompetidorA Inc." },
          { type: "Competidor", value: "CompetidorB Ltd." },
          { type: "Competidor", value: "CompetidorC GmbH" },
          { type: "Mercado", value: "Software empresarial" },
        ],
        keywords: [
          "competencia",
          "análisis",
          "mercado",
          "precios",
          "productos",
        ],
      },
    },
    {
      id: "doc5",
      name: "Manual de usuario v2.pdf",
      type: "pdf",
      size: "3.7 MB",
      updatedAt: "Hace 2 semanas",
      tags: ["Documentación", "Manual", "Producto"],
      aiProcessed: true,
      content: {
        summary:
          "Manual de usuario para el software ProductX versión 2.0. Incluye instrucciones detalladas de instalación, configuración y uso de todas las funcionalidades. También contiene soluciones a problemas comunes y preguntas frecuentes.",
        entities: [
          { type: "Producto", value: "ProductX v2.0" },
          { type: "Característica", value: "Módulo de Reportes" },
          { type: "Característica", value: "Panel de Control" },
          { type: "Sistema", value: "Windows/Mac/Linux" },
        ],
        keywords: [
          "manual",
          "usuario",
          "software",
          "instrucciones",
          "configuración",
        ],
      },
    },
  ];

  const demoFolders = [
    { name: "Finanzas", itemCount: 12 },
    { name: "Contratos", itemCount: 8 },
    { name: "Marketing", itemCount: 15 },
    { name: "Recursos Humanos", itemCount: 7 },
  ];

  // Filtrar archivos basados en la búsqueda
  const filteredFiles = searchQuery
    ? demoFiles.filter(
        (file) =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.content.summary
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          file.content.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          file.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : demoFiles;

  // Renderizar el contenido basado en la pestaña activa
  const renderContent = () => {
    if (selectedFile) {
      const file = demoFiles.find((f) => f.id === selectedFile);
      if (!file) return null;

      return (
        <DemoFileViewer file={file} onBack={() => setSelectedFile(null)} />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Modo demostración
              </h3>
              <p className="text-sm text-muted-foreground">
                Esta es una demostración interactiva de Index0. Explora las
                diferentes secciones para ver todas las capacidades del sistema.
                Puedes hacer clic en los archivos para ver el análisis de IA y
                usar la búsqueda para encontrar contenido específico.
              </p>
            </div>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Documentos recientes</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Los documentos son procesados automáticamente por IA
                        para extraer información clave
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {demoFiles.slice(0, 4).map((file) => (
                  <div
                    key={file.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedFile(file.id)}
                  >
                    <FileCard
                      name={file.name}
                      type={file.type}
                      size={file.size}
                      updatedAt={file.updatedAt}
                      viewMode="grid"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Carpetas</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Organiza tus documentos en una estructura de carpetas
                        similar a iOS
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {demoFolders.map((folder, index) => (
                  <FolderCard
                    key={index}
                    name={folder.name}
                    itemCount={folder.itemCount}
                    viewMode="grid"
                  />
                ))}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Documentos indexados por IA
                </h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="cursor-help">
                        IA
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Estos documentos han sido procesados por IA para extraer
                        información clave
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                {demoFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors cursor-pointer"
                    onClick={() => setSelectedFile(file.id)}
                  >
                    <div className="flex-1">
                      <FileCard
                        name={file.name}
                        type={file.type}
                        size={file.size}
                        updatedAt={file.updatedAt}
                        viewMode="list"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {file.aiProcessed && (
                        <Badge variant="outline" className="bg-primary/10">
                          Procesado por IA
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case "search":
        return (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Búsqueda avanzada
              </h3>
              <p className="text-sm text-muted-foreground">
                Prueba la búsqueda inteligente que encuentra contenido dentro de
                tus documentos, no solo por nombre de archivo. Intenta buscar
                términos como &quot;finanzas&quot;, &quot;estrategia&quot;,
                &quot;contrato&quot; o cualquier palabra clave.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full max-w-2xl mx-auto mb-8">
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

            {searchQuery ? (
              <>
                <h3 className="text-sm text-muted-foreground mb-4">
                  Mostrando {filteredFiles.length} resultados para &quot;
                  {searchQuery}&quot;
                </h3>

                {filteredFiles.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedFile(file.id)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <FileCard
                              name={file.name}
                              type={file.type}
                              size={file.size}
                              updatedAt={file.updatedAt}
                              viewMode="list"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap gap-2 mb-2">
                              {file.tags.map((tag, i) => (
                                <Badge key={i} variant="secondary">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm mb-2 line-clamp-2">
                              {file.content.summary}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Palabras clave: {file.content.keywords.join(", ")}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">
                      No se encontraron resultados para &quot;{searchQuery}
                      &quot;
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Intenta con otros términos de búsqueda
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Ingresa un término de búsqueda para comenzar
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Puedes buscar por nombre, contenido, etiquetas o palabras
                  clave
                </p>
              </div>
            )}
          </div>
        );

      case "ai":
        return (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Info className="h-5 w-5 mr-2 text-primary" />
                Capacidades de IA
              </h3>
              <p className="text-sm text-muted-foreground">
                Index0 utiliza IA para procesar automáticamente tus documentos.
                Selecciona cualquier documento para ver el análisis detallado
                que incluye resúmenes, extracción de entidades y palabras clave.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Extracción de información
                </h3>
                <div className="space-y-4">
                  <div className="bg-accent/50 p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">
                      Resúmenes automáticos
                    </p>
                    <p className="text-sm text-muted-foreground">
                      La IA genera resúmenes concisos de documentos largos,
                      capturando los puntos clave.
                    </p>
                  </div>
                  <div className="bg-accent/50 p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">
                      Identificación de entidades
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Extracción automática de nombres, organizaciones, fechas,
                      cantidades y otros datos relevantes.
                    </p>
                  </div>
                  <div className="bg-accent/50 p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Palabras clave</p>
                    <p className="text-sm text-muted-foreground">
                      Identificación de términos importantes para facilitar la
                      búsqueda y categorización.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Ejemplos de documentos procesados
                </h3>
                <div className="space-y-3">
                  {demoFiles.slice(0, 3).map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-md transition-colors cursor-pointer"
                      onClick={() => setSelectedFile(file.id)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {file.content.summary.substring(0, 60)}...
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-primary/10">
                        Ver análisis
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Beneficios del procesamiento con IA
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Búsqueda semántica</h4>
                  <p className="text-sm text-muted-foreground">
                    Encuentra documentos basados en significado, no solo
                    coincidencia exacta de palabras.
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Organización automática</h4>
                  <p className="text-sm text-muted-foreground">
                    Sugerencias inteligentes para clasificar y etiquetar
                    documentos.
                  </p>
                </div>
                <div className="p-4 border rounded-md">
                  <h4 className="font-medium mb-2">Ahorro de tiempo</h4>
                  <p className="text-sm text-muted-foreground">
                    Reduce el tiempo dedicado a buscar información en documentos
                    extensos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto py-6 px-4">
        <Tabs
          defaultValue="dashboard"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">Panel principal</TabsTrigger>
            <TabsTrigger value="search">Búsqueda avanzada</TabsTrigger>
            <TabsTrigger value="ai">Capacidades de IA</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {renderContent()}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
