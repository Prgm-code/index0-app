"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, FolderPlus, Grid, List, ChevronRight, Home, Clock, Star, Tag, Share2, Trash2 } from "lucide-react"
import { FileCard } from "@/components/file-card"
import { FolderCard } from "@/components/folder-card"
import { FileUploadButton } from "@/components/file-upload-button"

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col border-r bg-background">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Index0</h1>
        </div>
        <div className="flex-1 overflow-auto p-3">
          <nav className="space-y-1">
            <Link
              href="/dashboard"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-primary/10 text-primary"
            >
              <Home className="mr-3 h-4 w-4" />
              Mis documentos
            </Link>
            <Link
              href="/dashboard/recent"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Clock className="mr-3 h-4 w-4" />
              Recientes
            </Link>
            <Link
              href="/dashboard/starred"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Star className="mr-3 h-4 w-4" />
              Favoritos
            </Link>
            <Link
              href="/dashboard/shared"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Share2 className="mr-3 h-4 w-4" />
              Compartidos
            </Link>
            <Link
              href="/dashboard/tags"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Tag className="mr-3 h-4 w-4" />
              Etiquetas
            </Link>
            <Link
              href="/dashboard/trash"
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <Trash2 className="mr-3 h-4 w-4" />
              Papelera
            </Link>
          </nav>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mis carpetas</h3>
            <div className="mt-2 space-y-1">
              <Link
                href="/dashboard/folder/work"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="mr-3 h-4 w-4" />
                Trabajo
              </Link>
              <Link
                href="/dashboard/folder/personal"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="mr-3 h-4 w-4" />
                Personal
              </Link>
              <Link
                href="/dashboard/folder/projects"
                className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <ChevronRight className="mr-3 h-4 w-4" />
                Proyectos
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar documentos..." className="h-9" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setViewMode("grid")}>
                <Grid className={`h-4 w-4 ${viewMode === "grid" ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setViewMode("list")}>
                <List className={`h-4 w-4 ${viewMode === "list" ? "text-primary" : "text-muted-foreground"}`} />
              </Button>
              <FileUploadButton />
              <Button variant="outline" size="sm">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nueva carpeta
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center px-4 py-2 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Mis documentos
            </Link>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-4">
          {/* Recently added section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Agregados recientemente</h2>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
              }
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <FileCard
                  key={i}
                  name={`Documento ${i}.pdf`}
                  type="pdf"
                  size="2.4 MB"
                  updatedAt="Hace 2 horas"
                  viewMode={viewMode}
                />
              ))}
            </div>
          </section>

          {/* Folders section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Carpetas</h2>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
              }
            >
              {["Trabajo", "Personal", "Proyectos", "Documentos", "Facturas"].map((name, i) => (
                <FolderCard key={i} name={name} itemCount={Math.floor(Math.random() * 20) + 1} viewMode={viewMode} />
              ))}
            </div>
          </section>

          {/* All files section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Todos los archivos</h2>
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                  : "space-y-2"
              }
            >
              {[
                { name: "Informe trimestral.pdf", type: "pdf" },
                { name: "Presentación cliente.pptx", type: "ppt" },
                { name: "Presupuesto 2023.xlsx", type: "excel" },
                { name: "Contrato.docx", type: "word" },
                { name: "Notas reunión.txt", type: "text" },
                { name: "Diagrama.png", type: "image" },
                { name: "Manual usuario.pdf", type: "pdf" },
                { name: "Calendario.xlsx", type: "excel" },
                { name: "Propuesta.docx", type: "word" },
                { name: "Factura-001.pdf", type: "pdf" },
              ].map((file, i) => (
                <FileCard
                  key={i}
                  name={file.name}
                  type={file.type}
                  size={`${(Math.random() * 10).toFixed(1)} MB`}
                  updatedAt={`Hace ${Math.floor(Math.random() * 30) + 1} días`}
                  viewMode={viewMode}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
