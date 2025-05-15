"use client";
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileUploader } from "./FileUploader";
import { FileIcon } from "./FileIcon";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { FolderPlus, Plus, X } from "lucide-react";
import { Label } from "../ui/label";
// import { useQueryReportInfo } from "@/hooks/useQueryReportInfo";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

export interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  type: "file";
  url?: string;
}

export interface FolderItem {
  key: string;
  type: "folder";
}

type Item = FileItem | FolderItem;

export interface FileBrowserProps {
  reportId: string;
}

export function FileBrowser({ reportId }: FileBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Extraer los parámetros de la URL
  const pathParts = pathname.split("/");
  const adminIndex = pathParts.indexOf("admin");
  const reportsIndex = pathParts.indexOf("files");
  const adminPath = pathParts.slice(adminIndex, reportsIndex).join("/");
  console.log("adminPath", reportsIndex);
  // Obtener la ruta actual después de /files de manera más precisa
  const filesIndex = pathname.indexOf("/files");
  const currentPath =
    filesIndex !== -1
      ? pathname
          .slice(filesIndex + 6)
          .split("/")
          .filter(Boolean)
          .filter((part, index, array) => {
            // Eliminar duplicados consecutivos
            return part !== array[index - 1];
          })
          .join("/")
      : "";

  // Construir la ruta completa para S3 asegurándose de que tenga el formato correcto
  const fullPath = currentPath ? `${reportId}/${currentPath}/` : `${reportId}/`;

  const basePath = `/${adminPath}/files`;

  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // const {
  //   data: company,
  //   isLoading: isLoadingCompany,
  //   isError: isErrorCompany,
  //   isSuccess: successCompany,
  // } = useQueryReportInfo(reportId);

  const loadFiles = async (prefix: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Asegurarse de que el prefix esté correctamente formateado
      const normalizedPrefix = prefix.replace(/\/+/g, "/");

      const response = await fetch(
        `/api/files/list?prefix=${encodeURIComponent(normalizedPrefix)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load files");
      }

      // Filtrar los elementos para mostrar solo los que pertenecen al directorio actual
      const filteredItems = [...data.folders, ...data.files]
        .filter((item: Item) => {
          // Asegurarse que el item pertenece al reportId actual
          if (!item.key.startsWith(`${reportId}/`)) {
            return false;
          }

          // Normalizar la key del item
          const normalizedKey = item.key.replace(/\/+/g, "/");

          // Si estamos en la raíz, mostrar solo los items de primer nivel
          if (normalizedPrefix === `${reportId}/`) {
            const relativePath = normalizedKey.replace(`${reportId}/`, "");
            return (
              !relativePath.includes("/") ||
              (item.type === "folder" && relativePath.split("/").length === 2)
            );
          }

          // Para subcarpetas, mostrar solo los items del nivel actual
          const relativeToCurrentPath = normalizedKey.replace(
            normalizedPrefix,
            ""
          );
          return (
            !relativeToCurrentPath.includes("/") ||
            (item.type === "folder" &&
              relativeToCurrentPath.split("/").length === 2)
          );
        })
        .map((item: Item) => ({
          ...item,
          key: item.key.replace(/\/+/g, "/"),
        }));

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(fullPath);
  }, [fullPath]);

  const getPresignedUrl = async (key: string) => {
    try {
      const response = await fetch(
        `/api/files/presigned?key=${encodeURIComponent(key)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate URL");
      }

      return data.url;
    } catch (err) {
      console.error("Error getting presigned URL:", err);
      setError(err instanceof Error ? err.message : "Failed to generate URL");
      return null;
    }
  };
  const handleFileSelect = (file: FileItem) => {
    // Aquí puedes manejar la selección de archivos
    // Por ejemplo, abrir una vista previa o iniciar una descarga
    console.log("Selected file:", file);

    // Si el archivo tiene una URL pública, puedes abrirla en una nueva pestaña
    if (file.key) {
      const fileUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${file.key}`;
      window.open(fileUrl, "_blank");
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    // Obtener el nombre de la carpeta sin la ruta completa
    const folderName = folder.key.split("/").filter(Boolean).pop() || "";

    // Construir la nueva ruta
    let newPath;
    if (currentPath) {
      // Si ya estamos en una subcarpeta, añadir el nuevo nombre a la ruta actual
      newPath = `${currentPath}/${folderName}`;
    } else {
      // Si estamos en la raíz, comenzar con el nuevo nombre
      newPath = folderName;
    }

    // Asegurarse de que la ruta esté correctamente formateada
    newPath = newPath.replace(/^\/+|\/+$/g, ""); // Eliminar slashes al inicio y final
    router.push(`${basePath}/${newPath}`);
  };

  const handleFileClick = async (file: FileItem) => {
    const url = await getPresignedUrl(file.key);
    if (url) {
      window.open(url, "_blank");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleUploadComplete = () => {
    loadFiles(fullPath);
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Folder name is required");
      return;
    }

    try {
      setError(null);

      // Construir el path de la carpeta
      let folderPath;
      if (!currentPath) {
        // Si estamos en la raíz
        folderPath = `${newFolderName}/`;
      } else {
        // Si estamos en una subcarpeta, usar la ruta actual
        folderPath = `${currentPath}/${newFolderName}/`;
      }

      // Remover el reportId del path si está presente
      folderPath = folderPath.replace(`${reportId}/`, "");

      const response = await fetch("/api/folders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: folderPath,
          reportId: reportId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create folder");
      }

      setNewFolderName("");
      setIsPopoverOpen(false);
      loadFiles(fullPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  // Función para navegar a la carpeta anterior
  const navigateToParent = () => {
    if (!currentPath) return; // Si estamos en la raíz, no hacer nada

    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop(); // Remover el último elemento
    const parentPath = pathParts.join("/");

    router.push(`${basePath}${parentPath ? `/${parentPath}` : ""}`);
  };

  const handleDelete = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar la navegación al hacer clic en el botón de eliminar

    const displayName = (() => {
      if (item.key === `${reportId}/`) {
        return "Inicio";
      }
      const relativePath = item.key.replace(currentPath, "");
      const parts = relativePath.split("/").filter(Boolean);
      return parts.length > 0
        ? parts[0]
        : item.key.split("/").filter(Boolean).pop() || "";
    })();

    if (!confirm(`¿Estás seguro de que deseas eliminar ${displayName}?`)) {
      return;
    }

    try {
      setIsDeletingItem(item.key);
      setError(null);

      const endpoint =
        item.type === "folder"
          ? `/api/folders/delete?prefix=${encodeURIComponent(item.key)}`
          : `/api/files/delete?key=${encodeURIComponent(item.key)}`;

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to delete ${item.type}`);
      }

      // Recargar la lista después de eliminar
      loadFiles(fullPath);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : `Failed to delete ${item.type}`
      );
    } finally {
      setIsDeletingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <Card className="rounded-lg shadow">
      {error && (
        <div className="p-4 bg-red-100 text-red-600 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Breadcrumb, Create Folder y Uploader */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {currentPath && (
              <Button
                onClick={navigateToParent}
                variant="outline"
                size="sm"
                className="mr-2"
              >
                ← Atrás
              </Button>
            )}
            <div className="flex items-center space-x-2">
              <span
                onClick={() => router.push(basePath)}
                className="cursor-pointer hover:underline"
              >
                Inicio
              </span>
              {currentPath
                .split("/")
                .filter(Boolean)
                .filter((part, index, array) => {
                  // Eliminar duplicados consecutivos en el breadcrumb
                  return part !== array[index - 1];
                })
                .map((part, index, array) => (
                  <div key={index} className="flex items-center space-x-2">
                    <span>/</span>
                    <span
                      className="cursor-pointer hover:underline"
                      onClick={() => {
                        // Construir la ruta sin duplicados
                        const path = array
                          .slice(0, index + 1)
                          .filter((p, i, arr) => p !== arr[i - 1])
                          .join("/");
                        router.push(`${basePath}/${path}`);
                      }}
                    >
                      {part}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button className="px-4 py-2 rounded-md">
                <FolderPlus className="h-4 w-4 mr-2" />
                Nueva carpeta
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateFolder();
                }}
              >
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Nueva carpeta</h4>
                    <p className="text-sm text-muted-foreground">
                      Ingresa el nombre para la nueva carpeta
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="folderName" className="col-span-4 hidden">
                        Nombre
                      </Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        placeholder="Nombre de la carpeta"
                        className="col-span-4"
                        onChange={(e) => setNewFolderName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setNewFolderName("");
                          setIsPopoverOpen(false);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">Crear</Button>
                    </div>
                  </div>
                </div>
              </form>
            </PopoverContent>
          </Popover>
        </div>

        {/* File Uploader */}
        <FileUploader
          folder={fullPath}
          onUploadComplete={handleUploadComplete}
          onError={handleUploadError}
        />
      </div>

      {/* File List */}
      <div className="divide-y divide-gray-200">
        {items.length === 0 ? (
          <div className="p-4 text-center">Carpeta vacía</div>
        ) : (
          items.map((item) => (
            <div
              key={item.key}
              onClick={() =>
                item.type === "folder"
                  ? handleFolderClick(item as FolderItem)
                  : handleFileClick(item as FileItem)
              }
              className="flex items-center p-4 cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              {/* Icon */}
              {item.type === "folder" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
              ) : (
                <FileIcon filename={item.key} className="h-6 w-6" />
              )}

              {/* File/Folder Info */}
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {(() => {
                    // Obtener solo el nombre del archivo/carpeta sin la ruta completa
                    const fullName =
                      item.key.split("/").filter(Boolean).pop() || "";

                    // Para carpetas, eliminar el slash final si existe
                    return item.type === "folder"
                      ? fullName.replace(/\/$/, "")
                      : fullName;
                  })()}
                </p>
                {item.type === "file" && (
                  <p className="text-xs">
                    {formatFileSize(item.size)} •{" "}
                    {formatDistanceToNow(new Date(item.lastModified), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(item, e)}
                  className={`p-2 rounded-full ${
                    isDeletingItem === item.key
                      ? "opacity-50 cursor-not-allowed"
                      : "opacity-0 group-hover:opacity-100"
                  }`}
                  disabled={isDeletingItem === item.key}
                >
                  {isDeletingItem === item.key ? (
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                {/* Folder navigation arrow */}
                {item.type === "folder" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
