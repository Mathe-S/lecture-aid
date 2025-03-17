"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Chat component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <h3 className="mb-2 text-lg font-medium">
            Something went wrong in the chat
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <Button
            onClick={() => this.setState({ hasError: false })}
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
