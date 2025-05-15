"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileIcon } from "./FileIcon";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
// import { useQueryReportInfo } from "@/hooks/useQueryReportInfo";

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

export interface ReadOnlyFileBrowserFolderProps {
  reportId: string;
}

export function ReadOnlyFileBrowserFolder({
  reportId,
}: ReadOnlyFileBrowserFolderProps) {
  const [currentPath, setCurrentPath] = useState(`${reportId}/`);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch(
        `/api/files/list?prefix=${encodeURIComponent(prefix)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load files");
      }

      // Obtener el nombre de la carpeta actual sin el reportId
      const currentFolder = prefix.replace(`${reportId}/`, "").split("/")[0];

      // Filtrar y transformar los elementos para ocultar el reportId y la carpeta actual
      const filteredItems = [...data.folders, ...data.files]
        .filter((item: Item) => item.key.startsWith(`${reportId}/`))
        .map((item: Item) => ({
          ...item,
          displayName: item.key
            .replace(`${reportId}/`, "")
            .replace(`${currentFolder}/`, ""),
          key: item.key,
        }));

      setItems(filteredItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (reportId && reportId.trim() !== "" && reportId !== "0") {
      loadFiles(currentPath);
    }
  }, [currentPath, reportId]);

  // Validar que reportId sea válido
  if (!reportId || reportId.trim() === "" || reportId === "0") {
    return (
      <Card className="rounded-lg">
        <div className="p-4 rounded-md mb-4 bg-destructive/10 text-destructive">
          <p>Se requiere un ID de reporte válido</p>
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

  const handleFileSelect = (file: FileItem) => {
    if (file.key) {
      const fileUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${file.key}`;
      window.open(fileUrl, "_blank");
    }
  };

  const handleFolderClick = (folder: FolderItem) => {
    setCurrentPath(folder.key);
  };

  const handleFileClick = async (file: FileItem) => {
    const url = await getPresignedUrl(file.key);
    if (url) {
      window.open(url, "_blank");
    }
    handleFileSelect(file);
  };

  const goBack = () => {
    // No permitir retroceder más allá de la carpeta base del reporte
    if (currentPath === `${reportId}/`) {
      return;
    }
    const parts = currentPath.split("/");
    parts.pop(); // Remove last part
    parts.pop(); // Remove empty part after last slash
    const newPath = parts.join("/") + "/";
    setCurrentPath(newPath.length < reportId.length ? `${reportId}/` : newPath);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Función auxiliar para limpiar la ruta de visualización
  const getDisplayPath = (path: string) => {
    if (path === `${reportId}/`) return "";
    const cleanPath = path.replace(`${reportId}/`, "");
    // Si la ruta tiene más de un nivel, mostrar solo el último nivel
    const parts = cleanPath.split("/").filter(Boolean);
    return parts[parts.length - 1] || "";
  };

  // Función auxiliar para obtener el nombre del archivo/carpeta
  const getDisplayName = (path: string) => {
    if (path === `${reportId}/`) return "Inicio";
    const cleanPath = path.replace(`${reportId}/`, "");
    const parts = cleanPath.split("/").filter(Boolean);
    return parts[parts.length - 1] || cleanPath;
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
        <div className="p-4 rounded-md mb-4 bg-destructive/10 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="p-4 border-b">
        <div className="flex items-center mb-4">
          <Button
            onClick={goBack}
            disabled={currentPath === `${reportId}/`}
            className={`mr-2 p-1 rounded cursor-pointer ${
              currentPath === `${reportId}/`
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Button>
          <span>{getDisplayPath(currentPath) || "Inicio"}</span>
        </div>
      </div>

      {/* File List */}
      <div className="divide-y divide-gray-200">
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
              className="flex items-center p-4 cursor-pointer group hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              {/* Icon */}
              {item.type === "folder" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-muted-foreground"
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
                  className="h-6 w-6 text-muted-foreground"
                />
              )}

              {/* File/Folder Info */}
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {item.displayName || getDisplayName(item.key)}
                </p>
                {item.type === "file" && (
                  <p className="text-xs text-muted-foreground">
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
