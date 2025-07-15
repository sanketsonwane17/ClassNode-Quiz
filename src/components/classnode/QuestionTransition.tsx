import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface QuestionTransitionProps {
  question: {
    id: string;
    text: string;
    options: string[];
    correct_option: number;
  };
  questionNumber: number;
  totalQuestions: number;
  timeLeft: number;
  maxTime: number;
  onAnswer: (optionIndex: number) => void;
  selectedOption: number | null;
  showResult?: boolean;
  isCorrect?: boolean;
  disabled?: boolean;
}

const QuestionTransition: React.FC<QuestionTransitionProps> = ({
  question,
  questionNumber,
  totalQuestions,
  timeLeft,
  maxTime,
  onAnswer,
  selectedOption,
  showResult = false,
  isCorrect,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [question.id]);

  const getProgressColor = () => {
    const percentage = (timeLeft / maxTime) * 100;
    if (percentage > 60) return "bg-green-500";
    if (percentage > 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getOptionStyle = (index: number) => {
    if (!showResult) {
      if (selectedOption === index) {
        return "bg-quiz-primary text-quiz-primary-foreground border-quiz-primary shadow-lg transform scale-[1.02]";
      }
      return "bg-background hover:bg-muted/50 border-border hover:border-quiz-primary/50 hover:scale-[1.01] hover:shadow-md";
    }

    if (index === question.correct_option) {
      return "bg-green-100 text-green-800 border-green-300 shadow-lg";
    }
    if (selectedOption === index && index !== question.correct_option) {
      return "bg-red-100 text-red-800 border-red-300 shadow-lg";
    }
    return "bg-muted/30 text-muted-foreground border-muted";
  };

  return (
    <div className={`
      transition-all duration-500 ease-out transform
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      <Card className="border-2 border-quiz-primary/20 shadow-lg">
        <CardContent className="p-6">
          {/* Progress Header */}
          <div className="mb-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Question {questionNumber} of {totalQuestions}
              </span>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-mono ${timeLeft <= 10 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                  {timeLeft}s
                </span>
              </div>
            </div>
            
            <Progress 
              value={(timeLeft / maxTime) * 100} 
              className="h-2"
            />
          </div>

          {/* Question */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-foreground leading-relaxed">
              {question.text}
            </h2>
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                className={`
                  h-auto p-4 text-left justify-start text-wrap
                  transition-all duration-300 ease-out
                  ${getOptionStyle(index)}
                `}
                onClick={() => !disabled && !showResult && onAnswer(index)}
                disabled={disabled || showResult}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-sm font-medium">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="flex-1">{option}</span>
                  {showResult && index === question.correct_option && (
                    <CheckCircle className="h-5 w-5 text-green-600 animate-bounce" />
                  )}
                  {showResult && selectedOption === index && index !== question.correct_option && (
                    <XCircle className="h-5 w-5 text-red-600 animate-pulse" />
                  )}
                </div>
              </Button>
            ))}
          </div>

          {/* Result Feedback */}
          {showResult && (
            <div className={`
              mt-6 p-4 rounded-lg text-center animate-fade-in
              ${isCorrect 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
              }
            `}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="h-6 w-6 animate-bounce" />
                ) : (
                  <XCircle className="h-6 w-6 animate-pulse" />
                )}
                <span className="font-semibold text-lg">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-sm">
                {isCorrect 
                  ? 'Great job! You earned points for this question.' 
                  : `The correct answer was: ${question.options[question.correct_option]}`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionTransition;