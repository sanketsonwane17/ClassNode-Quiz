
import React, { useState, useEffect } from "react";
import { QuizContextType, Quiz, QuizResult, StudentAnswer } from "@/types/quiz";
import { QuizContext } from "./quizContext";
import { useAuth } from "@/contexts/AuthContext";
import { 
  fetchQuizzes, 
  fetchResults, 
  createQuiz as createQuizService, 
  deleteQuiz as deleteQuizService,
  launchQuiz as launchQuizService,
  endQuiz as endQuizService,
  submitAnswer as submitAnswerService,
  submitQuizResult as submitQuizResultService
} from "@/services/quizService";

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user, roomCode, setRoomCode } = useAuth();

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadQuizzes();
      loadResults();
    }
  }, [user]);

  // Poll for new student answers when there's an active quiz
  useEffect(() => {
    if (!activeQuiz) return;
    
    const pollInterval = setInterval(() => {
      // This could be replaced with a real-time subscription if available
      console.log("Polling for new student answers...");
      // This would be the place to fetch the latest student answers for the active quiz
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [activeQuiz]);

  const loadQuizzes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const quizzesData = await fetchQuizzes(user.id);
      setQuizzes(quizzesData);
      
      const activeQuiz = quizzesData.find(quiz => quiz.isActive);
      if (activeQuiz) {
        setActiveQuiz(activeQuiz);
        setRoomCode(activeQuiz.roomCode || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadResults = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const resultsData = await fetchResults();
      setResults(resultsData);
    } finally {
      setLoading(false);
    }
  };

  const createQuiz = async (quizData: Omit<Quiz, "id" | "createdAt" | "createdBy">) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const newQuiz = await createQuizService(quizData, user.id);
      if (newQuiz) {
        setQuizzes(prev => [...prev, newQuiz]);
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    setLoading(true);
    try {
      const success = await deleteQuizService(quizId);
      if (success) {
        setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id !== quizId));
      }
    } finally {
      setLoading(false);
    }
  };

  const launchQuiz = async (quizId: string) => {
    const quizToLaunch = quizzes.find((quiz) => quiz.id === quizId);
    if (!quizToLaunch) return;
    
    setLoading(true);
    try {
      const success = await launchQuizService(quizId);
      if (success) {
        setRoomCode(quizToLaunch.roomCode || null);
        setActiveQuiz(quizToLaunch);
        setCurrentQuestion(0);
        setStudentAnswers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const endQuiz = async () => {
    if (!activeQuiz) return;
    
    setLoading(true);
    try {
      const success = await endQuizService(activeQuiz.id);
      if (success) {
        setActiveQuiz(null);
        setCurrentQuestion(0);
        // Re-fetch the results to update the teacher's dashboard
        loadResults();
      }
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (answer: Omit<StudentAnswer, "correct">): Promise<boolean> => {
    try {
      const isCorrect = await submitAnswerService(answer);
      
      const fullAnswer: StudentAnswer = {
        ...answer,
        correct: isCorrect
      };
      
      // Add the new answer to our local state to update UI immediately
      setStudentAnswers(prev => [...prev, fullAnswer]);
      console.log("Added new student answer to state:", fullAnswer);
      return isCorrect;
    } catch (error) {
      console.error("Error in submitAnswer:", error);
      return false;
    }
  };

  const submitQuizResult = async (result: QuizResult): Promise<void> => {
    try {
      const updatedResult = await submitQuizResultService(result);
      // Add the result to the results array to update UI immediately
      setResults(prev => [...prev, updatedResult]);
    } catch (error) {
      console.error("Error in submitQuizResult:", error);
      throw error;
    }
  };

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        createQuiz,
        deleteQuiz,
        activeQuiz,
        launchQuiz,
        endQuiz,
        currentQuestion,
        setCurrentQuestion,
        submitAnswer,
        studentAnswers,
        results,
        submitQuizResult,
        loading
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
