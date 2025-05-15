import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileUploader } from "./FileUploader";
import { FileIcon } from "./FileIcon";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

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

interface FileBrowserProps {
  onFileSelect?: (file: FileItem) => void;
  reportId: string;
}

export function FileBrowser({ onFileSelect, reportId }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadFiles = async (prefix: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/files/list?prefix=${encodeURIComponent(
          prefix
        )}&reportId=${reportId}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load files");
      }

      setItems([...data.folders, ...data.files]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath]);

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
    setCurrentPath(folder.key);
  };

  const handleFileClick = async (file: FileItem) => {
    const url = await getPresignedUrl(file.key);
    if (url) {
      window.open(url, "_blank");
    }
    onFileSelect?.(file);
  };

  const goBack = () => {
    const parts = currentPath.split("/");
    parts.pop(); // Remover la última parte
    parts.pop(); // Remover la parte vacía después del último slash
    setCurrentPath(parts.join("/") + (parts.length > 0 ? "/" : ""));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleUploadComplete = () => {
    loadFiles(currentPath);
  };

  const handleUploadError = (error: string) => {
    setError(error);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError("Folder name is required");
      return;
    }

    try {
      setError(null);
      const folderPath = currentPath
        ? `${currentPath}${newFolderName}`
        : newFolderName;

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
      setIsCreatingFolder(false);
      loadFiles(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create folder");
    }
  };

  const handleDelete = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar ${item.key.split("/").pop()}?`
      )
    ) {
      return;
    }

    try {
      setIsDeletingItem(item.key);
      setError(null);

      // Usar la key del item directamente, ya que ya incluye el reportId
      const endpoint =
        item.type === "folder"
          ? `/api/folders/delete?prefix=${encodeURIComponent(item.key)}`
          : `/api/files/delete?key=${encodeURIComponent(item.key)}`;

      console.log("Attempting to delete:", {
        type: item.type,
        key: item.key,
        endpoint,
      });

      const response = await fetch(endpoint, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error ||
            `Error al eliminar ${
              item.type === "folder" ? "la carpeta" : "el archivo"
            }`
        );
      }

      // Recargar la lista después de eliminar
      loadFiles(currentPath);
    } catch (err) {
      console.error("Delete error:", err);
      setError(
        err instanceof Error
          ? err.message
          : `Error al eliminar ${
              item.type === "folder" ? "la carpeta" : "el archivo"
            }`
      );
    } finally {
      setIsDeletingItem(null);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setError(null);

      // Construir el path del archivo
      const filePath = currentPath ? `${currentPath}${file.name}` : file.name;

      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", filePath);
      formData.append("reportId", reportId);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      // Recargar la lista de archivos después de una carga exitosa
      loadFiles(currentPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Limpiar el input para permitir subir el mismo archivo nuevamente
      event.target.value = "";
    }
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

      {/* Breadcrumb, Create Folder y Uploader */}
      <div className="p-4 border-b space-y-4">
        {/* Navigation and Actions Bar */}
        <div className="flex flex-col gap-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              disabled={!currentPath}
              className="mr-2"
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
            <span className="text-muted-foreground text-sm">
              {currentPath || "Inicio"}
            </span>
          </div>

          {/* Actions Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Create Folder Button */}
            <Button
              variant="outline"
              onClick={() => setIsCreatingFolder(true)}
              className="w-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              Nueva Carpeta
            </Button>

            {/* File Uploader Button */}
            <div className="w-full h-[40px]">
              <label
                className={`
                w-full h-full flex items-center justify-center px-4 py-2 
                border-2 border-input bg-background hover:bg-accent 
                hover:text-accent-foreground rounded-md cursor-pointer 
                transition-colors
                ${isUploading ? "opacity-50 cursor-not-allowed" : ""}
              `}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                )}
                {isUploading ? "Subiendo..." : "Subir Archivo"}
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Create Folder Dialog */}
        {isCreatingFolder && (
          <div className="mb-4 p-4 border rounded-md bg-muted">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre de la carpeta"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    createFolder();
                  }
                }}
              />
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={createFolder} className="flex-1 sm:flex-none">
                  Crear
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreatingFolder(false);
                    setNewFolderName("");
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
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
                  {item.key.split("/").pop() || item.key}
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

              {/* Actions */}
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {/* Delete button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDelete(item, e)}
                  className={
                    isDeletingItem === item.key
                      ? "opacity-50"
                      : "opacity-0 group-hover:opacity-100"
                  }
                  disabled={isDeletingItem === item.key}
                >
                  {isDeletingItem === item.key ? (
                    <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-destructive"
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
                </Button>

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
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
