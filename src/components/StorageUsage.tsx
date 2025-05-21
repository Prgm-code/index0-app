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
import { useQueryClerk } from "@/hooks/useQueryClerk";

interface StorageUsageProps {
  isIconMode: boolean;
  isFullyExpanded: boolean;
}

export function StorageUsage({
  isIconMode,
  isFullyExpanded,
}: StorageUsageProps) {
  const t = useTranslations("menu");

  const { data: userMetadata, isLoading } = useQueryClerk();
  console.log(userMetadata);

  // Cálculo de uso en MB y porcentaje
  const usedBytes = Number(userMetadata?.filesSize ?? 0);
  const limitBytes = Number(userMetadata?.maxStorage ?? 0);
  const usedMB = usedBytes / 1024 / 1024;
  const limitMB = limitBytes / 1024 / 1024;
  const percent = limitBytes > 0 ? (usedBytes / limitBytes) * 100 : 0;

  // Determine progress bar color based on usage percentage
  const getProgressColorClass = () => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 80) return "bg-yellow-500";
    return "bg-primary"; // default color from theme
  };

  // Value to display in the progress bar (capped at 100 for visual purposes)
  const progressValue = Math.min(percent, 100);

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
              value={progressValue}
              className="w-6 h-6 rounded-full"
              indicatorClassName={getProgressColorClass()}
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
        value={progressValue}
        className="w-full mb-1"
        indicatorClassName={getProgressColorClass()}
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
