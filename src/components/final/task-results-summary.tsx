"use client";

import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import type { TaskWithDetails } from "@/lib/final-task-service";
import type { TaskFilters } from "./task-filters";

interface TaskResultsSummaryProps {
  totalTasks: number;
  filteredTasks: TaskWithDetails[];
  filters: TaskFilters;
}

export function TaskResultsSummary({
  totalTasks,
  filteredTasks,
  filters,
}: TaskResultsSummaryProps) {
  const hasActiveFilters =
    filters.assigneeIds.length > 0 || filters.sortBy !== "createdAt-desc";

  if (!hasActiveFilters) {
    return null; // Don't show summary when no filters are active
  }

  const filteredCount = filteredTasks.length;
  const isFiltered = filteredCount !== totalTasks;

  if (!isFiltered) {
    return null; // Don't show if all tasks are displayed
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
          <Filter className="h-4 w-4 text-blue-600" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-blue-900">Showing</span>
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 border-blue-300 font-semibold"
          >
            {filteredCount}
          </Badge>
          <span className="text-sm text-blue-700">of</span>
          <Badge
            variant="outline"
            className="border-blue-300 text-blue-700 font-semibold"
          >
            {totalTasks}
          </Badge>
          <span className="text-sm text-blue-700">tasks</span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-blue-600">
        {filters.assigneeIds.length > 0 && (
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>
              Filtered by {filters.assigneeIds.length} assignee
              {filters.assigneeIds.length === 1 ? "" : "s"}
            </span>
          </div>
        )}
        {filters.sortBy !== "createdAt-desc" && (
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>Sorted by {getSortLabel(filters.sortBy)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function getSortLabel(sortBy: string): string {
  switch (sortBy) {
    case "createdAt-asc":
      return "oldest first";
    case "score-desc":
      return "highest score";
    case "score-asc":
      return "lowest score";
    case "priority":
      return "priority";
    case "dueDate":
      return "due date";
    default:
      return "newest first";
  }
}
