import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/quiz";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { PlusCircle, LogOut, Play, List, BarChart2, Menu } from "lucide-react";
import CreateQuizModal from "@/components/CreateQuizModal";
import QuizList from "@/components/QuizList";
import ActiveQuiz from "@/components/ActiveQuiz";
import QuizResults from "@/components/QuizResults";
import ClassnodeQuizDashboard from "@/components/classnode/ClassnodeQuizDashboard";
import ClassnodePreLaunchDashboard from "@/components/classnode/ClassnodePreLaunchDashboard";
import DarkModeSwitch from "@/components/ui/dark-mode-switch";
import { supabase } from "@/integrations/supabase/client";

const TeacherDashboard = () => {
  const { user, logout, roomCode } = useAuth();
  const { quizzes, activeQuiz, launchQuiz, endQuiz, studentAnswers, results } = useQuiz();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [quizSession, setQuizSession] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();

  // Check quiz session state for Classnode quizzes
  React.useEffect(() => {
    const checkSessionState = async () => {
      if (!activeQuiz || activeQuiz.quizType !== 'classnode') {
        setIsCheckingSession(false);
        return;
      }

      const { data: sessionData } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("quiz_id", activeQuiz.id)
        .single();

      if (sessionData) {
        const session = {
          id: sessionData.id,
          quizId: sessionData.quiz_id,
          sessionState: sessionData.session_state,
          launchedAt: sessionData.launched_at,
          currentQuestion: sessionData.current_question,
          questionStartTime: sessionData.question_start_time,
          createdAt: sessionData.created_at,
          updatedAt: sessionData.updated_at
        };
        setQuizSession(session);
      }
      setIsCheckingSession(false);
    };

    checkSessionState();
  }, [activeQuiz]);

  const handleLaunchClassnodeQuiz = () => {
    // Refresh session state
    setIsCheckingSession(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Filter quizzes to only show those created by the current teacher
  const teacherQuizzes = useMemo(() => {
    if (!user) return [];
    return quizzes.filter(quiz => quiz.createdBy === user.id);
  }, [quizzes, user]);
  
  // Filter results to only show those for the teacher's quizzes
  const teacherResults = useMemo(() => {
    if (!user) return [];
    const teacherQuizIds = teacherQuizzes.map(quiz => quiz.id);
    return results.filter(result => teacherQuizIds.includes(result.quizId));
  }, [results, teacherQuizzes]);

  // Redirect if not logged in as teacher
  React.useEffect(() => {
    if (!user || user.role !== "teacher") {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user || user.role !== "teacher") {
    return null;
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quiz-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Display room code from active quiz to ensure consistency
  const displayRoomCode = activeQuiz?.roomCode || roomCode;

  // Show pre-launch dashboard for Classnode quizzes that haven't launched yet
  const showPreLaunchDashboard = activeQuiz?.quizType === 'classnode' && 
    (!quizSession || (quizSession.sessionState === 'created' || quizSession.sessionState === 'pre-launch'));

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">
              <span className="text-quiz-primary">Quiz</span>
              <span className="text-quiz-secondary">Flow</span>
            </h1>
            <span className="text-xs sm:text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md transition-colors duration-300">Teacher</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <DarkModeSwitch />
            
            {displayRoomCode && (
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Room Code:</span>
                <span className="font-mono font-bold text-sm bg-quiz-primary/10 dark:bg-quiz-primary/20 text-quiz-primary px-2 py-1 rounded-md transition-colors duration-300">
                  {displayRoomCode}
                </span>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
            >
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Welcome, {user.name}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {activeQuiz 
              ? "You have an active quiz running."
              : "Create or launch a quiz to get started with your students."}
          </p>
        </div>

        <Tabs defaultValue={activeQuiz ? "active" : "quizzes"} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="quizzes" disabled={!!activeQuiz} className="text-xs sm:text-sm">
                <List className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">My Quizzes</span>
                <span className="sm:hidden">Quizzes</span>
              </TabsTrigger>
              <TabsTrigger value="active" disabled={!activeQuiz} className="text-xs sm:text-sm">
                <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Active Quiz</span>
                <span className="sm:hidden">Active</span>
              </TabsTrigger>
              <TabsTrigger value="results" className="text-xs sm:text-sm">
                <BarChart2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Results</span>
                <span className="sm:hidden">Results</span>
              </TabsTrigger>
            </TabsList>
            
            {!activeQuiz && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="quiz-gradient w-full sm:w-auto mobile-button"
                size="lg"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Quiz
              </Button>
            )}
          </div>

          <TabsContent value="quizzes" className="mt-4">
            <QuizList 
              quizzes={teacherQuizzes} 
              onLaunch={launchQuiz} 
              isLaunchDisabled={!!activeQuiz} 
            />
          </TabsContent>

          <TabsContent value="active" className="mt-4">
            {activeQuiz && (
              <>
                {showPreLaunchDashboard ? (
                  <ClassnodePreLaunchDashboard 
                    quiz={activeQuiz} 
                    onLaunchQuiz={handleLaunchClassnodeQuiz}
                  />
                ) : activeQuiz.quizType === 'classnode' ? (
                  <ClassnodeQuizDashboard 
                    quiz={activeQuiz} 
                    onEndQuiz={endQuiz}
                  />
                ) : (
                  <ActiveQuiz 
                    quiz={activeQuiz} 
                    studentAnswers={studentAnswers}
                    onEndQuiz={endQuiz}
                  />
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            <QuizResults results={teacherResults} quizzes={teacherQuizzes} />
          </TabsContent>
        </Tabs>
      </main>

      <CreateQuizModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
};

export default TeacherDashboard;
