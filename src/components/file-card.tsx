"use client"

import { useState } from "react"
import {
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Pencil,
  Star,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileCardProps {
  name: string
  type: string
  size: string
  updatedAt: string
  viewMode: "grid" | "list"
}

export function FileCard({ name, type, size, updatedAt, viewMode }: FileCardProps) {
  const [isStarred, setIsStarred] = useState(false)

  const getFileIcon = () => {
    switch (type) {
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />
      case "image":
      case "png":
      case "jpg":
        return <FileImage className="h-8 w-8 text-blue-500" />
      case "excel":
      case "xlsx":
        return <FileSpreadsheet className="h-8 w-8 text-green-500" />
      case "word":
      case "docx":
        return <FileText className="h-8 w-8 text-blue-600" />
      case "ppt":
      case "pptx":
        return <FileText className="h-8 w-8 text-orange-500" />
      default:
        return <File className="h-8 w-8 text-gray-500" />
    }
  }

  if (viewMode === "grid") {
    return (
      <div className="group relative bg-background border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsStarred(!isStarred)}>
                <Star className={cn("mr-2 h-4 w-4", isStarred ? "text-yellow-400 fill-yellow-400" : "")} />
                {isStarred ? "Quitar de favoritos" : "Añadir a favoritos"}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Descargar
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Pencil className="mr-2 h-4 w-4" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-col items-center text-center">
          <div className="mb-4 p-2 bg-gray-50 rounded-lg">{getFileIcon()}</div>
          <div className="w-full">
            <p className="font-medium text-sm truncate" title={name}>
              {name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {size} • {updatedAt}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors">
      <div className="flex items-center space-x-3">
        {getFileIcon()}
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {size} • {updatedAt}
          </p>
        </div>
      </div>
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsStarred(!isStarred)}>
          <Star className={cn("h-4 w-4", isStarred ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="mr-2 h-4 w-4" />
              Compartir
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
