"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  FolderPlus,
  Grid,
  List,
  ChevronRight,
  Home,
  Clock,
  Star,
  Tag,
  Share2,
  Trash2,
} from "lucide-react";
import { FileCard } from "@/components/file-card";
import { FolderCard } from "@/components/folder-card";
import { FileUploadButton } from "@/components/file-upload-button";
import { Card } from "@/components/ui/card";
import { FileBrowser } from "@/components/FileComponents/FileBrowser";

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <Card className="w-full  flex ">
      {/* Main content */}

      <FileBrowser reportId={"1"} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar documentos..."
                className="h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid
                  className={`h-4 w-4 ${
                    viewMode === "grid"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List
                  className={`h-4 w-4 ${
                    viewMode === "list"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                />
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
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Mis documentos
            </Link>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-4">
          {/* Recently added section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Agregados recientemente
            </h2>
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
              {[
                "Trabajo",
                "Personal",
                "Proyectos",
                "Documentos",
                "Facturas",
              ].map((name, i) => (
                <FolderCard
                  key={i}
                  name={name}
                  itemCount={Math.floor(Math.random() * 20) + 1}
                  viewMode={viewMode}
                />
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
    </Card>
  );
}
