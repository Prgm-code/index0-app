"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import FileViewerClient from "../FileViewerClient";
import { useQueryUrlFile } from "@/hooks/useQueryFile";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Helper to format bytes
function formatBytes(bytes: number, t: any): string {
  if (bytes === 0) return `0 ${t("sizeUnits.bytes")}`;
  const k = 1024;
  const dm = 2; // decimals
  const sizes = ["bytes", "kb", "mb", "gb", "tb"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) +
    " " +
    t(`sizeUnits.${sizes[i]}`)
  );
}

// Helper to get file type from extension
function getFileTypeFromExtension(filename: string, t: any): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return t(`fileTypes.${ext}`) || t("fileTypes.unknown");
}

interface FileItem {
  id: string;
  key: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  userId: string;
  contentType?: string;
  url?: string;
  lastModified?: string;
}

interface SearchFilesClientProps {
  fileList: FileItem[];
}

export default function SearchFilesClient({
  fileList,
}: SearchFilesClientProps) {
  const t = useTranslations("fileViewer");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const pathname = usePathname();

  const { data: fileUrl, isLoading: isFileUrlLoading } = useQueryUrlFile(
    selectedFile?.key || null
  );

  // Filter files as user types, but don't affect selection
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFiles([]);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const results = fileList
      .filter(
        (file) =>
          file.name.toLowerCase().includes(lowerSearchTerm) ||
          file.key.toLowerCase().includes(lowerSearchTerm)
      )
      .slice(0, itemsPerPage);

    setFilteredFiles(results);
  }, [searchTerm, fileList, itemsPerPage]);

  // Separate handler for file selection
  const handleFileSelect = (key: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    const fileToSelect = fileList.find((f) => f.key === key);
    if (fileToSelect) {
      setSelectedFile(fileToSelect);
    }
  };

  // Memoize the file viewer component to prevent unnecessary re-renders
  const fileViewer = React.useMemo(() => {
    if (!selectedFile) return null;

    return (
      <div className="max-w-5xl mx-auto py-4 px-3 sm:px-4 space-y-4">
        <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
          <div className="flex items-center justify-between p-4 border-b bg-muted/10">
            <h1
              className="text-lg font-medium truncate max-w-[70%]"
              title={selectedFile?.name}
            >
              {selectedFile?.name}
            </h1>
            <Link
              href={fileUrl?.url || ""}
              download
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-download"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {t("table.download")}
            </Link>
          </div>

          <div className="p-4">
            <div className="min-h-[200px] flex items-center justify-center border rounded">
              <div className="p-4">
                <FileViewerClient
                  fileUrl={fileUrl?.url || ""}
                  filename={selectedFile?.name || ""}
                  contentType={
                    selectedFile?.contentType || "application/octet-stream"
                  }
                />
              </div>
            </div>
          </div>

          <div className="border-t p-4 bg-muted/10">
            <h2 className="font-medium mb-2 text-sm">{t("fileInfo.title")}</h2>
            <ul className="text-sm space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <li>
                <span className="font-medium">{t("fileInfo.size")}:</span>{" "}
                {formatBytes(selectedFile.size, t)}
              </li>
              <li>
                <span className="font-medium">
                  {t("fileInfo.lastModified")}:
                </span>{" "}
                {formatDistanceToNow(
                  new Date(
                    selectedFile.lastModified || selectedFile.uploadedAt
                  ),
                  {
                    addSuffix: true,
                    locale: es,
                  }
                )}
              </li>
              {selectedFile.contentType && (
                <li>
                  <span className="font-medium">
                    {t("fileInfo.contentType")}:
                  </span>{" "}
                  <span className="truncate" title={selectedFile.contentType}>
                    {selectedFile.contentType}
                  </span>
                </li>
              )}
              <li>
                <span className="font-medium">{t("fileInfo.fileType")}:</span>{" "}
                {getFileTypeFromExtension(selectedFile.name, t)}
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }, [selectedFile, fileUrl, t]);

  return (
    <div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="flex-1">
          <Label htmlFor="search" className="text-sm font-medium mb-2">
            {t("search.label")}
          </Label>
          <Input
            type="text"
            id="search"
            className="w-full"
            placeholder={t("search.placeholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => setItemsPerPage(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("resultsPerPage")} />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 25].map((value) => (
                <SelectItem key={value} value={value.toString()}>
                  {t("items", { count: value })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {searchTerm.trim() !== "" && (
        <>
          {filteredFiles.length > 0 ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="py-2 px-3 text-left text-sm font-medium">
                      {t("table.name")}
                    </th>
                    <th className="py-2 px-3 text-left text-sm font-medium">
                      {t("table.size")}
                    </th>
                    <th className="py-2 px-3 text-left text-sm font-medium">
                      {t("table.uploaded")}
                    </th>
                    <th className="py-2 px-3 text-left text-sm font-medium">
                      {t("table.actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="border-t hover:bg-muted/20">
                      <td className="py-2 px-3 text-sm truncate max-w-[200px]">
                        {file.name}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {formatBytes(file.size, t)}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        {formatDistanceToNow(new Date(file.uploadedAt), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </td>
                      <td className="py-2 px-3 text-sm">
                        <button
                          className="text-primary hover:underline font-medium"
                          onClick={(e) => handleFileSelect(file.key, e)}
                        >
                          {t("table.view")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              {t("noResults")}
            </div>
          )}

          {fileViewer}
        </>
      )}
    </div>
  );
}
