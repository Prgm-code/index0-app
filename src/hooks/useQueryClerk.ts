import { useQuery } from "@tanstack/react-query";
import { getUserMetadata } from "@/actions/clerck-actions";

import { useUser } from "@clerk/nextjs";

export const useQueryClerk = () => {
  const { user } = useUser();
  console.log(user);

  return useQuery({
    queryKey: ["userMetadata"],
    queryFn: () => getUserMetadata(user?.id ?? ""),
  });
};
