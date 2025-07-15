import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/quiz";
import StudentHeader from "@/components/student/StudentHeader";
import QuizWaiting from "@/components/student/QuizWaiting";
import ActiveQuizQuestion from "@/components/student/ActiveQuizQuestion";
import QuizCompleted from "@/components/student/QuizCompleted";
import ClassnodeStudentView from "@/components/classnode/ClassnodeStudentView";
import ClassnodeWaitingRoom from "@/components/classnode/ClassnodeWaitingRoom";
import useStudentQuiz from "@/hooks/useStudentQuiz";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const StudentDashboard = () => {
  const { user, roomCode } = useAuth();
  const { activeQuiz } = useQuiz();
  const navigate = useNavigate();
  const [quizSession, setQuizSession] = React.useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [classnodeQuiz, setClassnodeQuiz] = React.useState<any>(null);
  const [fullClassnodeQuiz, setFullClassnodeQuiz] = React.useState<any>(null);
  
  // Only use traditional quiz hook for non-Classnode quizzes
  const {
    currentQuestion,
    selectedOption,
    timeLeft,
    quizCompleted,
    score,
    isSubmitting,
    handleAnswer,
    handleNextQuestion
  } = useStudentQuiz();

  // Check for Classnode quiz and load session state
  React.useEffect(() => {
    const checkClassnodeQuiz = async () => {
      // Check if this is a Classnode quiz from sessionStorage
      const storedClassnodeQuiz = sessionStorage.getItem('classnodeQuiz');
      if (storedClassnodeQuiz) {
        const parsedQuiz = JSON.parse(storedClassnodeQuiz);
        setClassnodeQuiz(parsedQuiz);

        // Fetch full quiz details
        const { data: quizData } = await supabase
          .from("quizzes")
          .select(`
            *,
            quiz_questions (
              id,
              text,
              options,
              correct_option,
              order_num
            )
          `)
          .eq("id", parsedQuiz.id)
          .single();

        if (quizData) {
          const fullQuiz = {
            ...quizData,
            questions: quizData.quiz_questions.sort((a: any, b: any) => a.order_num - b.order_num)
          };
          setFullClassnodeQuiz(fullQuiz);
        }

        // Check session state
        const { data: sessionData } = await supabase
          .from("quiz_sessions")
          .select("*")
          .eq("quiz_id", parsedQuiz.id)
          .single();

        if (sessionData) {
          setQuizSession(sessionData);
        }
      }

      setIsCheckingSession(false);
    };

    checkClassnodeQuiz();
  }, []);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState("");

  const handleQuizLaunched = () => {
    // Add smooth transition when quiz launches
    setIsTransitioning(true);
    setTransitionMessage("Quiz is starting...");
    
    setTimeout(() => {
      setTransitionMessage("Loading questions...");
    }, 1000);
    
    setTimeout(() => {
      setIsTransitioning(false);
      window.location.reload();
    }, 2000);
  };

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

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quiz-primary mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // Determine what to show based on quiz type and state
  const isClassnodeQuiz = !!classnodeQuiz;
  const showClassnodeWaitingRoom = isClassnodeQuiz && (!quizSession || quizSession.session_state !== 'active') && !isTransitioning;
  const showClassnodeActiveQuiz = isClassnodeQuiz && quizSession?.session_state === 'active' && fullClassnodeQuiz && !isTransitioning;
  const showTransition = isTransitioning;

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <StudentHeader />

      <main className="container mx-auto py-4 sm:py-6 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="w-full">
          {/* Transition Screen */}
          {showTransition && (
            <div className="mobile-card">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center animate-fade-in">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-quiz-primary/20 border-t-quiz-primary mx-auto mb-6"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-quiz-primary rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-quiz-primary to-quiz-secondary bg-clip-text text-transparent">
                    {transitionMessage}
                  </h3>
                  <p className="text-muted-foreground animate-pulse">
                    Please wait while we prepare your quiz...
                  </p>
                  <div className="mt-6 w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-quiz-primary to-quiz-secondary h-2 rounded-full animate-pulse" 
                         style={{ width: '60%', animation: 'pulse 1.5s ease-in-out infinite' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Classnode Quiz Waiting Room */}
          {showClassnodeWaitingRoom && (
            <div className="mobile-card animate-fade-in">
              <ClassnodeWaitingRoom 
                quiz={classnodeQuiz} 
                onQuizLaunched={handleQuizLaunched}
              />
            </div>
          )}

          {/* Classnode Quiz Active */}
          {showClassnodeActiveQuiz && (
            <div className="animate-scale-in">
              <ClassnodeStudentView quiz={fullClassnodeQuiz} />
            </div>
          )}

          {/* Traditional Quiz Flow */}
          {!isClassnodeQuiz && (
            <>
              {!activeQuiz && !quizCompleted && (
                <div className="mobile-card">
                  <QuizWaiting />
                </div>
              )}

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
                <div className="mobile-card">
                  <QuizCompleted quiz={activeQuiz} score={score} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;
