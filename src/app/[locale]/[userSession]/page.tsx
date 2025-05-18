"use client";
import { useState, useEffect, useCallback } from "react";
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
  Plus,
  X,
} from "lucide-react";
import { FileCard } from "@/components/file-card";
import { FolderCard } from "@/components/folder-card";
import { FileUploadButton } from "@/components/file-upload-button";
import { Card } from "@/components/ui/card";
import { FileBrowser } from "@/components/FileComponents/FileBrowserFolder";
import { useAuth } from "@clerk/nextjs";
import { FileIcon } from "@/components/FileComponents/FileIcon";
import { FileUploader } from "@/components/FileComponents/FileUploader";
import { formatDistanceToNow } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslations } from "next-intl";
import { createFolder, deleteFolder } from "@/actions/FolderActions";
import { deleteFile } from "@/actions/FileActions";
import { toast } from "@pheralb/toast";

// Define interfaces needed for file management
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

export default function Dashboard() {
  const t = useTranslations("dashboard");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { userId } = useAuth();

  // FileBrowser state
  const [currentPath, setCurrentPath] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Load files from API
  const loadFiles = async (prefix: string) => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      // Format the prefix correctly
      const normalizedPrefix = prefix.replace(/\/+/g, "/");

      const response = await fetch(
        `/api/files/list?prefix=${encodeURIComponent(normalizedPrefix)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("failedToLoadFiles"));
      }

      // Filter items for the current directory
      const filteredItems = [...data.folders, ...data.files]
        .filter((item: Item) => {
          // Ensure item belongs to current user
          if (!item.key.startsWith(`${userId}/`)) {
            return false;
          }

          // Normalize the key
          const normalizedKey = item.key.replace(/\/+/g, "/");

          // For root directory, show only first level items
          if (normalizedPrefix === `${userId}/`) {
            const relativePath = normalizedKey.replace(`${userId}/`, "");
            return (
              !relativePath.includes("/") ||
              (item.type === "folder" && relativePath.split("/").length === 2)
            );
          }

          // For subdirectories, show only current level items
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
      setError(err instanceof Error ? err.message : t("failedToLoadFiles"));
    } finally {
      setIsLoading(false);
    }
  };

  // Load files on component mount and when path changes
  useEffect(() => {
    if (userId) {
      const fullPath = currentPath ? `${userId}/${currentPath}/` : `${userId}/`;
      loadFiles(fullPath);
    }
  }, [currentPath, userId]);

  // Get presigned URL for file download
  const getPresignedUrl = async (key: string) => {
    try {
      const response = await fetch(
        `/api/files/presigned?key=${encodeURIComponent(key)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("failedToGenerateUrl"));
      }

      return data.url;
    } catch (err) {
      console.error("Error getting presigned URL:", err);
      setError(err instanceof Error ? err.message : t("failedToGenerateUrl"));
      return null;
    }
  };

  // Handle folder click
  const handleFolderClick = (folder: FolderItem) => {
    const folderName = folder.key.split("/").filter(Boolean).pop() || "";

    // Build the new path
    let newPath;
    if (currentPath) {
      newPath = `${currentPath}/${folderName}`;
    } else {
      newPath = folderName;
    }

    // Format path correctly
    newPath = newPath.replace(/^\/+|\/+$/g, "");
    setCurrentPath(newPath);
  };

  // Handle file click
  const handleFileClick = async (file: FileItem) => {
    const url = await getPresignedUrl(file.key);
    if (url) {
      window.open(url, "_blank");
    }
  };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Handle upload completion
  const handleUploadComplete = () => {
    const fullPath = currentPath ? `${userId}/${currentPath}/` : `${userId}/`;
    loadFiles(fullPath);
  };

  // Handle upload errors
  const handleUploadError = (error: string) => {
    setError(error);
  };

  // Create a new folder
  const handleCreateFolder = async () => {
    if (newFolderName.trim() === "") {
      setError(t("folderNameRequired"));
      return;
    }

    // console.log(userId);
    try {
      setError(null);

      // Build folder path
      let folderPath;
      if (!currentPath) {
        folderPath = `${newFolderName.trim()}/`;
      } else {
        folderPath = `${currentPath}/${newFolderName.trim()}/`;
      }

      // Remove userId if present
      folderPath = folderPath.replace(`${userId}/`, "");
      // console.log(folderPath);
      toast.loading({
        text: t("creatingFolder"),
        options: {
          promise: createFolder({
            path: folderPath,
            clerkId: userId as string,
          }),
          success: t("folderCreated"),
          error: t("failedToCreateFolder"),
          autoDismiss: true,
          onError(error) {
            setError(
              error instanceof Error ? error.message : t("failedToCreateFolder")
            );
          },
          onSuccess(data) {
            if ((data as { success: boolean }).success) {
              const fullPath = currentPath
                ? `${userId}/${currentPath}/`
                : `${userId}/`;
              loadFiles(fullPath);
              setNewFolderName("");
              setIsPopoverOpen(false);
            } else {
              setError((data as { message: string }).message);
              throw new Error(t("failedToCreateFolder", { type: "folder" }));
            }
          },
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToCreateFolder"));
    }
  };

  // Navigate to parent folder
  const navigateToParent = () => {
    if (!currentPath) return;

    const pathParts = currentPath.split("/").filter(Boolean);
    pathParts.pop();
    const parentPath = pathParts.join("/");

    setCurrentPath(parentPath);
  };

  // Delete a file or folder
  const handleDelete = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();

    const displayName = (() => {
      if (item.key === `${userId}/`) {
        return t("home");
      }
      const relativePath = item.key.replace(currentPath, "");
      const parts = relativePath.split("/").filter(Boolean);
      return parts.length > 0
        ? parts[0]
        : item.key.split("/").filter(Boolean).pop() || "";
    })();

    if (!confirm(t("confirmDelete", { name: displayName }))) {
      return;
    }

    try {
      setIsDeletingItem(item.key);
      setError(null);

      const endpoint =
        item.type === "folder"
          ? `/api/folders/delete?prefix=${encodeURIComponent(item.key)}`
          : `/api/files/delete?key=${encodeURIComponent(item.key)}`;

      toast.loading({
        text: t("deletingItem"),
        options: {
          promise:
            item.type === "folder"
              ? deleteFolder({
                  prefix: item.key,
                  clerkId: userId as string,
                })
              : deleteFile({
                  key: item.key,
                  clerkId: userId as string,
                }),
          success: t("itemDeleted"),
          error: t("failedToDelete", { type: item.type }),
          autoDismiss: true,
          onSuccess(data) {
            if ((data as { success: boolean }).success) {
              const fullPath = currentPath
                ? `${userId}/${currentPath}/`
                : `${userId}/`;
              loadFiles(fullPath);
            } else {
              setError((data as { message: string }).message);
              throw new Error(t("failedToDelete", { type: item.type }));
            }
          },
          onError(error) {
            setError(
              error instanceof Error
                ? error.message
                : t("failedToDelete", { type: item.type })
            );
          },
        },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("failedToDelete", { type: item.type })
      );
    } finally {
      setIsDeletingItem(null);
    }
  };

  // Filter items by search term
  const filteredItems = items.filter((item) => {
    const itemName = item.key.split("/").pop() || "";
    return itemName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // A custom handler to refresh files after upload from the FileUploadButton
  const handleFileUploaded = () => {
    const fullPath = currentPath ? `${userId}/${currentPath}/` : `${userId}/`;
    loadFiles(fullPath);
  };

  return (
    <Card className="w-full flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 w-full max-w-md">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                className="h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              <FileUploadButton
                onUploadComplete={handleFileUploaded}
                userId={userId}
                currentPath={currentPath}
              />
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderPlus className="h-4 w-4 mr-2" />
                    {t("newFolder")}
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
                        <h4 className="font-medium leading-none">
                          {t("newFolderTitle")}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {t("newFolderDescription")}
                        </p>
                      </div>
                      <div className="grid gap-2">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label
                            htmlFor="folderName"
                            className="col-span-4 hidden"
                          >
                            Name
                          </Label>
                          <Input
                            id="folderName"
                            value={newFolderName}
                            placeholder={t("folderNamePlaceholder")}
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
                            {t("cancel")}
                          </Button>
                          <Button type="submit">{t("create")}</Button>
                        </div>
                      </div>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center px-4 py-2 text-sm">
            <div className="flex items-center space-x-2">
              <span
                onClick={() => setCurrentPath("")}
                className="cursor-pointer hover:underline text-muted-foreground hover:text-foreground"
              >
                {t("myDocuments")}
              </span>
              {currentPath
                .split("/")
                .filter(Boolean)
                .map((part, index, array) => (
                  <div key={index} className="flex items-center space-x-2">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span
                      className="cursor-pointer hover:underline text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        const path = array.slice(0, index + 1).join("/");
                        setCurrentPath(path);
                      }}
                    >
                      {part}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-4">
          {error && (
            <div className="p-4 bg-red-100 text-red-600 rounded-md mb-4">
              <p>{error}</p>
            </div>
          )}

          {/* Files and folders section */}
          <section>
            <h2 className="text-lg font-semibold mb-4">
              {t("filesAndFolders")}
            </h2>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-4 text-center">{t("noFilesFound")}</div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    : "space-y-2"
                }
              >
                {filteredItems.map((item) => (
                  <div
                    key={item.key}
                    onClick={() =>
                      item.type === "folder"
                        ? handleFolderClick(item as FolderItem)
                        : handleFileClick(item as FileItem)
                    }
                    className={`relative cursor-pointer group ${
                      viewMode === "grid"
                        ? "flex flex-col items-center p-4 border rounded-lg hover:shadow-md"
                        : "flex items-center p-4 border rounded-lg hover:shadow-md"
                    }`}
                  >
                    {/* Icon */}
                    {item.type === "folder" ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={
                          viewMode === "grid" ? "h-12 w-12 mb-2" : "h-6 w-6"
                        }
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
                        className={
                          viewMode === "grid" ? "h-12 w-12 mb-2" : "h-6 w-6"
                        }
                      />
                    )}

                    {/* Info */}
                    <div
                      className={
                        viewMode === "grid"
                          ? "text-center w-full"
                          : "ml-3 flex-1"
                      }
                    >
                      <p
                        className={`text-sm font-medium truncate ${
                          viewMode === "grid" ? "text-center" : ""
                        }`}
                      >
                        {(() => {
                          const fullName =
                            item.key.split("/").filter(Boolean).pop() || "";
                          return item.type === "folder"
                            ? fullName.replace(/\/$/, "")
                            : fullName;
                        })()}
                      </p>
                      {item.type === "file" && (
                        <p className="text-xs text-muted-foreground truncate">
                          {formatFileSize((item as FileItem).size)} •{" "}
                          {formatDistanceToNow(
                            new Date((item as FileItem).lastModified),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(item, e)}
                      className={`p-2 rounded-full absolute top-1 right-1 ${
                        isDeletingItem === item.key
                          ? "opacity-50 cursor-not-allowed"
                          : "opacity-0 group-hover:opacity-100"
                      }`}
                      disabled={isDeletingItem === item.key}
                    >
                      {isDeletingItem === item.key ? (
                        <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </Card>
  );
}
