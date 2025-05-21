import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full mx-auto py-4 px-3 sm:px-4 space-y-4">
      <div className="border rounded-lg shadow-sm overflow-hidden bg-card p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full max-w-md mb-8" />

        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4 mb-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
          </div>

          <div className="overflow-x-auto rounded-md border">
            <div className="min-w-full">
              {/* Table header skeleton */}
              <div className="border-b bg-muted/50 py-2 px-3 grid grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-5 w-20" />
                ))}
              </div>

              {/* Table rows skeleton */}
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="border-t py-2 px-3 grid grid-cols-4 gap-3"
                >
                  {[...Array(4)].map((_, j) => (
                    <Skeleton key={j} className="h-5 w-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
