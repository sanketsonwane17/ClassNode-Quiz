
import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/quiz";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { PlusCircle, LogOut, Play, List, BarChart2 } from "lucide-react";
import CreateQuizModal from "@/components/CreateQuizModal";
import QuizList from "@/components/QuizList";
import ActiveQuiz from "@/components/ActiveQuiz";
import QuizResults from "@/components/QuizResults";

const TeacherDashboard = () => {
  const { user, logout, roomCode } = useAuth();
  const { quizzes, activeQuiz, launchQuiz, endQuiz, studentAnswers, results } = useQuiz();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();

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

  // Display room code from active quiz to ensure consistency
  const displayRoomCode = activeQuiz?.roomCode || roomCode;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              <span className="text-quiz-primary">Class</span>
              <span className="text-quiz-secondary">Node</span>
            </h1>
            <span className="text-sm bg-gray-100 px-2 py-1 rounded-md">Teacher</span>
          </div>
          <div className="flex items-center gap-4">
            {displayRoomCode && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Room Code:</span>
                <span className="font-mono font-bold text-md bg-quiz-primary/10 text-quiz-primary px-2 py-1 rounded-md">
                  {displayRoomCode}
                </span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.name}</h2>
          <p className="text-muted-foreground">
            {activeQuiz 
              ? "You have an active quiz running."
              : "Create or launch a quiz to get started with your students."}
          </p>
        </div>

        <Tabs defaultValue={activeQuiz ? "active" : "quizzes"}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="quizzes" disabled={!!activeQuiz}>
                <List className="h-4 w-4 mr-1" />
                My Quizzes
              </TabsTrigger>
              <TabsTrigger value="active" disabled={!activeQuiz}>
                <Play className="h-4 w-4 mr-1" />
                Active Quiz
              </TabsTrigger>
              <TabsTrigger value="results">
                <BarChart2 className="h-4 w-4 mr-1" />
                Results
              </TabsTrigger>
            </TabsList>
            
            {!activeQuiz && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="quiz-gradient"
              >
                <PlusCircle className="h-4 w-4 mr-1" />
                Create Quiz
              </Button>
            )}
          </div>

          <TabsContent value="quizzes">
            <QuizList 
              quizzes={teacherQuizzes} 
              onLaunch={launchQuiz} 
              isLaunchDisabled={!!activeQuiz} 
            />
          </TabsContent>

          <TabsContent value="active">
            {activeQuiz && (
              <ActiveQuiz 
                quiz={activeQuiz} 
                studentAnswers={studentAnswers}
                onEndQuiz={endQuiz}
              />
            )}
          </TabsContent>

          <TabsContent value="results">
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
