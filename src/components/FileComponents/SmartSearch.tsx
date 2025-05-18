import { useState } from "react";
import { Search } from "lucide-react";
import { TailSpin } from "react-loader-spinner";
import { useTranslations } from "next-intl";
import { toast } from "@pheralb/toast";
import { searchFiles } from "@/actions/SearchActions";
import { VectorSearchResponse } from "@/app/[locale]/[userSession]/page";
import { useLocale } from "next-intl";

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
  const locale = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);

    // Modify query if language is Spanish
    const modifiedQuery =
      locale === "es" ? `<search lang="es">${searchTerm}</search>` : searchTerm;

    toast.loading({
      text: t("searching"),
      options: {
        promise: searchFiles(modifiedQuery),
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
          } else {
            onSetItems(currentItems);
          }
          onSearchResults(typed);
          setIsLoading(false);
        },
        onError(err) {
          onError(err instanceof Error ? err.message : t("searchError"));
          setIsLoading(false);
        },
      },
    });
  };

  return (
    <div className="w-full max-w-sm">
      <div className="relative flex items-center">
        <div className="absolute left-3 z-10">
          {isLoading ? (
            <TailSpin
              width={16}
              height={16}
              ariaLabel="loading-search"
              visible={true}
            />
          ) : (
            <Search className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <textarea
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSearch();
            }
          }}
          disabled={isLoading}
          placeholder={t("searchPlaceholder")}
          className="w-full min-h-[44px] max-h-[44px] py-2 px-10 text-sm leading-normal resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className="absolute right-2 h-[32px] px-4 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t("search")}
        </button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {t("pressEnterOrClick")}
      </p>
    </div>
  );
}
