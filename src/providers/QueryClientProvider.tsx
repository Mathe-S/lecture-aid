"use client";

import { useState, useEffect } from "react";
import {
  QueryCache,
  MutationCache,
  QueryClient,
  QueryClientProvider as TanStackQueryProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { toast } from "sonner";
import NProgress from "nprogress";
import { createClient } from "@/utils/supabase/client";

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
          onError: (error: any, query) => {
            // Only show error toasts for non-auth queries or unexpected auth errors
            const isAuthQuery = query.queryKey[0] === "auth";
            const isExpectedAuthError = error?.message?.includes(
              "Auth session missing"
            );

            if (!isAuthQuery || (isAuthQuery && !isExpectedAuthError)) {
              toast.error("Error loading data", {
                description: error?.message || "Please try again later",
              });
            }
          },
        }),
        mutationCache: new MutationCache({
          onMutate: () => {
            // Show loading indicator when any mutation starts
            NProgress.start();
          },
          onSettled: () => {
            // Hide indicator when mutations complete (success or error)
            NProgress.done();
          },
          onError: (error: any) => {
            toast.error("Operation failed", {
              description: error?.message || "Please try again",
            });
          },
        }),
      })
  );

  // Listen for auth state changes
  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        // Clear all queries when signed out
        queryClient.clear();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <TanStackQueryProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </TanStackQueryProvider>
  );
}
