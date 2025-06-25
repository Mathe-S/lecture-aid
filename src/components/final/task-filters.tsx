"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Filter,
  SortDesc,
  Calendar,
  Award,
  Users,
  X,
  ChevronDown,
} from "lucide-react";
import type { TaskWithDetails } from "@/lib/final-task-service";

// Helper function to get user initials
function getInitials(fullName: string | null): string {
  if (!fullName) return "U";
  return fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export type SortOption =
  | "createdAt-desc"
  | "createdAt-asc"
  | "score-desc"
  | "score-asc"
  | "priority"
  | "dueDate";

export interface TaskFilters {
  assigneeIds: string[];
  sortBy: SortOption;
}

interface TaskFiltersProps {
  tasks: TaskWithDetails[];
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
}

export function TaskFiltersComponent({
  tasks,
  filters,
  onFiltersChange,
}: TaskFiltersProps) {
  // Get all unique assignees from tasks
  const allAssignees = useMemo(() => {
    const assigneeMap = new Map();

    tasks.forEach((task) => {
      task.assignees.forEach((assignee) => {
        if (!assigneeMap.has(assignee.profile.id)) {
          assigneeMap.set(assignee.profile.id, assignee.profile);
        }
      });
    });

    return Array.from(assigneeMap.values());
  }, [tasks]);

  const handleAssigneeToggle = (assigneeId: string) => {
    const newAssigneeIds = filters.assigneeIds.includes(assigneeId)
      ? filters.assigneeIds.filter((id) => id !== assigneeId)
      : [...filters.assigneeIds, assigneeId];

    onFiltersChange({
      ...filters,
      assigneeIds: newAssigneeIds,
    });
  };

  const handleSortChange = (sortBy: SortOption) => {
    onFiltersChange({
      ...filters,
      sortBy,
    });
  };

  const clearAssigneeFilters = () => {
    onFiltersChange({
      ...filters,
      assigneeIds: [],
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      assigneeIds: [],
      sortBy: "createdAt-desc",
    });
  };

  const hasActiveFilters =
    filters.assigneeIds.length > 0 || filters.sortBy !== "createdAt-desc";

  return (
    <div className="space-y-4">
      {/* Main Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-1">
          <div className="flex items-center gap-2 text-slate-700 font-medium">
            <Filter className="h-4 w-4" />
            <span className="text-sm">Filter & Sort</span>
          </div>

          <Separator orientation="vertical" className="hidden sm:block h-6" />

          <div className="flex flex-wrap gap-3 items-center">
            {/* Assignee Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 bg-white hover:bg-slate-50 border-slate-300 shadow-sm"
                >
                  <Users className="h-4 w-4 text-slate-600" />
                  <span className="text-slate-700">Assignees</span>
                  {filters.assigneeIds.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
                    >
                      {filters.assigneeIds.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3 text-slate-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuLabel className="text-slate-700 font-medium">
                  Filter by Assignee
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {allAssignees.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500 text-center">
                    No assignees found
                  </div>
                ) : (
                  allAssignees.map((assignee) => (
                    <DropdownMenuCheckboxItem
                      key={assignee.id}
                      checked={filters.assigneeIds.includes(assignee.id)}
                      onCheckedChange={() => handleAssigneeToggle(assignee.id)}
                      className="gap-3 py-2.5"
                    >
                      <Avatar className="h-7 w-7 border-2 border-white shadow-sm">
                        <AvatarImage src={assignee.avatarUrl || undefined} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {getInitials(assignee.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">
                          {assignee.fullName || "Unknown User"}
                        </span>
                        {assignee.email && (
                          <span className="text-xs text-slate-500">
                            {assignee.email}
                          </span>
                        )}
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))
                )}
                {filters.assigneeIds.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAssigneeFilters}
                      className="w-full justify-start gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    >
                      <X className="h-4 w-4" />
                      Clear Selection
                    </Button>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Options */}
            <Select value={filters.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[200px] h-9 bg-white hover:bg-slate-50 border-slate-300 shadow-sm">
                <div className="flex items-center gap-2">
                  <SortDesc className="h-4 w-4 text-slate-600" />
                  <SelectValue placeholder="Sort by..." />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span>Newest First</span>
                  </div>
                </SelectItem>
                <SelectItem value="createdAt-asc">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-600" />
                    <span>Oldest First</span>
                  </div>
                </SelectItem>
                <SelectItem value="score-desc">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Highest Score</span>
                  </div>
                </SelectItem>
                <SelectItem value="score-asc">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>Lowest Score</span>
                  </div>
                </SelectItem>
                <SelectItem value="priority">
                  <div className="flex items-center gap-2">
                    <SortDesc className="h-4 w-4 text-red-600" />
                    <span>By Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="dueDate">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>By Due Date</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear All Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {filters.assigneeIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4">
          <span className="text-sm text-slate-600 font-medium">
            Active filters:
          </span>
          {filters.assigneeIds.map((assigneeId) => {
            const assignee = allAssignees.find((a) => a.id === assigneeId);
            if (!assignee) return null;

            return (
              <Badge
                key={assigneeId}
                variant="secondary"
                className="gap-2 pr-2 py-1.5 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
              >
                <Avatar className="h-5 w-5 border border-blue-200">
                  <AvatarImage src={assignee.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(assignee.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {assignee.fullName?.split(" ")[0] || assignee.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-blue-200 rounded-full"
                  onClick={() => handleAssigneeToggle(assigneeId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
