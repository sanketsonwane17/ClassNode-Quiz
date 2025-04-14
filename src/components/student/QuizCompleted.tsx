
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Quiz } from "@/types/quiz";

interface QuizCompletedProps {
  quiz: Quiz;
  score: number;
}

const QuizCompleted: React.FC<QuizCompletedProps> = ({ quiz, score }) => {
  if (!quiz) return null;
  
  const scorePercentage = score / quiz.questions.length;
  const isPassing = scorePercentage >= 0.7;

  return (
    <Card className="max-w-md mx-auto border-2 border-quiz-primary/20">
      <CardHeader>
        <CardTitle>Quiz Completed!</CardTitle>
        <CardDescription>
          You scored {score} out of {quiz.questions.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center py-4">
          {isPassing ? (
            <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mb-2" />
          )}
          <div className="text-4xl font-bold mb-2">
            {Math.round(scorePercentage * 100)}%
          </div>
          <p className="text-center text-muted-foreground">
            {isPassing
              ? "Great job! You did well on this quiz."
              : "Keep practicing! You'll do better next time."}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <h3 className="font-medium">Summary:</h3>
          <div className="flex justify-between">
            <span>Correct answers:</span>
            <span className="font-medium text-green-600">{score}</span>
          </div>
          <div className="flex justify-between">
            <span>Incorrect answers:</span>
            <span className="font-medium text-red-600">{quiz.questions.length - score}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizCompleted;
