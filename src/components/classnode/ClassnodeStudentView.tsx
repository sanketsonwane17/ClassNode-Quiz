import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Trophy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Quiz } from "@/types/quiz";
import { toast } from "sonner";
import QuestionTransition from "./QuestionTransition";
import AnimatedLeaderboard from "./AnimatedLeaderboard";
import ParticleEffects from "./ParticleEffects";

interface ClassnodeStudentViewProps {
  quiz: Quiz;
}

const ClassnodeStudentView: React.FC<ClassnodeStudentViewProps> = ({ quiz }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.timePerQuestion || 30);
  const [showResults, setShowResults] = useState(false);
  const [studentRankings, setStudentRankings] = useState<any[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [showParticles, setShowParticles] = useState(false);
  const [isCorrectAnswer, setIsCorrectAnswer] = useState(false);
  const [questionTransitionKey, setQuestionTransitionKey] = useState(0);

  const currentQuestionData = quiz.questions[currentQuestion];
  const studentId = localStorage.getItem("studentId");

  // Monitor quiz session state for teacher-controlled progression
  useEffect(() => {
    const checkSessionState = async () => {
      const { data: sessionData } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .single();

      if (sessionData) {
        // Check if question has changed
        if (sessionData.current_question !== currentQuestion) {
          setCurrentQuestion(sessionData.current_question);
          setSelectedOption(null);
          setHasAnswered(false);
          setTimeLeft(quiz.timePerQuestion || 30);
          setShowResults(false);
          setQuestionTransitionKey(prev => prev + 1);
        }

        // Update timer based on question start time
        if (sessionData.question_start_time) {
          const elapsed = Math.floor(
            (Date.now() - new Date(sessionData.question_start_time).getTime()) / 1000
          );
          const remaining = Math.max(0, (quiz.timePerQuestion || 30) - elapsed);
          setTimeLeft(remaining);
        }
      }
    };

    checkSessionState();

    // Set up real-time subscription
    const channel = supabase
      .channel('quiz-session-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `quiz_id=eq.${quiz.id}`
        },
        (payload) => {
          const updatedSession = payload.new as any;
          if (updatedSession.current_question !== currentQuestion) {
            setCurrentQuestion(updatedSession.current_question);
            setSelectedOption(null);
            setHasAnswered(false);
            setTimeLeft(quiz.timePerQuestion || 30);
            setShowResults(false);
            setQuestionTransitionKey(prev => prev + 1);
          }

          if (updatedSession.question_start_time) {
            const elapsed = Math.floor(
              (Date.now() - new Date(updatedSession.question_start_time).getTime()) / 1000
            );
            const remaining = Math.max(0, (quiz.timePerQuestion || 30) - elapsed);
            setTimeLeft(remaining);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quiz.id, currentQuestion]);

  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0 || hasAnswered) return;

    const timer = setTimeout(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, hasAnswered]);

  const handleAnswer = async (optionIndex: number) => {
    if (hasAnswered || !studentId) return;

    setSelectedOption(optionIndex);
    setHasAnswered(true);

    try {
      const isCorrect = optionIndex === currentQuestionData.correctOption;
      console.log(`DEBUG: Selected option ${optionIndex}, Correct option: ${currentQuestionData.correctOption}, Is correct: ${isCorrect}`);
      
      // Additional validation
      console.log('DEBUG: Current question data:', {
        id: currentQuestionData.id,
        text: currentQuestionData.text,
        correctOption: currentQuestionData.correctOption,
        options: currentQuestionData.options
      });
      
      setIsCorrectAnswer(isCorrect);
      
      if (isCorrect) {
        const newScore = myScore + 100; // Simple scoring
        setMyScore(newScore);
        setShowParticles(true);
        setTimeout(() => setShowParticles(false), 2000);
        toast.success("Correct answer! +100 points");
      } else {
        toast.error("Incorrect answer");
      }

      // Submit answer to database
      const answerData = {
        id: crypto.randomUUID(),
        student_id: studentId,
        quiz_id: quiz.id,
        question_id: currentQuestionData.id,
        selected_option: optionIndex,
        time_spent: (quiz.timePerQuestion || 30) - timeLeft,
        is_correct: isCorrect,
        points: isCorrect ? 100 : 0
      };
      
      console.log('DEBUG: Submitting answer data:', answerData);
      
      await supabase.from("student_answers").insert(answerData);

      // Update rankings (simplified)
      const updatedRankings = [...studentRankings];
      const myIndex = updatedRankings.findIndex(r => r.id === studentId);
      if (myIndex >= 0) {
        updatedRankings[myIndex].score += isCorrect ? 100 : 0;
      } else {
        updatedRankings.push({
          id: studentId,
          name: "You",
          score: isCorrect ? 100 : 0,
          isCurrentUser: true
        });
      }
      updatedRankings.sort((a, b) => b.score - a.score);
      setStudentRankings(updatedRankings);

    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer");
      setHasAnswered(false);
    }
  };

  if (!currentQuestionData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-quiz-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading next question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <ParticleEffects 
        trigger={showParticles} 
        type={isCorrectAnswer ? "success" : "celebration"} 
      />
      
      {/* Header */}
      <Card className="bg-gradient-to-r from-quiz-primary/5 to-quiz-secondary/5 border-quiz-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-quiz-primary to-quiz-secondary bg-clip-text text-transparent">
                {quiz.title}
              </CardTitle>
              <p className="text-muted-foreground">{quiz.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="default" className="text-lg px-3 py-1 quiz-gradient">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </Badge>
              <div className="text-center">
                <div className="text-2xl font-bold text-quiz-primary animate-pulse">{myScore}</div>
                <div className="text-sm text-muted-foreground">Your Score</div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Question with Smooth Transitions */}
      {currentQuestionData && (
        <QuestionTransition
          key={questionTransitionKey}
          question={{
            ...currentQuestionData,
            correct_option: currentQuestionData.correctOption
          }}
          questionNumber={currentQuestion + 1}
          totalQuestions={quiz.questions.length}
          timeLeft={timeLeft}
          maxTime={quiz.timePerQuestion || 30}
          onAnswer={handleAnswer}
          selectedOption={selectedOption}
          showResult={hasAnswered}
          isCorrect={hasAnswered ? selectedOption === currentQuestionData.correctOption : undefined}
          disabled={hasAnswered}
        />
      )}

      {/* Waiting Message */}
      {hasAnswered && (
        <Card className="animate-fade-in">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-pulse">
                <Clock className="h-12 w-12 mx-auto mb-4 text-quiz-primary" />
                <h3 className="text-lg font-semibold mb-2">Answer Submitted!</h3>
                <p className="text-muted-foreground">
                  Waiting for the teacher to advance to the next question...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Animated Rankings */}
      {studentRankings.length > 0 && (
        <AnimatedLeaderboard
          rankings={studentRankings.map((student, index) => ({
            id: student.id,
            name: student.name,
            score: student.score,
            position: index + 1,
            isCurrentUser: student.isCurrentUser
          }))}
          title="Live Rankings"
        />
      )}
    </div>
  );
};

export default ClassnodeStudentView;