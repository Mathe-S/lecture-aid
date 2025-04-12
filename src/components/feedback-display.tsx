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
  totalPointsDeduction?: number;
  implementationSummary?: string;
}

interface ManualGradingResult {
  computeProgressScore?: number;
  overallScore?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  improvements?: string[];
  implementedFunctions?: string[];
}

interface AdditionalInformation {
  implementationStatus?: ImplementationStatus;
  manualGradingResult?: ManualGradingResult;
  status?: string;
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
                className="bg-slate-50 rounded-md border border-slate-200 overflow-hidden"
              >
                <div className="bg-slate-100 px-3 py-2 font-medium text-sm text-slate-700 flex items-center gap-1.5 border-b border-slate-200">
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
                  {jsonData.status && (
                    <span
                      className={`ml-auto inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        jsonData.status === "passed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {jsonData.status.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  {/* Implementation Status Section */}
                  {jsonData.implementationStatus && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-medium text-slate-700">
                          Implementation Status
                        </h5>
                        {jsonData.implementationStatus.totalPointsDeduction !==
                          undefined && (
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-md">
                            Points deducted:{" "}
                            {jsonData.implementationStatus.totalPointsDeduction}
                          </span>
                        )}
                      </div>

                      {jsonData.implementationStatus.implementationSummary && (
                        <div className="text-sm mb-2 text-slate-600">
                          {jsonData.implementationStatus.implementationSummary}
                        </div>
                      )}

                      {jsonData.implementationStatus.functionStatus && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          {jsonData.implementationStatus.functionStatus.map(
                            (fn, i) => (
                              <div
                                key={i}
                                className={`text-xs p-2 rounded-md flex items-center justify-between ${
                                  fn.implemented
                                    ? "bg-green-50 text-green-700 border border-green-100"
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  {fn.implemented ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <line
                                        x1="15"
                                        y1="9"
                                        x2="9"
                                        y2="15"
                                      ></line>
                                      <line
                                        x1="9"
                                        y1="9"
                                        x2="15"
                                        y2="15"
                                      ></line>
                                    </svg>
                                  )}
                                  <span className="font-medium">{fn.name}</span>
                                </div>
                                {fn.points > 0 && (
                                  <span className="text-xs font-medium">
                                    -{fn.points} pts
                                  </span>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual Grading Results Section */}
                  {jsonData.manualGradingResult && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-slate-700">
                          Manual Grading Results
                        </h5>
                        {jsonData.manualGradingResult.overallScore !==
                          undefined && (
                          <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-sm font-medium border border-blue-100">
                            Score: {jsonData.manualGradingResult.overallScore}
                          </div>
                        )}
                      </div>

                      {jsonData.manualGradingResult.feedback && (
                        <div className="bg-white p-3 rounded-md border border-slate-200 text-sm text-slate-700">
                          {jsonData.manualGradingResult.feedback}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Strengths Section */}
                        {jsonData.manualGradingResult.strengths &&
                          jsonData.manualGradingResult.strengths.length > 0 && (
                            <div className="bg-green-50 p-3 rounded-md border border-green-100">
                              <h6 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1.5">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"></path>
                                  <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                                </svg>
                                Strengths
                              </h6>
                              <ul className="text-xs text-green-700 space-y-1 pl-5 list-disc">
                                {jsonData.manualGradingResult.strengths.map(
                                  (strength, i) => (
                                    <li key={i}>{strength}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}

                        {/* Weaknesses Section */}
                        {jsonData.manualGradingResult.weaknesses &&
                          jsonData.manualGradingResult.weaknesses.length >
                            0 && (
                            <div className="bg-red-50 p-3 rounded-md border border-red-100">
                              <h6 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-1.5">
                                Areas for Improvement
                              </h6>
                              <ul className="text-xs text-red-700 space-y-1 pl-5 list-disc">
                                {jsonData.manualGradingResult.weaknesses.map(
                                  (weakness, i) => (
                                    <li key={i}>{weakness}</li>
                                  )
                                )}
                              </ul>
                            </div>
                          )}
                      </div>

                      {/* Detailed Improvements Section */}
                      {jsonData.manualGradingResult.improvements &&
                        jsonData.manualGradingResult.improvements.length >
                          0 && (
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                            <h6 className="text-sm font-medium text-blue-800 mb-2 flex items-center gap-1.5">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 20h9"></path>
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                              </svg>
                              Suggestions for Improvement
                            </h6>
                            <div className="space-y-2">
                              {jsonData.manualGradingResult.improvements.map(
                                (improvement, i) => {
                                  // Attempt to extract function name from the improvement text
                                  let functionName = "";
                                  let details = improvement;

                                  // Try to extract function name if it's at the beginning followed by a dash
                                  const functionMatch = improvement.match(
                                    /^([a-zA-Z0-9_]+)\s*-\s*(.+)$/
                                  );
                                  if (functionMatch) {
                                    functionName = functionMatch[1];
                                    details = functionMatch[2];
                                  }

                                  return (
                                    <div
                                      key={i}
                                      className="text-xs text-blue-700 bg-white rounded-md p-2 border border-blue-100"
                                    >
                                      {functionName && (
                                        <span className="font-medium inline-block mb-1 bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">
                                          {functionName}
                                        </span>
                                      )}
                                      <div
                                        className={functionName ? "ml-0.5" : ""}
                                      >
                                        {details}
                                      </div>
                                    </div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* If no implementation status or manual grading result, show the JSON formatted */}
                  {!jsonData.implementationStatus &&
                    !jsonData.manualGradingResult && (
                      <pre className="text-xs overflow-x-auto p-2 bg-slate-100 rounded">
                        {JSON.stringify(jsonData, null, 2)}
                      </pre>
                    )}
                </div>
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
