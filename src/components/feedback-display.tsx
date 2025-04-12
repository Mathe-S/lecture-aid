"use client";

import { FC } from "react";

interface FeedbackDisplayProps {
  feedback: string;
}

interface FunctionStatus {
  name: string;
  implemented: boolean;
  points: number;
}

interface ImplementationStatus {
  functionStatus?: FunctionStatus[];
}

interface AdditionalInformation {
  implementationStatus?: ImplementationStatus;
  [key: string]: any;
}

export const FeedbackDisplay: FC<FeedbackDisplayProps> = ({ feedback }) => {
  const sections = feedback.split("\n\n");

  return (
    <div className="p-3 bg-white rounded border space-y-3">
      {sections.map((section, index) => {
        // Style similarity info differently
        if (section.startsWith("Similarity:")) {
          const similarityMatch = section.match(
            /Similarity: (\d+)% match with (.+)/
          );
          if (similarityMatch) {
            const [, percentage, email] = similarityMatch;
            const similarityPercentage = parseInt(percentage);
            // Color code based on similarity percentage
            let bgColor = "bg-green-50";
            let textColor = "text-green-700";

            if (similarityPercentage > 50) {
              bgColor = "bg-yellow-50";
              textColor = "text-yellow-700";
            }
            if (similarityPercentage > 70) {
              bgColor = "bg-red-50";
              textColor = "text-red-700";
            }

            return (
              <div
                key={index}
                className={`rounded-md ${bgColor} p-2 border border-${textColor}/20`}
              >
                <div className={`flex items-center gap-1.5 ${textColor}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5a2 2 0 0 0 2 2h1" />
                    <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1" />
                  </svg>
                  <span className="font-medium">Similarity: {percentage}%</span>
                </div>
                <div className="text-sm ml-6">match with {email}</div>
              </div>
            );
          }
        }

        // Format warnings and errors
        if (
          section.toUpperCase().includes("WARNING:") ||
          section.includes("points deducted")
        ) {
          return (
            <div
              key={index}
              className="bg-amber-50 p-2 rounded-md border border-amber-200"
            >
              <div className="flex items-start gap-1.5 text-amber-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                </svg>
                <div className="whitespace-pre-line text-sm">{section}</div>
              </div>
            </div>
          );
        }

        // Try to parse JSON in Additional Information
        if (section.startsWith("Additional Information:")) {
          try {
            // Extract JSON part
            const jsonStr = section
              .substring("Additional Information:".length)
              .trim();
            const jsonData = JSON.parse(jsonStr) as AdditionalInformation;

            return (
              <div
                key={index}
                className="bg-slate-50 p-2 rounded-md border border-slate-200"
              >
                <div className="font-medium text-sm text-slate-700 mb-2 flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  Additional Information
                </div>
                {/* Format the implementation status if present */}
                {jsonData.implementationStatus && (
                  <div className="pl-2 space-y-2 mt-1">
                    <h5 className="text-xs font-medium text-slate-600">
                      Function Status:
                    </h5>
                    <div className="grid gap-2">
                      {jsonData.implementationStatus.functionStatus?.map(
                        (fn, i) => (
                          <div
                            key={i}
                            className={`text-xs p-1.5 rounded ${
                              fn.implemented
                                ? "bg-green-50 text-green-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            <div className="font-medium">{fn.name}</div>
                            <div className="flex justify-between">
                              <span>
                                {fn.implemented
                                  ? "Implemented"
                                  : "Not implemented"}
                              </span>
                              <span>Points: {fn.points - 5}</span>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                {/* If no implementation status, show the JSON formatted */}
                {!jsonData.implementationStatus && (
                  <pre className="text-xs overflow-x-auto p-2 bg-slate-100 rounded">
                    {JSON.stringify(jsonData, null, 2)}
                  </pre>
                )}
              </div>
            );
          } catch (error) {
            console.error("Error parsing JSON:", error);
            // If JSON parsing fails, just display the text
            return (
              <div
                key={index}
                className="bg-slate-50 p-2 rounded-md border border-slate-200"
              >
                <div className="font-medium text-sm text-slate-700 mb-1">
                  Additional Information
                </div>
                <p className="whitespace-pre-line text-sm">
                  {section.substring("Additional Information:".length).trim()}
                </p>
              </div>
            );
          }
        }

        // Default case - regular feedback
        return (
          <div key={index} className="text-sm whitespace-pre-line">
            {section}
          </div>
        );
      })}
    </div>
  );
};

export default FeedbackDisplay;
