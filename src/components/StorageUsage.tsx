import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Label } from "@radix-ui/react-label";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserMetadata } from "@/actions/clerck-actions";

interface StorageUsageProps {
  isIconMode: boolean;
  isFullyExpanded: boolean;
}

export function StorageUsage({
  isIconMode,
  isFullyExpanded,
}: StorageUsageProps) {
  const { user } = useUser();
  const t = useTranslations("menu");
  const [userMetadata, setUserMetadata] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserMetadata = async () => {
      try {
        setIsLoading(true);
        const metadata = await getUserMetadata(user?.id ?? "");
        setUserMetadata(metadata);
      } catch (error) {
        console.error("Error fetching user metadata:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserMetadata();
  }, [user]);

  // Cálculo de uso en MB y porcentaje
  const usedBytes = userMetadata?.filesSize || 0;
  const limitBytes = userMetadata?.maxStorage || 0;
  const usedMB = usedBytes / 1024 / 1024;
  const limitMB = limitBytes / 1024 / 1024;
  const percent =
    limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;

  // Determine progress bar color based on usage percentage
  const getProgressColorClass = () => {
    if (percent > 100) return "bg-red-500";
    if (percent >= 90) return "bg-red-500";
    if (percent >= 80) return "bg-yellow-500";
    return ""; // default color
  };

  if (isLoading) {
    return renderLoadingState(isIconMode);
  }

  if (!userMetadata) {
    return null;
  }

  if (isIconMode) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="mx-auto px-2 py-1">
            <Progress
              value={percent}
              className={`w-6 h-6 rounded-full ${getProgressColorClass()}`}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          {t("storageInfo", {
            used: usedMB.toFixed(2),
            limit: limitMB.toFixed(2),
          })}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (!isFullyExpanded) {
    return null;
  }

  return (
    <div className="px-4 py-2 animate-in fade-in duration-200">
      <Label className="mb-1 block">{t("storageUsage")}</Label>
      <Progress
        value={percent}
        className={`w-full mb-1 ${getProgressColorClass()}`}
      />
      <div className="text-sm text-muted-foreground">
        {t("storageInfo", {
          used: usedMB.toFixed(2),
          limit: limitMB.toFixed(2),
        })}
      </div>
    </div>
  );
}

function renderLoadingState(isIconMode: boolean) {
  if (isIconMode) {
    return (
      <div className="mx-auto px-2 py-1">
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
    );
  }

  return (
    <div className="px-4 py-2">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-2 w-full mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
