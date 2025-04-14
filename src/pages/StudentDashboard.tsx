
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import StudentHeader from "@/components/student/StudentHeader";
import QuizWaiting from "@/components/student/QuizWaiting";
import ActiveQuizQuestion from "@/components/student/ActiveQuizQuestion";
import QuizCompleted from "@/components/student/QuizCompleted";
import useStudentQuiz from "@/hooks/useStudentQuiz";

const StudentDashboard = () => {
  const { user } = useAuth();
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

  if (!user || user.role !== "student") {
    return null;
  }

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
