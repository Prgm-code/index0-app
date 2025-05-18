import { useState } from "react";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "@pheralb/toast";
import { searchFiles } from "@/actions/SearchActions";
import { VectorSearchResponse } from "@/app/[locale]/[userSession]/page";

interface SmartSearchProps {
  onSearchResults: (results: VectorSearchResponse) => void;
  onError: (error: string) => void;
  onSetItems: (items: any[]) => void;
  currentItems: any[];
}

export function SmartSearch({
  onSearchResults,
  onError,
  onSetItems,
  currentItems,
}: SmartSearchProps) {
  const t = useTranslations("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    toast.loading({
      text: t("searching"),
      options: {
        promise: searchFiles(searchTerm),
        success: t("searchSuccess"),
        error: t("searchError"),
        autoDismiss: true,
        onSuccess(data: unknown) {
          const typed = data as VectorSearchResponse;
          if (typed.data?.length) {
            const vectorResults = typed.data.map((r) => ({
              key: r.filename,
              type: "file" as const,
              size: r.content?.[0]?.text.length || 0,
              lastModified: new Date(
                r.attributes?.timestamp || Date.now()
              ).toISOString(),
              vectorMetadata: {
                score: r.score,
                content: r.content,
                attributes: r.attributes,
              },
            }));
            onSetItems(vectorResults);
            onSearchResults(typed);
          } else {
            onSetItems(currentItems);
          }
        },
        onError(err) {
          onError(err instanceof Error ? err.message : t("searchError"));
        },
      },
    });
  };

  return (
    <div className="w-full max-w-sm">
      <label htmlFor="smart-search" className="sr-only">
        {t("searchPlaceholder")}
      </label>
      <div className="relative flex items-center">
        <Search className="absolute left-2 top-2 text-muted-foreground" />
        <textarea
          id="smart-search"
          rows={2}
          className="
            w-full
            pl-8 pr-14 py-1
            text-sm
            leading-snug
            resize-none
            rounded-md
            border
            border-gray-300 dark:border-gray-600
            bg-white dark:bg-gray-800
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-purple-500
          "
          placeholder={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
        <button
          onClick={handleSearch}
          className="
            absolute right-1 top-1/2 -translate-y-1/2
            px-3 py-1
            text-xs
            font-medium
            rounded
            bg-purple-600 hover:bg-purple-700
            text-white
            focus:outline-none focus:ring-2 focus:ring-purple-500
          "
        >
          {t("search")}
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("pressEnterOrClick")}
      </p>
    </div>
  );
}
