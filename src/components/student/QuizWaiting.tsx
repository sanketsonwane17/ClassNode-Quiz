
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const QuizWaiting: React.FC = () => {
  return (
    <Card className="max-w-md mx-auto border-2 border-quiz-primary/20">
      <CardHeader>
        <CardTitle>Waiting for quiz...</CardTitle>
        <CardDescription>
          Your teacher has not launched a quiz yet. Please wait.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center py-8">
        <div className="animate-pulse text-quiz-primary">
          <svg
            className="w-16 h-16 animate-bounce"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l4-4 4 4m0 6l-4 4-4-4"
            />
          </svg>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizWaiting;
