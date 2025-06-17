"use client";

import { useState, useEffect } from "react";
import hljs from "highlight.js";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Move, Target } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Question Types
export type QuestionType =
  | "multiple-choice"
  | "drag-drop-code"
  | "sequence-order"
  | "match-concepts"
  | "click-code"
  | "dropdown-fill"
  | "before-after"
  | "visual-diagram";

export interface BaseQuestion {
  type: QuestionType;
  question: string;
  explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple-choice";
  options: string[];
  correctAnswer: number;
}

export interface DragDropCodeQuestion extends BaseQuestion {
  type: "drag-drop-code";
  codeBlocks: string[];
  correctOrder: number[];
}

export interface SequenceOrderQuestion extends BaseQuestion {
  type: "sequence-order";
  items: string[];
  correctOrder: number[];
}

export interface MatchConceptsQuestion extends BaseQuestion {
  type: "match-concepts";
  concepts: string[];
  definitions: string[];
  correctMatches: Record<number, number>;
}

export interface ClickCodeQuestion extends BaseQuestion {
  type: "click-code";
  codeLines: string[];
  correctLines: number[];
  multiSelect?: boolean;
}

export interface DropdownFillQuestion extends BaseQuestion {
  type: "dropdown-fill";
  template: string;
  blanks: Array<{
    id: string;
    options: string[];
    correctAnswer: number;
  }>;
}

export interface BeforeAfterQuestion extends BaseQuestion {
  type: "before-after";
  beforeCode: string;
  afterOptions: string[];
  correctAfter: number;
}

export interface VisualDiagramQuestion extends BaseQuestion {
  type: "visual-diagram";
  diagram: string; // SVG or image
  clickableAreas: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  }>;
  correctAreas: string[];
}

export type Question =
  | MultipleChoiceQuestion
  | DragDropCodeQuestion
  | SequenceOrderQuestion
  | MatchConceptsQuestion
  | ClickCodeQuestion
  | DropdownFillQuestion
  | BeforeAfterQuestion
  | VisualDiagramQuestion;

interface InteractiveQuestionProps {
  question: Question;
  onAnswer: (isCorrect: boolean, userAnswer: any) => void;
  showResult?: boolean;
  isCorrect?: boolean;
}

// Sortable Item Component for Drag & Drop
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-gray-100 p-3 rounded-lg border-2 border-dashed border-gray-300 cursor-move hover:border-blue-400 transition-colors"
    >
      <div className="flex items-center gap-2">
        <Move className="h-4 w-4 text-gray-500" />
        {children}
      </div>
    </div>
  );
}

export function InteractiveQuestion({
  question,
  onAnswer,
  showResult = false,
  isCorrect = false,
}: InteractiveQuestionProps) {
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [localShowResult, setLocalShowResult] = useState(false);
  const [localIsCorrect, setLocalIsCorrect] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setUserAnswer(null);
    setLocalShowResult(false);
    setLocalIsCorrect(false);
  }, [question]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubmit = () => {
    // If trying again, reset feedback first
    if (localShowResult && !localIsCorrect) {
      setLocalShowResult(false);
      setLocalIsCorrect(false);
      return;
    }

    let correct = false;
    let answerToSubmit = userAnswer;

    switch (question.type) {
      case "multiple-choice":
        if (userAnswer === null) return;
        correct =
          userAnswer === (question as MultipleChoiceQuestion).correctAnswer;
        break;
      case "drag-drop-code":
      case "sequence-order":
        // For drag-drop, if no answer yet, use the initial order
        if (userAnswer === null) {
          answerToSubmit =
            question.type === "drag-drop-code"
              ? (question as DragDropCodeQuestion).codeBlocks.map((_, i) => i)
              : (question as SequenceOrderQuestion).items.map((_, i) => i);
        }
        const correctOrder = (
          question as DragDropCodeQuestion | SequenceOrderQuestion
        ).correctOrder;
        correct =
          JSON.stringify(answerToSubmit) === JSON.stringify(correctOrder);
        break;
      case "click-code":
        // For click-code, if no answer yet, treat as empty selection
        if (userAnswer === null) {
          answerToSubmit = [];
        }
        const correctLines = (question as ClickCodeQuestion).correctLines;
        correct =
          JSON.stringify(answerToSubmit.sort()) ===
          JSON.stringify(correctLines.sort());
        break;
      default:
        correct = false;
    }

    setLocalShowResult(true);
    setLocalIsCorrect(correct);
    onAnswer(correct, answerToSubmit);
  };

  const renderQuestion = () => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <MultipleChoiceRenderer
            question={question as MultipleChoiceQuestion}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            showResult={showResult || localShowResult}
            isCorrect={isCorrect || localIsCorrect}
          />
        );

      case "drag-drop-code":
        return (
          <DragDropCodeRenderer
            question={question as DragDropCodeQuestion}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            sensors={sensors}
          />
        );

      case "sequence-order":
        return (
          <SequenceOrderRenderer
            question={question as SequenceOrderQuestion}
            setUserAnswer={setUserAnswer}
            sensors={sensors}
          />
        );

      case "click-code":
        return (
          <ClickCodeRenderer
            question={question as ClickCodeQuestion}
            userAnswer={userAnswer}
            setUserAnswer={setUserAnswer}
            showResult={showResult || localShowResult}
          />
        );

      default:
        return <div>Question type not implemented yet</div>;
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Target className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
            <h3 className="font-semibold text-blue-900">{question.question}</h3>
          </div>

          {renderQuestion()}

          {!showResult && (!localShowResult || !localIsCorrect) && (
            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-600">
                {question.type === "drag-drop-code" &&
                  "Drag and drop to reorder"}
                {question.type === "multiple-choice" &&
                  "Select the best answer"}
                {question.type === "click-code" &&
                  "Click on the problematic lines"}
                {question.type === "sequence-order" &&
                  "Arrange in correct order"}
              </div>
              <Button
                onClick={handleSubmit}
                disabled={
                  (localShowResult && localIsCorrect) ||
                  (question.type === "multiple-choice" && userAnswer === null)
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {localShowResult && !localIsCorrect
                  ? "Try Again"
                  : "Submit Answer"}
              </Button>
            </div>
          )}

          {(showResult || localShowResult) && (
            <div
              className={`p-3 rounded-lg flex items-center gap-2 ${
                isCorrect || localIsCorrect
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isCorrect || localIsCorrect ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="font-medium">
                {isCorrect || localIsCorrect ? "Correct!" : "Not quite right."}
              </span>
              {question.explanation && (
                <span className="ml-2">{question.explanation}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Individual Question Renderers

function MultipleChoiceRenderer({
  question,
  userAnswer,
  setUserAnswer,
  showResult,
  isCorrect,
}: {
  question: MultipleChoiceQuestion;
  userAnswer: number | null;
  setUserAnswer: (answer: number) => void;
  showResult: boolean;
  isCorrect: boolean;
}) {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => (
        <button
          key={index}
          onClick={() => setUserAnswer(index)}
          disabled={showResult}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            userAnswer === index
              ? showResult
                ? isCorrect && index === question.correctAnswer
                  ? "border-green-500 bg-green-50"
                  : !isCorrect && index === userAnswer
                  ? "border-red-500 bg-red-50"
                  : "border-blue-500 bg-blue-50"
                : "border-blue-500 bg-blue-50"
              : showResult && index === question.correctAnswer
              ? "border-green-500 bg-green-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                userAnswer === index
                  ? "border-blue-500 bg-blue-500"
                  : "border-gray-300"
              }`}
            >
              {userAnswer === index && (
                <div className="w-3 h-3 bg-white rounded-full" />
              )}
            </div>
            <span className="font-mono text-sm">
              {String.fromCharCode(65 + index)})
            </span>
            <span>{option}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function DragDropCodeRenderer({
  question,
  setUserAnswer,
  sensors,
}: {
  question: DragDropCodeQuestion;
  userAnswer: number[] | null;
  setUserAnswer: (answer: number[]) => void;
  sensors: any;
}) {
  const [items, setItems] = useState(
    question.codeBlocks.map((block, index) => ({
      id: index.toString(),
      content: block,
      originalIndex: index,
    }))
  );

  // This effect resets the component's state when the question prop changes.
  useEffect(() => {
    setItems(
      question.codeBlocks.map((block, index) => ({
        id: index.toString(),
        content: block,
        originalIndex: index,
      }))
    );
    // Also reset the user's answer in the parent component
    setUserAnswer(question.codeBlocks.map((_, index) => index));
    // Use a timeout to ensure the DOM has updated before re-applying highlighting
    setTimeout(() => hljs.highlightAll(), 0);
  }, [question, setUserAnswer]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      setUserAnswer(newItems.map((item) => item.originalIndex));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.map(
            (item: { id: string; content: string; originalIndex: number }) => (
              <SortableItem key={item.id} id={item.id}>
                <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap">
                  <code className="language-typescript">{item.content}</code>
                </pre>
              </SortableItem>
            )
          )}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SequenceOrderRenderer({
  question,
  setUserAnswer,
  sensors,
}: {
  question: SequenceOrderQuestion;
  setUserAnswer: (answer: number[]) => void;
  sensors: any;
}) {
  const [items, setItems] = useState(
    question.items.map((item, index) => ({
      id: index.toString(),
      content: item,
      originalIndex: index,
    }))
  );

  // This effect resets the component's state when the question prop changes.
  useEffect(() => {
    setItems(
      question.items.map((item, index) => ({
        id: index.toString(),
        content: item,
        originalIndex: index,
      }))
    );
    // Also reset the user's answer in the parent component
    setUserAnswer(question.items.map((_, index) => index));
  }, [question, setUserAnswer]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      setUserAnswer(newItems.map((item) => item.originalIndex));
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map(
              (
                item: { id: string; content: string; originalIndex: number },
                index: number
              ) => (
                <SortableItem key={item.id} id={item.id}>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {index + 1}
                    </Badge>
                    <span>{item.content}</span>
                  </div>
                </SortableItem>
              )
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function ClickCodeRenderer({
  question,
  userAnswer,
  setUserAnswer,
  showResult,
}: {
  question: ClickCodeQuestion;
  userAnswer: number[] | null;
  setUserAnswer: (answer: number[]) => void;
  showResult: boolean;
}) {
  const selectedLines = userAnswer || [];

  const toggleLine = (lineIndex: number) => {
    let newSelection;
    if (question.multiSelect) {
      newSelection = selectedLines.includes(lineIndex)
        ? selectedLines.filter((i) => i !== lineIndex)
        : [...selectedLines, lineIndex];
    } else {
      // If multiSelect is false, clicking a new line deselects the old one
      newSelection = selectedLines.includes(lineIndex) ? [] : [lineIndex];
    }
    setUserAnswer(newSelection);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-white overflow-x-auto">
      {question.codeLines.map((line, index) => {
        const isSelected = selectedLines.includes(index);
        const isCorrectLine = question.correctLines.includes(index);

        const lineClasses = `
          block -mx-4 px-4 py-1 border-l-4 
          ${
            showResult
              ? isSelected && isCorrectLine
                ? "border-green-500 bg-green-500/10"
                : isSelected && !isCorrectLine
                ? "border-red-500 bg-red-500/10"
                : "border-transparent"
              : isSelected
              ? "border-blue-500 bg-blue-500/10 cursor-pointer"
              : "border-transparent cursor-pointer hover:bg-gray-700/50"
          }
        `;

        const highlightedLine = hljs.highlight(line, {
          language: "typescript",
          ignoreIllegals: true,
        }).value;

        return (
          <div
            key={index}
            onClick={() => !showResult && toggleLine(index)}
            className={lineClasses}
          >
            <span
              dangerouslySetInnerHTML={{
                __html: highlightedLine || "&nbsp;",
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
