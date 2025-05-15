"use client"

import { Folder, MoreVertical, Trash2, Share2, Pencil } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface FolderCardProps {
  name: string
  itemCount: number
  viewMode: "grid" | "list"
}

export function FolderCard({ name, itemCount, viewMode }: FolderCardProps) {
  const folderUrl = `/dashboard/folder/${name.toLowerCase()}`

  if (viewMode === "grid") {
    return (
      <Link href={folderUrl}>
        <div className="group relative bg-background border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Renombrar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-2 bg-gray-50 rounded-lg">
              <Folder className="h-8 w-8 text-blue-500" />
            </div>
            <div className="w-full">
              <p className="font-medium text-sm truncate" title={name}>
                {name}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{itemCount} elementos</p>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={folderUrl}>
      <div className="group flex items-center justify-between p-3 hover:bg-accent rounded-md transition-colors">
        <div className="flex items-center space-x-3">
          <Folder className="h-6 w-6 text-blue-500" />
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{itemCount} elementos</p>
          </div>
        </div>
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.preventDefault()}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => e.preventDefault()}>
                <Pencil className="mr-2 h-4 w-4" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={(e) => e.preventDefault()}>
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Link>
  )
}
