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
import { deleteFile, listFiles } from "@/actions/FileActions";
import { searchFiles } from "@/actions/SearchActions";
import { toast } from "@pheralb/toast";
import { SmartSearch } from "@/components/FileComponents/SmartSearch";
import { FileList } from "@/components/FileComponents/FileList";
import { SearchResponse } from "@/components/FileComponents/SearchResponse";

// Define interfaces needed for file management
export interface VectorSearchResponse {
  object: string;
  search_query: string;
  response: string;
  data: Array<{
    file_id: string;
    filename: string;
    score: number;
    content: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    attributes: {
      timestamp: number;
      folder: string;
    };
  }>;
  has_more: boolean;
  next_page: string | null;
}

export interface FileItem {
  key: string;
  size: number;
  lastModified: string;
  type: "file";
  url?: string;
  vectorMetadata?: {
    score?: number;
    content?: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    attributes?: {
      timestamp?: number;
      folder?: string;
    };
  };
}

export interface FolderItem {
  key: string;
  type: "folder";
  vectorMetadata?: {
    score?: number;
    content?: Array<{
      id: string;
      type: string;
      text: string;
    }>;
    attributes?: {
      timestamp?: number;
      folder?: string;
    };
  };
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
  const [localFilter, setLocalFilter] = useState("");
  const [typedData, setTypedData] = useState<VectorSearchResponse | null>(null);

  // Load files from API
  const loadFiles = useCallback(
    async (prefix: string) => {
      if (!userId) return;

      try {
        setIsLoading(true);
        setError(null);

        // Format the prefix correctly
        const normalizedPrefix = prefix.replace(/\/+/g, "/");

        const data = await listFiles({
          prefix: normalizedPrefix,
          clerkId: userId as string,
        });
        // console.log(test);
        // const response = await fetch(
        //   `/api/files/list?prefix=${encodeURIComponent(normalizedPrefix)}`
        // );
        // const data = await response.json();
        console.log(data);
        if (!data.success) {
          throw new Error(data.error || t("failedToLoadFiles"));
        }

        // Filter items for the current directory
        const folders = (data.folders || []) as FolderItem[];
        const files = (data.files || []) as FileItem[];
        const filteredItems = [...folders, ...files]
          .filter((item) => {
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
          .map((item) => ({
            ...item,
            key: item.key.replace(/\/+/g, "/"),
          }));
        setItems(filteredItems);
      } catch (err) {
        console.log(err);
        setError(err instanceof Error ? err.message : t("failedToLoadFiles"));
      } finally {
        setIsLoading(false);
      }
    },
    [currentPath, userId, t]
  );

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

      // const endpoint =
      //   item.type === "folder"
      //     ? `/api/folders/delete?prefix=${encodeURIComponent(item.key)}`
      //     : `/api/files/delete?key=${encodeURIComponent(item.key)}`;

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
    return itemName.toLowerCase().includes(localFilter.toLowerCase());
  });

  // console.log(items);

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
            <SmartSearch
              onSearchResults={setTypedData}
              onError={setError}
              onSetItems={setItems}
              currentItems={items}
            />
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

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <FileList
                items={filteredItems}
                viewMode={viewMode}
                onFileClick={handleFileClick}
                onFolderClick={handleFolderClick}
                onDelete={handleDelete}
                isDeletingItem={isDeletingItem}
                searchTerm={localFilter}
                onSearchTermChange={setLocalFilter}
              />

              {typedData && <SearchResponse data={typedData} />}
            </>
          )}
        </main>
      </div>
    </Card>
  );
}
