import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileIcon } from "../FileComponents/FileIcon";
import { VectorSearchResponse } from "@/interfaces/SmartSearch";
import { useSession } from "@clerk/nextjs";
import React from "react";

interface SearchResponseProps {
  data: VectorSearchResponse;
}

export function SearchResponse({ data }: SearchResponseProps) {
  const t = useTranslations("dashboard");
  const { session } = useSession();
  const sessionId = session?.id;

  if (!data?.response) return null;

  const formatDocumentLink = (content: string): React.ReactNode => {
    // Regex for detecting markdown-style links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all link matches
    let linkMatch;
    while ((linkMatch = linkRegex.exec(content)) !== null) {
      // Add text before the current match
      if (linkMatch.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.slice(lastIndex, linkMatch.index)}
          </span>
        );
      }

      // Process the link
      const fileName = linkMatch[1].split("/").pop() || linkMatch[1];
      const documentPath = linkMatch[2];
      const fileUrl = `/${sessionId}/file?key=${encodeURIComponent(
        documentPath
      )}`;

      parts.push(
        <Link
          shallow
          key={`link-${linkMatch.index}`}
          href={fileUrl}
          className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
        >
          <span className="opacity-70">📄</span>
          <span className="break-all">{fileName}</span>
        </Link>
      );

      lastIndex = linkMatch.index + linkMatch[0].length;
    }

    // Add any remaining text
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
}
