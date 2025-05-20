import { getFileUrl, getFileMetadata } from "@/actions/FileActions";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import FileViewerClient from "@/components/FileViewerClient";

// Helper to format bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = 2; // decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Helper to get file type from extension
function getFileTypeFromExtension(filename: string): string | null {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!extension) return null;

  const imageExtensions = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "ico",
    "tiff",
    "avif",
  ];
  const textExtensions = [
    "txt",
    "md",
    "csv",
    "json",
    "xml",
    "html",
    "css",
    "log",
    "ini",
    "conf",
    "yml",
    "yaml",
  ];
  const codeExtensions = [
    "js",
    "ts",
    "jsx",
    "tsx",
    "py",
    "java",
    "c",
    "cpp",
    "cs",
    "go",
    "rb",
    "php",
    "swift",
    "sh",
    "bash",
    "sql",
  ];
  const pdfExtensions = ["pdf"];
  const audioExtensions = ["mp3", "wav", "ogg", "flac", "aac", "m4a"];
  const videoExtensions = ["mp4", "webm", "mov", "avi", "mkv", "m4v"];

  if (imageExtensions.includes(extension)) return "image";
  if (textExtensions.includes(extension)) return "text";
  if (codeExtensions.includes(extension)) return "code";
  if (pdfExtensions.includes(extension)) return "pdf";
  if (audioExtensions.includes(extension)) return "audio";
  if (videoExtensions.includes(extension)) return "video";

  return null;
}

interface props {
  searchParams: Promise<{ key: string }>;
}

export default async function FilePreviewPage({ searchParams }: props) {
  // Validate query param
  const { key } = await searchParams;

  if (!key) {
    return (
      <div className="p-6 text-center text-red-600">No file key provided.</div>
    );
  }

  // Validate auth & get metadata
  const session = await auth();
  const userId = session?.userId;
  if (!userId) {
    return <div className="p-6 text-center text-red-600">Unauthorized</div>;
  }

  const [urlRes, metaRes] = await Promise.all([
    getFileUrl({ key }),
    getFileMetadata({ key, clerkId: userId }),
  ]);

  if (!urlRes.success || !urlRes.url) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to generate URL: {urlRes.error}
      </div>
    );
  }

  if (!metaRes.success || !metaRes.metadata) {
    return (
      <div className="p-6 text-center text-red-600">
        Failed to load metadata: {metaRes.error}
      </div>
    );
  }

  const meta = metaRes.metadata as {
    size: number;
    lastModified: string | null;
    contentType: string;
    etag: string;
    customMetadata: Record<string, string>;
  };

  // Get file data
  const contentType = meta.contentType || "";
  const fileUrl: string = urlRes.url as string;
  const filename = key.split("/").pop() || "";
  const fileTypeFromExtension = getFileTypeFromExtension(filename);

  return (
    <div className="max-w-5xl mx-auto py-4 px-3 sm:px-4 space-y-4">
      <div className="border rounded-lg shadow-sm overflow-hidden bg-card">
        {/* Header with file name and download button */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/10">
          <h1
            className="text-lg font-medium truncate max-w-[70%]"
            title={filename}
          >
            {filename}
          </h1>
          <Link
            href={fileUrl}
            download
            className="px-3 py-1.5 rounded-md bg-primary text-white hover:bg-primary/90 text-sm font-medium flex items-center gap-1"
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
            Download
          </Link>
        </div>

        {/* Preview Area - Using react-file-viewer */}
        <div className="p-4">
          <FileViewerClient
            fileUrl={fileUrl}
            filename={filename}
            contentType={contentType}
          />
        </div>

        {/* Metadata */}
        <div className="border-t p-4 bg-muted/10">
          <h2 className="font-medium mb-2 text-sm">File Information</h2>
          <ul className="text-sm space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li>
              <span className="font-medium">Size:</span>{" "}
              {formatBytes(meta.size)}
            </li>
            {meta.lastModified && (
              <li>
                <span className="font-medium">Last Modified:</span>{" "}
                {formatDistanceToNow(new Date(meta.lastModified), {
                  addSuffix: true,
                })}
              </li>
            )}
            {contentType && (
              <li>
                <span className="font-medium">Content-Type:</span>{" "}
                <span className="truncate" title={contentType}>
                  {contentType}
                </span>
              </li>
            )}
            {fileTypeFromExtension && (
              <li>
                <span className="font-medium">File Type:</span>{" "}
                {fileTypeFromExtension}
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
