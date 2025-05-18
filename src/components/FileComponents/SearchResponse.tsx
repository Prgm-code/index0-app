import Link from "next/link";
import { useTranslations } from "next-intl";
import { FileIcon } from "./FileIcon";
import { VectorSearchResponse } from "@/app/[locale]/[userSession]/page";

interface SearchResponseProps {
  data: VectorSearchResponse;
}

export function SearchResponse({ data }: SearchResponseProps) {
  const t = useTranslations("dashboard");

  if (!data?.response) return null;

  return (
    <section className="mt-8">
      <h3 className="text-lg font-semibold mb-4">{t("searchResults")}</h3>
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
        <div className="prose dark:prose-invert max-w-none">
          {data.response.split("\n").map((paragraph, index) => {
            // Check if the paragraph contains a file reference
            const isFileReference =
              paragraph.includes(".jpg") ||
              paragraph.includes(".pdf") ||
              paragraph.includes(".doc") ||
              paragraph.includes(".txt");

            return isFileReference ? (
              <div key={index} className="mb-4">
                <Link
                  href="#"
                  className="text-blue-500 hover:underline flex items-center gap-2"
                  onClick={(e) => {
                    e.preventDefault();
                    console.log("File link clicked:", paragraph);
                  }}
                >
                  <FileIcon filename={paragraph} className="h-4 w-4" />
                  <span>{paragraph}</span>
                </Link>
              </div>
            ) : (
              <p key={index} className="mb-4 whitespace-pre-line">
                {paragraph}
              </p>
            );
          })}
        </div>
      </div>
    </section>
  );
}
