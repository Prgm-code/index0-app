import { getFileMetadata } from "@/actions/FileActions";
import { getFileUrl } from "@/actions/FileActions";
import { useQuery } from "@tanstack/react-query";

export const useQueryUrlFile = (fileKey: string | null) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["file", fileKey],
    queryFn: () => getFileUrl({ key: fileKey as string }),

    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
  return { data, isLoading, error };
};

export const useQueryMetadataFile = (fileKey: string, clerkId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["file", fileKey],
    queryFn: () => getFileMetadata({ key: fileKey, clerkId }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
  });
  return { data, isLoading, error };
};
