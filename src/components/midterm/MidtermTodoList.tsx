"use client";

import { useState, useMemo } from "react";
import { MidtermTask } from "@/db/drizzle/midterm-schema";
import { useUpdateTaskStatus } from "@/hooks/useMidtermGroups";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ListTodo, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface MidtermTodoListProps {
  tasks: MidtermTask[];
  groupId: string;
  canEdit: boolean;
}

interface GroupedTasks {
  [phase: string]: {
    [step: string]: MidtermTask[];
  };
}

export function MidtermTodoList({
  tasks,
  groupId,
  canEdit,
}: MidtermTodoListProps) {
  const { mutate: updateTask } = useUpdateTaskStatus();
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCheckedChange = (taskId: string, isChecked: boolean) => {
    if (!canEdit) return;

    setUpdatingTaskId(taskId);

    updateTask(
      { taskId, isChecked, groupId },
      {
        onSuccess: () => {},
        onError: (error) => {
          console.error("Failed to update task", error);
          toast.error("Failed to update task status", {
            description: error.message,
          });
        },
        onSettled: () => {
          setUpdatingTaskId(null);
        },
      }
    );
  };

  const groupedTasks = useMemo(() => {
    return tasks.reduce<GroupedTasks>((acc, task) => {
      if (!acc[task.phase]) {
        acc[task.phase] = {};
      }
      if (!acc[task.phase][task.step]) {
        acc[task.phase][task.step] = [];
      }
      acc[task.phase][task.step].push(task);
      return acc;
    }, {});
  }, [tasks]);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.isChecked).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No TODO list uploaded or tasks found.
      </p>
    );
  }

  return (
    <Card className="border-blue-100">
      <CardHeader>
        <div className="flex items-center justify-between mb-1 gap-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <ListTodo className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <span className="truncate">Project TODO List</span>
          </CardTitle>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-base font-medium text-muted-foreground hidden sm:inline">
              {completedTasks} / {totalTasks} done
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-expanded={!isCollapsed}
              aria-controls="todo-list-content"
            >
              {isCollapsed ? (
                <ChevronDown className="h-4 w-4 mr-1" />
              ) : (
                <ChevronUp className="h-4 w-4 mr-1" />
              )}
              {isCollapsed ? "Show" : "Hide"}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-2.5" />
      </CardHeader>
      {!isCollapsed && (
        <CardContent
          id="todo-list-content"
          className="pt-5 pb-4 border-t border-blue-50 mt-4"
        >
          <div className="space-y-8">
            {Object.entries(groupedTasks).map(([phase, steps], phaseIndex) => (
              <div key={phaseIndex}>
                <h3 className="text-xl font-bold mb-4 text-blue-700 border-b-2 border-blue-200 pb-2">
                  {phase}
                </h3>
                <div className="space-y-5 pl-3">
                  {Object.entries(steps).map(([step, taskItems], stepIndex) => (
                    <div key={stepIndex}>
                      <h4 className="font-semibold text-lg mb-3">{step}</h4>
                      <ul className="space-y-2.5 pl-5 list-none">
                        {taskItems.map((task) => (
                          <li
                            key={task.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 transition-colors duration-150"
                          >
                            {updatingTaskId === task.id ? (
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                            ) : (
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={task.isChecked}
                                onCheckedChange={(checked) => {
                                  handleCheckedChange(task.id, !!checked);
                                }}
                                disabled={
                                  !canEdit || updatingTaskId === task.id
                                }
                                aria-label={task.taskText}
                                className="h-5 w-5 disabled:cursor-not-allowed disabled:opacity-70 transition-opacity data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            )}
                            <label
                              htmlFor={`task-${task.id}`}
                              className={`flex-1 text-base font-medium cursor-pointer ${
                                task.isChecked
                                  ? "text-muted-foreground line-through opacity-80"
                                  : "text-foreground"
                              } ${!canEdit ? "cursor-default" : ""}`}
                            >
                              {task.taskText}
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
