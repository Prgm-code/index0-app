import { Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDistanceToNow } from "date-fns";
import { Input } from "@/components/ui/input";
import { FileIcon } from "./FileIcon";
import { FileItem, FolderItem } from "@/app/[locale]/[userSession]/page";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";

interface FileListProps {
  items: (FileItem | FolderItem)[];
  viewMode: "grid" | "list";
  basePath?: string;
  onFolderClick: (folder: FolderItem) => void;
  onDelete: (item: FileItem | FolderItem, e: React.MouseEvent) => void;
  isDeletingItem: string | null;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

export function FileList({
  items,
  viewMode,
  basePath = "file",
  onFolderClick,
  onDelete,
  isDeletingItem,
  searchTerm,
  onSearchTermChange,
}: FileListProps) {
  const t = useTranslations("dashboard");
  const params = useParams() as { locale: string; userSession: string };

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {searchTerm ? t("searchResults") : t("filesAndFolders")}
        </h2>
        <div className="flex items-center gap-2 max-w-xs">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("filterFiles")}
            className="h-9"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
      </div>

      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            : "space-y-2"
        }
      >
        {items.map((item) =>
          item.type === "folder" ? (
            <div
              key={item.key}
              onClick={() => onFolderClick(item as FolderItem)}
              className={`relative cursor-pointer group ${
                viewMode === "grid"
                  ? "flex flex-col items-center p-4 border rounded-lg hover:shadow-md"
                  : "flex items-center p-4 border rounded-lg hover:shadow-md"
              }`}
            >
              {/* Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={viewMode === "grid" ? "h-12 w-12 mb-2" : "h-6 w-6"}
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
              {/* Info */}
              <div
                className={
                  viewMode === "grid" ? "text-center w-full" : "ml-3 flex-1"
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
                    return fullName.replace(/\/$/, "");
                  })()}
                </p>
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => onDelete(item, e)}
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
          ) : (
            <Link
              href={`/${
                params.userSession
              }/${basePath}?key=${encodeURIComponent(item.key)}`}
              key={item.key}
              className={`relative block group ${
                viewMode === "grid"
                  ? "flex flex-col items-center p-4 border rounded-lg hover:shadow-md"
                  : "flex items-center p-4 border rounded-lg hover:shadow-md"
              }`}
            >
              {/* Icon */}
              <FileIcon
                filename={item.key}
                className={viewMode === "grid" ? "h-12 w-12 mb-2" : "h-6 w-6"}
              />
              {/* Info */}
              <div
                className={
                  viewMode === "grid" ? "text-center w-full" : "ml-3 flex-1"
                }
              >
                <p
                  className={`text-sm font-medium truncate ${
                    viewMode === "grid" ? "text-center" : ""
                  } text-blue-500 hover:underline`}
                >
                  {item.key.split("/").filter(Boolean).pop() || ""}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatFileSize((item as FileItem).size)} •{" "}
                  {formatDistanceToNow(
                    new Date((item as FileItem).lastModified),
                    {
                      addSuffix: true,
                    }
                  )}
                  {item.vectorMetadata?.score !== undefined && (
                    <>
                      {" • "}
                      <span className="text-xs text-blue-500">
                        Match Score:{" "}
                        {(item.vectorMetadata.score * 100).toFixed(1)}%
                      </span>
                    </>
                  )}
                </p>
              </div>
              {/* Delete button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(item, e);
                }}
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
            </Link>
          )
        )}
      </div>
    </section>
  );
}
