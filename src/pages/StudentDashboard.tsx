
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import StudentHeader from "@/components/student/StudentHeader";
import QuizWaiting from "@/components/student/QuizWaiting";
import ActiveQuizQuestion from "@/components/student/ActiveQuizQuestion";
import QuizCompleted from "@/components/student/QuizCompleted";
import useStudentQuiz from "@/hooks/useStudentQuiz";
import { useNavigate } from "react-router-dom";

const StudentDashboard = () => {
  const { user, roomCode } = useAuth();
  const navigate = useNavigate();
  const {
    activeQuiz,
    currentQuestion,
    selectedOption,
    timeLeft,
    quizCompleted,
    score,
    isSubmitting,
    loading,
    error,
    handleAnswer,
    handleNextQuestion
  } = useStudentQuiz();

  // Redirect if not authenticated or not a student
  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/");
      return;
    }
    
    if (!roomCode) {
      navigate("/join");
      return;
    }
  }, [user, roomCode, navigate]);

  if (!user || user.role !== "student") {
    return null;
  }

  console.log("Student Dashboard - Active Quiz:", activeQuiz);
  console.log("Student Dashboard - Room Code:", roomCode);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <StudentHeader />

      <main className="container mx-auto py-4 sm:py-6 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-full">
          {error && (
            <div className="mobile-card">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          )}

          {loading && !error && (
            <div className="mobile-card">
              <div className="text-center py-8">
                <p className="text-muted-foreground">Waiting for quiz to start...</p>
              </div>
            </div>
          )}

          {!activeQuiz && !quizCompleted && !loading && !error && (
            <div className="mobile-card">
              <QuizWaiting />
            </div>
          )}

          {activeQuiz && !quizCompleted && !error && (
            <ActiveQuizQuestion
              quiz={activeQuiz}
              currentQuestion={currentQuestion}
              timeLeft={timeLeft}
              isSubmitting={isSubmitting}
              onAnswer={handleAnswer}
              onNextQuestion={handleNextQuestion}
              selectedOption={selectedOption}
            />
          )}

          {quizCompleted && activeQuiz && !error && (
            <div className="mobile-card">
              <QuizCompleted quiz={activeQuiz} score={score} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;