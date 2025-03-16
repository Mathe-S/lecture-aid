"use client";

import { useState } from "react";
import {
  QueryCache,
  MutationCache,
  QueryClient,
  QueryClientProvider as TanStackQueryProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "sonner";
export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
        queryCache: new QueryCache({
          onError: (error: any) => {
            toast.error("Error loading data", {
              description: error?.message || "Please try again later",
            });
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: any) => {
            toast.error("Operation failed", {
              description: error?.message || "Please try again",
            });
          },
        }),
      })
  );

  return (
    <TanStackQueryProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </TanStackQueryProvider>
  );
}
