
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useQuiz } from "@/contexts/quiz"; 
import { StudentAnswer, QuizResult } from "@/types/quiz";

export const useStudentQuiz = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    activeQuiz, 
    currentQuestion, 
    setCurrentQuestion, 
    submitAnswer, 
    submitQuizResult
  } = useQuiz();
  
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [answers, setAnswers] = useState<StudentAnswer[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect non-students
  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/");
    }
  }, [user, navigate]);

  // Initialize quiz state when active quiz changes
  useEffect(() => {
    console.log("Student Quiz - Active quiz changed:", activeQuiz);
    if (activeQuiz) {
      // Validate quiz data before initialization
      if (!activeQuiz.questions || activeQuiz.questions.length === 0) {
        console.error("Active quiz has no questions:", activeQuiz);
        setError("Quiz has no questions available");
        return;
      }
      
      if (!activeQuiz.timePerQuestion || activeQuiz.timePerQuestion <= 0) {
        console.error("Invalid time per question:", activeQuiz.timePerQuestion);
        setError("Invalid quiz timing configuration");
        return;
      }
      
      setError(null);
      setSelectedOption(null);
      setCurrentQuestion(0);
      setQuestionStartTime(Date.now());
      setTimeLeft(activeQuiz.timePerQuestion);
      setAnswers([]);
      setQuizCompleted(false);
      setScore(0);
      setLoading(false);
      console.log("Student quiz initialized successfully");
    } else {
      setLoading(true);
    }
  }, [activeQuiz, setCurrentQuestion]);

  // Timer for quiz questions
  useEffect(() => {
    if (!activeQuiz || quizCompleted || error) return;

    // Validate current question exists
    if (!activeQuiz.questions || !activeQuiz.questions[currentQuestion]) {
      console.error("Current question not found:", { currentQuestion, totalQuestions: activeQuiz.questions?.length });
      setError("Question not found");
      return;
    }

    const timer = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - questionStartTime) / 1000);
      const remaining = Math.max(0, activeQuiz.timePerQuestion - elapsedSeconds);
      
      setTimeLeft(remaining);
      
      if (remaining === 0 && !quizCompleted && !isSubmitting) {
        handleNextQuestion();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuiz, questionStartTime, currentQuestion, quizCompleted, isSubmitting, error]);

  const handleAnswer = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = async () => {
    if (!activeQuiz || !user || isSubmitting) {
      console.log("Cannot proceed with question:", { activeQuiz: !!activeQuiz, user: !!user, isSubmitting });
      return;
    }
    
    // Validate current question exists
    if (!activeQuiz.questions || !activeQuiz.questions[currentQuestion]) {
      console.error("Current question not found during submission:", { currentQuestion, totalQuestions: activeQuiz.questions?.length });
      setError("Question not found during submission");
      toast.error("Unable to submit answer - question not found");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    const currentQ = activeQuiz.questions[currentQuestion];
    console.log("Submitting answer for question:", currentQ.id);
    
    const timeSpent = Math.min(
      activeQuiz.timePerQuestion,
      Math.floor((Date.now() - questionStartTime) / 1000)
    );
    
    const answer: Omit<StudentAnswer, "correct"> = {
      studentId: user.id,
      studentName: user.name,
      quizId: activeQuiz.id,
      questionId: currentQ.id,
      selectedOption: selectedOption !== null ? selectedOption : -1,
      timeSpent
    };
    
    try {
      console.log("Submitting answer:", answer);
      const isCorrect = await submitAnswer(answer);
      
      const fullAnswer: StudentAnswer = {
        ...answer,
        correct: isCorrect
      };
      
      setAnswers(prev => [...prev, fullAnswer]);
      
      if (isCorrect) {
        setScore(prev => prev + 1);
      }
      
      if (currentQuestion < activeQuiz.questions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedOption(null);
        setQuestionStartTime(Date.now());
        console.log("Moving to next question:", currentQuestion + 1);
      } else {
        console.log("Quiz completed, submitting final result");
        await finishQuiz(fullAnswer);
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setError("Failed to submit answer");
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishQuiz = async (lastAnswer: StudentAnswer) => {
    if (!activeQuiz || !user) return;
    
    const allAnswers = [...answers, lastAnswer];
    
    const result: QuizResult = {
      studentId: user.id,
      studentName: user.name,
      quizId: activeQuiz.id,
      score: allAnswers.filter(a => a.correct).length,
      totalQuestions: activeQuiz.questions.length,
      answers: allAnswers
    };
    
    try {
      console.log("Finishing quiz with result:", result);
      await submitQuizResult(result);
      setQuizCompleted(true);
      toast.success("Quiz completed successfully!");
    } catch (error) {
      console.error("Error submitting quiz result:", error);
      toast.error("Failed to submit quiz. Please try again.");
    }
  };

  return {
    user,
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
  };
};

export default useStudentQuiz;
