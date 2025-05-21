"use client";
import { SmartSearch } from "@/components/SmartSearch/SmartSearch";
import { Card } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { FilePreviewModal } from "@/components/SmartSearch/FilePreviewModal";
import { Trash2 } from "lucide-react";
import {
  FileItem,
  FolderItem,
  VectorSearchResponse,
} from "@/interfaces/SmartSearch";
import { formatFileSize, getContentType } from "@/utils/smartSearchUtils";
import { getFileIcon } from "@/components/SmartSearch/FileIcons";
import { useState } from "react";

type Item = FileItem | FolderItem;

// Componente CustomFileItem
const CustomFileItem = ({
  file,
  onFileClick,
}: {
  file: FileItem;
  onFileClick: (e: React.MouseEvent, file: FileItem) => void;
}) => {
  const fileUrl =
    file.url ||
    (file.key.startsWith("http")
      ? file.key
      : `/api/files/${encodeURIComponent(file.key)}`);
  const filename = file.key.split("/").pop() || "";
  const extension = filename.split(".").pop()?.toLowerCase() || "";
  const contentType = getContentType(extension);

  return (
    <FilePreviewModal
      fileKey={file.key}
      filename={filename}
      contentType={contentType}
      open={false}
      onOpenChange={() => {}}
      trigger={
        <button
          onClick={(e) => onFileClick(e, file)}
          className="w-full text-left flex items-center text-blue-500 hover:text-blue-700 transition-colors"
        >
          {getFileIcon(extension)}
          <span className="truncate ml-2">{filename}</span>
        </button>
      }
    />
  );
};

// Componente CustomSearchResponse
const CustomSearchResponse = ({
  data,
  t,
}: {
  data: VectorSearchResponse | null;
  t: any;
}) => {
  if (!data?.response) return null;

  const formatDocumentLink = (content: string): React.ReactNode => {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      if (linkMatch.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.slice(lastIndex, linkMatch.index)}
          </span>
        );
      }

      const fileName = linkMatch[1].split("/").pop() || linkMatch[1];
      const documentPath = linkMatch[2];

      const extension = fileName.split(".").pop()?.toLowerCase() || "";
      const contentType = getContentType(extension);

      parts.push(
        <FilePreviewModal
          key={`modal-${linkMatch.index}`}
          fileKey={documentPath}
          filename={fileName}
          contentType={contentType}
          trigger={
            <button className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-primary cursor-pointer">
              {getFileIcon(extension)}
              <span className="break-all">{fileName}</span>
            </button>
          }
        />
      );

      lastIndex = linkMatch.index + linkMatch[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>
      );
    }

    return <>{parts}</>;
  };

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold mb-4">{t("searchResults")}</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <div className="prose dark:prose-invert max-w-none">
          {data.response.split("\n").map((paragraph, index) => (
            <p key={index} className="mb-4 whitespace-pre-line">
              {formatDocumentLink(paragraph)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
};

// Componente FileTable
const FileTable = ({
  items,
  t,
  isDeletingItem,
  onFileClick,
  onFolderClick,
  onDelete,
}: {
  items: Item[];
  t: any;
  isDeletingItem: string | null;
  onFileClick: (e: React.MouseEvent, file: FileItem) => void;
  onFolderClick: (folder: FolderItem) => void;
  onDelete: (item: Item, e: React.MouseEvent) => void;
}) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="w-full flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t("filesAndFolders")}</h2>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                >
                  {t("name")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white hidden sm:table-cell"
                >
                  {t("size")}
                </th>
                <th
                  scope="col"
                  className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white hidden md:table-cell"
                >
                  {t("score")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {items.map((item) => (
                <tr
                  key={item.key}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {item.type === "folder" ? (
                      <div
                        className="flex items-center cursor-pointer"
                        onClick={() => onFolderClick(item as FolderItem)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-yellow-500"
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
                        <span className="truncate">
                          {(() => {
                            const fullName =
                              item.key.split("/").filter(Boolean).pop() || "";
                            return fullName.replace(/\/$/, "");
                          })()}
                        </span>
                      </div>
                    ) : (
                      <CustomFileItem
                        file={item as FileItem}
                        onFileClick={onFileClick}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell">
                    {item.type === "file" &&
                      formatFileSize((item as FileItem).size || 0)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                    {item.vectorMetadata?.score !== undefined && (
                      <span className="text-blue-500">
                        {(item.vectorMetadata.score * 100).toFixed(1)}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Componente principal SmartSearchPage
export function SmartSearchPage() {
  const t = useTranslations("dashboard");
  const params = useParams() as { locale: string; userSession: string };
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [typedData, setTypedData] = useState<VectorSearchResponse | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFolderClick = (folder: FolderItem) => {
    console.log("Folder clicked:", folder);
  };

  const handleDelete = async (item: Item, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Delete requested for:", item);
  };

  const handleFileClick = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  return (
    <Card className="w-full flex">
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b bg-background p-4">
          <h1 className="text-xl font-semibold">{t("smartSearch")}</h1>
        </header>

        <main className="flex-1 overflow-auto p-4">
          {error && (
            <div className="p-4 bg-red-100 text-red-600 rounded-md mb-4">
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6 w-full">
            <SmartSearch
              onSearchResults={setTypedData}
              onError={setError}
              onSetItems={setItems}
              currentItems={items}
            />
          </div>

          <FileTable
            items={items}
            t={t}
            isDeletingItem={isDeletingItem}
            onFileClick={handleFileClick}
            onFolderClick={handleFolderClick}
            onDelete={handleDelete}
          />

          <CustomSearchResponse data={typedData} t={t} />

          {selectedFile && (
            <FilePreviewModal
              fileKey={selectedFile.key}
              filename={selectedFile.key.split("/").pop() || ""}
              contentType={getContentType(
                selectedFile.key.split(".").pop()?.toLowerCase() || ""
              )}
              open={previewOpen}
              onOpenChange={(open) => {
                if (!open) setPreviewOpen(false);
              }}
              trigger={<div />}
            />
          )}
        </main>
      </div>
    </Card>
  );
}
