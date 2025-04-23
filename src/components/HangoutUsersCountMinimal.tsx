"use client";

import { useHangoutStore } from "@/store/hangoutStore";

export function HangoutUsersCountMinimal() {
  // Select the count from the Zustand store
  const count = useHangoutStore((state) => state.count);

  // Render based on the count from the store
  return count !== null && count > 0 ? (
    <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
      {count}
    </span>
  ) : null;
}
