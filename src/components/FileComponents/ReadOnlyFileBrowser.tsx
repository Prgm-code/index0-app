"use client";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileIcon } from "./FileIcon";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

export interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  type: "file";
  url?: string;
  displayName?: string;
}

export interface FolderItem {
  key: string;
  type: "folder";
  displayName?: string;
}

type Item = FileItem | FolderItem;

interface ReadOnlyFileBrowserProps {
  onFileSelect?: (file: FileItem) => void;
  reportId: string;
}

export function ReadOnlyFileBrowser({
  onFileSelect,
  reportId,
}: ReadOnlyFileBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extraer los parámetros de la URL de manera más precisa
  const pathParts = pathname.split("/");
  const appIndex = pathParts.indexOf("app");
  const sessionId =
    appIndex !== -1 && appIndex + 1 < pathParts.length
      ? pathParts[appIndex + 1]
      : null;
  const reportsIndex = pathParts.indexOf("reports");
  const clientFilesIndex = pathParts.indexOf("client-files");

  // Construir las rutas solo si tenemos los componentes necesarios
  const basePath =
    sessionId && reportId
      ? `/app/${sessionId}/reports/${reportId}/client-files`
      : "";
  const currentPath =
    clientFilesIndex !== -1
      ? pathParts
          .slice(clientFilesIndex + 1)
          .filter(Boolean)
          .join("/")
      : "";
  const fullPath = reportId ? `${reportId}/${currentPath}/` : "";

  const loadFiles = async (prefix: string) => {
    if (!prefix) return;

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

          // Normalizar la key del item y remover el reportId del inicio
          const normalizedKey = item.key.replace(/\/+/g, "/");
          const relativeKey = normalizedKey.replace(`${reportId}/`, "");

          if (!currentPath) {
            // Si estamos en la raíz, mostrar solo los items de primer nivel
            const parts = relativeKey.split("/").filter(Boolean);
            return (
              parts.length === 1 ||
              (item.type === "folder" && parts.length === 1)
            );
          } else {
            // Para subcarpetas, mostrar solo los items del nivel actual
            const expectedPrefix = currentPath + "/";
            if (!relativeKey.startsWith(expectedPrefix)) {
              return false;
            }
            const remainingPath = relativeKey.slice(expectedPrefix.length);
            const parts = remainingPath.split("/").filter(Boolean);
            return (
              parts.length === 1 ||
              (item.type === "folder" && parts.length === 1)
            );
          }
        })
        .map((item: Item) => ({
          ...item,
          key: item.key.replace(/\/+/g, "/"),
          displayName: item.key.split("/").filter(Boolean).pop() || "",
        }));

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (fullPath && typeof fullPath === "string") {
      loadFiles(fullPath);
    }
  }, [fullPath, reportId]);

  // Validar que tenemos todos los componentes necesarios de la ruta
  if (appIndex === -1 || appIndex + 1 >= pathParts.length) {
    return (
      <Card className="rounded-lg">
        <div className="p-4 rounded-md mb-4 bg-destructive/10 text-destructive">
          <p>Ruta inválida: falta el identificador de sesión</p>
        </div>
      </Card>
    );
  }

  // Validar la estructura completa de la ruta
  if (
    reportsIndex === -1 ||
    clientFilesIndex === -1 ||
    !sessionId ||
    !reportId
  ) {
    return (
      <Card className="rounded-lg">
        <div className="p-4 rounded-md mb-4 bg-destructive/10 text-destructive">
          <p>Ruta inválida: estructura de URL incorrecta</p>
        </div>
      </Card>
    );
  }

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

  const handleFolderClick = (folder: FolderItem) => {
    // Obtener el nombre de la carpeta sin la ruta completa
    const folderName = folder.key.split("/").filter(Boolean).pop() || "";

    // Construir la nueva ruta manteniendo la estructura completa
    const newPath = currentPath ? `${currentPath}/${folderName}` : folderName;

    // Navegar usando la ruta completa, manteniendo client-files en la URL
    router.push(`${basePath}/${newPath}`);
  };

  const goBack = () => {
    if (!currentPath) return;

    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.join("/");

    // Navegar usando la ruta completa, manteniendo client-files en la URL
    router.push(`${basePath}${parentPath ? `/${parentPath}` : ""}`);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleFileClick = async (file: FileItem) => {
    const url = await getPresignedUrl(file.key);
    if (url) {
      window.open(url, "_blank");
    }
    onFileSelect?.(file);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="rounded-lg">
      {error && (
        <div className="p-4 rounded-md mb-4 bg-destructive/10 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-2">
          {currentPath && (
            <Button
              onClick={goBack}
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
              .map((part, index, array) => (
                <div key={index} className="flex items-center space-x-2">
                  <span>/</span>
                  <span
                    className="cursor-pointer hover:underline"
                    onClick={() => {
                      const path = array.slice(0, index + 1).join("/");
                      router.push(`${basePath}/${path}`);
                    }}
                  >
                    {part}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="divide-y divide-border">
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"
              />
            </svg>
            <p>Esta carpeta está vacía</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.key}
              onClick={() =>
                item.type === "folder"
                  ? handleFolderClick(item as FolderItem)
                  : handleFileClick(item as FileItem)
              }
              className="flex items-center p-4 cursor-pointer group hover:bg-accent/50 transition-colors"
            >
              {/* Icon */}
              {item.type === "folder" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-muted-foreground shrink-0"
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
                <FileIcon
                  filename={item.key}
                  className="h-6 w-6 text-muted-foreground shrink-0"
                />
              )}

              {/* File/Folder Info */}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {item.displayName}
                </p>
                {item.type === "file" && (
                  <p className="text-xs text-muted-foreground truncate">
                    {formatFileSize(item.size)} •{" "}
                    {formatDistanceToNow(new Date(item.lastModified), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>

              {/* Folder navigation arrow */}
              {item.type === "folder" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-muted-foreground"
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
          ))
        )}
      </div>
    </Card>
  );
}
