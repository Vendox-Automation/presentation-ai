"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getPresentationOwner,
  type PresentationOwnerProfile,
} from "@/app/_actions/notebook/presentation/presentationActions";

export function usePresentationOwner(presentationId: string | null) {
  return useQuery<PresentationOwnerProfile | null>({
    queryKey: ["presentation-owner", presentationId],
    queryFn: async () => {
      if (!presentationId) {
        return null;
      }

      const result = await getPresentationOwner(presentationId);

      return result.success ? result.owner : null;
    },
    enabled: Boolean(presentationId),
    staleTime: Infinity,
  });
}
