import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Clock } from "lucide-react";
import { Quiz } from "@/types/quiz";

interface ActiveQuizQuestionProps {
  quiz: Quiz;
  currentQuestion: number;
  timeLeft: number;
  isSubmitting: boolean;
  onAnswer: (optionIndex: number) => void;
  onNextQuestion: () => void;
  selectedOption: number | null;
}

const ActiveQuizQuestion: React.FC<ActiveQuizQuestionProps> = ({
  quiz,
  currentQuestion,
  timeLeft,
  isSubmitting,
  onAnswer,
  onNextQuestion,
  selectedOption,
}) => {
  if (!quiz) return null;

  const currentQ = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-0">
      {/* Top Bar */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 gap-2 sm:gap-0">
          <div className="text-sm font-medium text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </div>
          <div className="flex items-center text-orange-500 text-sm">
            <Clock className="h-4 w-4 mr-1" />
            <span>{timeLeft}s</span>
          </div>
        </div>
        <Progress
          value={((currentQuestion + 1) / quiz.questions.length) * 100}
          className="h-2"
        />
      </div>

      {/* Question Card */}
      <Card className="border-2 border-quiz-primary/20 mb-6 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            {currentQ.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <RadioGroup
            value={selectedOption?.toString() || ""}
            onValueChange={(value) => onAnswer(parseInt(value))}
            className="space-y-3"
          >
            {currentQ.options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 border p-3 rounded-md hover:bg-muted transition-colors"
              >
                <RadioGroupItem
                  value={index.toString()}
                  id={`option-${index}`}
                />
                <Label
                  htmlFor={`option-${index}`}
                  className="flex-1 text-sm sm:text-base cursor-pointer"
                >
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full quiz-gradient"
            onClick={onNextQuestion}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Submitting..."
              : isLastQuestion
              ? "Finish Quiz"
              : "Next Question"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ActiveQuizQuestion;
