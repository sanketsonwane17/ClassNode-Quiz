import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { CheckCircle, XCircle } from "lucide-react";
import { Quiz } from "@/types/quiz";

interface QuizCompletedProps {
  quiz: Quiz;
  score: number;
}

const QuizCompleted: React.FC<QuizCompletedProps> = ({ quiz, score }) => {
  if (!quiz) return null;

  const totalQuestions = quiz.questions.length;
  const scorePercentage = score / totalQuestions;
  const isPassing = scorePercentage >= 0.7;

  return (
    <Card className="max-w-md mx-auto mt-6 border-2 border-quiz-primary/20 shadow-sm p-4">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl text-center">
          Quiz Completed!
        </CardTitle>
        <CardDescription className="text-center">
          You scored <strong>{score}</strong> out of{" "}
          <strong>{totalQuestions}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center">
          {isPassing ? (
            <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mb-2" />
          )}
          <div className="text-4xl font-bold">
            {Math.round(scorePercentage * 100)}%
          </div>
          <p className="text-center mt-2 text-muted-foreground text-sm">
            {isPassing
              ? "Great job! You did well on this quiz."
              : "Keep practicing! You'll do better next time."}
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium text-base mb-2">Summary</h3>
          <div className="flex justify-between text-sm">
            <span>✅ Correct answers:</span>
            <span className="font-semibold text-green-600">{score}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>❌ Incorrect answers:</span>
            <span className="font-semibold text-red-600">
              {totalQuestions - score}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizCompleted;
