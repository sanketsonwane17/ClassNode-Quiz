
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  if (!quiz) {
    console.log("ActiveQuizQuestion: No quiz data provided");
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <Card className="border-2 border-destructive/20">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Quiz data not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!quiz.questions || quiz.questions.length === 0) {
    console.log("ActiveQuizQuestion: No questions in quiz");
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <Card className="border-2 border-destructive/20">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">No questions available in this quiz</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!quiz.questions[currentQuestion]) {
    console.log("ActiveQuizQuestion: Current question not found", { currentQuestion, totalQuestions: quiz.questions.length });
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <Card className="border-2 border-destructive/20">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">Question not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const currentQ = quiz.questions[currentQuestion];
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mb-4 sm:mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs sm:text-sm font-medium text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </div>
          <div className="flex items-center text-orange-500">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="text-sm sm:text-base font-medium">{timeLeft}s</span>
          </div>
        </div>
        <Progress value={(currentQuestion + 1) / quiz.questions.length * 100} className="h-2" />
      </div>
      
      <Card className="border-2 border-quiz-primary/20 mb-4 sm:mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg sm:text-xl leading-tight">
            {currentQ.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <RadioGroup
            value={selectedOption?.toString() || ""}
            onValueChange={(value) => onAnswer(parseInt(value))}
            className="space-y-2 sm:space-y-3"
          >
            {currentQ.options && currentQ.options.length > 0 ? currentQ.options.map((option, index) => (
              <div 
                key={index}
                className="flex items-start space-x-3 border p-3 sm:p-4 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                onClick={() => onAnswer(index)}
              >
                <RadioGroupItem 
                  value={index.toString()} 
                  id={`option-${index}`} 
                  className="mt-0.5 flex-shrink-0"
                />
                <Label 
                  htmlFor={`option-${index}`} 
                  className="flex-1 cursor-pointer text-sm sm:text-base leading-relaxed"
                >
                  {option}
                </Label>
              </div>
            )) : (
              <div className="text-center py-4">
                <p className="text-destructive">No options available for this question</p>
              </div>
            )}
          </RadioGroup>
        </CardContent>
        <CardFooter className="pt-4">
          <Button 
            className="w-full quiz-gradient mobile-button"
            onClick={onNextQuestion}
            disabled={isSubmitting}
            size="lg"
          >
            {isSubmitting ? "Submitting..." : 
              isLastQuestion ? "Finish Quiz" : "Next Question"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ActiveQuizQuestion;
