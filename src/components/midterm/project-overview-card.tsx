"use client";

import Link from "next/link";
import { Calendar, ExternalLink } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ProjectOverviewCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Overview</CardTitle>
        <CardDescription>
          Build a Flashcard Browser Extension with Hand Gesture Detection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">Requirements</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>
                Browser Extension for creating flashcards from selected text
                (Can be changed according to the group)
              </li>
              <li>
                Hand gesture detection for flashcard review (Can be changed
                according to the group)
              </li>
              <li>Well-tested code with clear specifications</li>
              <li>
                Documentation with Abstract Functions and Representation
                Invariants.
              </li>
              <li>Clean Git workflow with proper commits and PRs</li>
            </ul>
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-lg font-semibold">Grading (250 points)</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Specification (50 points):</strong> Clear descriptions
              </p>
              <p>
                <strong>Testing (50 points):</strong> Comprehensive tests
              </p>
              <p>
                <strong>Implementation (100 points):</strong> Working code
              </p>
              <p>
                <strong>Documentation (25 points):</strong> Readable code/docs
              </p>
              <p>
                <strong>Git Workflow (25 points):</strong> Meaningful
                commits/PRs
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              3 weeks (April 10 - May 1)
            </span>
          </div>
          <Link
            href="https://teams.microsoft.com/l/message/19:9p7CGZbtOZFaFMj-DSfRQ3fh66rKS3pYnxgvCemxJMQ1@thread.tacv2/1744194496683?tenantId=b5a13ba1-627c-4358-8b6f-cc09027ff3af&groupId=afe80f18-d6e8-449c-96dd-28f43aa85efa&parentMessageId=1744194496683&teamName=Introduction%20to%20Software%20Engineering%20Practical%20Course%202024-2025&channelName=General&createdTime=1744194496683"
            target="_blank"
            className="text-sm text-blue-600 hover:underline flex items-center"
          >
            <ExternalLink className="h-3 w-3 mr-1" /> View Full Assignment
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
