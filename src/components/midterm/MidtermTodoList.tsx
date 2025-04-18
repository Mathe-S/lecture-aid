"use client";

import { useState, useMemo, useEffect } from "react";
import { MidtermTask } from "@/db/drizzle/midterm-schema";
import { useUpdateTaskStatus } from "@/hooks/useMidtermGroups";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ListTodo } from "lucide-react";

interface MidtermTodoListProps {
  tasks: MidtermTask[];
  groupId: string;
  canEdit: boolean; // To control if checkboxes are interactive
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
  const { mutate: updateTask, isPending: isUpdatingTask } =
    useUpdateTaskStatus();
  const [optimisticTasks, setOptimisticTasks] = useState(tasks);

  // Update optimistic state when tasks prop changes
  useEffect(() => {
    setOptimisticTasks(tasks);
  }, [tasks]);

  const handleCheckedChange = (taskId: string, isChecked: boolean) => {
    if (!canEdit) return;

    // Optimistic update
    setOptimisticTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, isChecked } : task
      )
    );

    updateTask(
      { taskId, isChecked, groupId },
      {
        onError: (error) => {
          console.error("Failed to update task", error);
          toast.error("Failed to update task status", {
            description: error.message,
          });
          // Revert optimistic update on error
          setOptimisticTasks(tasks);
        },
      }
    );
  };

  const groupedTasks = useMemo(() => {
    return optimisticTasks.reduce<GroupedTasks>((acc, task) => {
      if (!acc[task.phase]) {
        acc[task.phase] = {};
      }
      if (!acc[task.phase][task.step]) {
        acc[task.phase][task.step] = [];
      }
      acc[task.phase][task.step].push(task);
      return acc;
    }, {});
  }, [optimisticTasks]);

  const totalTasks = optimisticTasks.length;
  const completedTasks = optimisticTasks.filter(
    (task) => task.isChecked
  ).length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  if (!tasks || tasks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No TODO list uploaded or tasks found.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5 text-blue-500" />
            Project TODO List
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completedTasks} / {totalTasks} tasks completed
          </span>
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full space-y-2">
          {Object.entries(groupedTasks).map(([phase, steps], phaseIndex) => (
            <AccordionItem key={phaseIndex} value={`phase-${phaseIndex}`}>
              <AccordionTrigger className="text-lg font-semibold bg-slate-50 px-4 py-2 rounded">
                {phase}
              </AccordionTrigger>
              <AccordionContent className="pt-2 pl-4 pr-2 space-y-1">
                {Object.entries(steps).map(([step, taskItems], stepIndex) => (
                  <div key={stepIndex} className="ml-4 border-l pl-4 py-1">
                    <h4 className="font-medium text-md mb-1">{step}</h4>
                    <ul className="space-y-1">
                      {taskItems.map((task) => (
                        <li key={task.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`task-${task.id}`}
                            checked={task.isChecked}
                            onCheckedChange={(checked) => {
                              handleCheckedChange(task.id, !!checked);
                            }}
                            disabled={!canEdit || isUpdatingTask}
                            aria-label={task.taskText}
                            className="disabled:cursor-not-allowed disabled:opacity-70"
                          />
                          <label
                            htmlFor={`task-${task.id}`}
                            className={`text-sm ${
                              task.isChecked
                                ? "text-muted-foreground line-through"
                                : ""
                            }`}
                          >
                            {task.taskText}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
