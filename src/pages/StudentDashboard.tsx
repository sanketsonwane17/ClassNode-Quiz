
import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
    <div className="min-h-screen bg-background">
      <StudentHeader />

      <main className="container mx-auto px-4 py-6">
        {!activeQuiz && !quizCompleted && <QuizWaiting />}

        {activeQuiz && !quizCompleted && (
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

        {quizCompleted && activeQuiz && (
          <QuizCompleted quiz={activeQuiz} score={score} />
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
