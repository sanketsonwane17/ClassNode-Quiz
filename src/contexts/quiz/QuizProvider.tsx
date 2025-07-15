import React, { useState, useEffect } from "react";
import { QuizContextType, Quiz, QuizResult, StudentAnswer, StudentRanking } from "@/types/quiz";
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
import { supabase } from "@/integrations/supabase/client";

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<StudentAnswer[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Classnode quiz specific state
  const [classnodeCurrentQuestion, setClassnodeCurrentQuestion] = useState<number>(0);
  const [classnodeRankings, setClassnodeRankings] = useState<StudentRanking[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [isQuestionActive, setIsQuestionActive] = useState<boolean>(false);
  
  const { user, roomCode, setRoomCode } = useAuth();

  useEffect(() => {
    if (user && user.role === 'teacher') {
      loadQuizzes();
      loadResults();
    }
  }, [user]);

  // For students, check if there's an active quiz for their room code
  useEffect(() => {
    if (user && user.role === 'student' && roomCode) {
      checkActiveQuizForStudent();
    }
  }, [user, roomCode]);

  const checkActiveQuizForStudent = async () => {
    if (!roomCode) return;
    
    try {
      const { data: quizData, error } = await supabase
        .from("quizzes")
        .select(`
          id, title, description, time_per_question, is_active, room_code, created_at, created_by,
          quiz_questions (
            id, text, options, correct_option, order_num
          )
        `)
        .eq("room_code", roomCode)
        .eq("is_active", true)
        .single();

      if (!error && quizData) {
        const formattedQuiz: Quiz = {
          id: quizData.id,
          title: quizData.title,
          description: quizData.description || "",
          timePerQuestion: quizData.time_per_question,
          isActive: quizData.is_active,
          roomCode: quizData.room_code,
          createdAt: new Date(quizData.created_at).getTime(),
          createdBy: quizData.created_by,
          quizType: (quizData as any).quiz_type || 'traditional',
          questions: quizData.quiz_questions
            .sort((a, b) => a.order_num - b.order_num)
            .map(q => ({
              id: q.id,
              text: q.text,
              options: q.options as string[],
              correctOption: q.correct_option
            }))
        };
        
        setActiveQuiz(formattedQuiz);
        console.log("Found active quiz for student:", formattedQuiz);
      } else {
        setActiveQuiz(null);
        console.log("No active quiz found for room code:", roomCode);
      }
    } catch (error) {
      console.error("Error checking active quiz for student:", error);
      setActiveQuiz(null);
    }
  };

  // Set up real-time subscription for quiz status changes
  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase
      .channel('quiz-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quizzes',
          filter: `room_code=eq.${roomCode}`
        },
        (payload) => {
          console.log('Quiz status changed:', payload);
          if (user?.role === 'student') {
            checkActiveQuizForStudent();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, user]);

  // Fetch student answers for active quiz with real student names
  const fetchStudentAnswers = async (quizId: string) => {
    try {
      const { data: answers, error } = await supabase
        .from('student_answers')
        .select(`
          *,
          students!student_answers_student_id_fkey (
            name
          )
        `)
        .eq('quiz_id', quizId);
      
      if (error) {
        console.error('Error fetching student answers:', error);
        return;
      }

      if (answers) {
        const formattedAnswers: StudentAnswer[] = answers.map(answer => ({
          studentId: answer.student_id,
          studentName: answer.students?.name || `Student ${answer.student_id.substring(0, 4)}`,
          quizId: answer.quiz_id,
          questionId: answer.question_id,
          selectedOption: Number(answer.selected_option),
          timeSpent: answer.time_spent || 0,
          correct: answer.is_correct
        }));
        
        setStudentAnswers(formattedAnswers);
        console.log("Fetched student answers with real names:", formattedAnswers);
      }
    } catch (error) {
      console.error('Error in fetchStudentAnswers:', error);
    }
  };

  // Poll for new student answers when there's an active quiz
  useEffect(() => {
    if (!activeQuiz) return;
    
    // Initial fetch
    fetchStudentAnswers(activeQuiz.id);
    
    const pollInterval = setInterval(() => {
      console.log("Polling for new student answers...");
      fetchStudentAnswers(activeQuiz.id);
    }, 3000); // Poll every 3 seconds
    
    return () => clearInterval(pollInterval);
  }, [activeQuiz]);

  // Set up real-time subscription for student answers with student names
  useEffect(() => {
    if (!activeQuiz) return;

    const channel = supabase
      .channel('student-answers-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'student_answers',
          filter: `quiz_id=eq.${activeQuiz.id}`
        },
        async (payload) => {
          console.log('New student answer received:', payload);
          
          // Fetch the student name for the new answer
          const { data: studentData } = await supabase
            .from('students')
            .select('name')
            .eq('id', payload.new.student_id)
            .single();
          
          const newAnswer: StudentAnswer = {
            studentId: payload.new.student_id,
            studentName: studentData?.name || `Student ${payload.new.student_id.substring(0, 4)}`,
            quizId: payload.new.quiz_id,
            questionId: payload.new.question_id,
            selectedOption: Number(payload.new.selected_option),
            timeSpent: Number(payload.new.time_spent) || 0,
            correct: payload.new.is_correct
          };
          setStudentAnswers(prev => [...prev, newAnswer]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        fetchStudentAnswers(quizId);
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
        setStudentAnswers([]);
        setRoomCode(null);
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
      setResults(prev => [...prev, updatedResult]);
    } catch (error) {
      console.error("Error in submitQuizResult:", error);
      throw error;
    }
  };

  // Classnode quiz functions
  const nextClassnodeQuestion = async () => {
    if (!activeQuiz || activeQuiz.quizType !== 'classnode') return;
    
    const nextQuestion = classnodeCurrentQuestion + 1;
    if (nextQuestion >= activeQuiz.questions.length) {
      // End quiz
      await endQuiz();
      return;
    }
    
    setClassnodeCurrentQuestion(nextQuestion);
    setQuestionStartTime(new Date());
    setIsQuestionActive(true);
    
    // Update rankings after each question
    await updateClassnodeRankings();
    
    // Broadcast question change via Supabase
    const channel = supabase.channel('classnode-question-change');
    channel.send({
      type: 'broadcast',
      event: 'question_changed',
      payload: { 
        questionIndex: nextQuestion, 
        startTime: new Date().toISOString(),
        quizId: activeQuiz.id 
      }
    });
  };

  const submitClassnodeAnswer = async (answer: Omit<StudentAnswer, "correct" | "points">): Promise<{ correct: boolean; points: number }> => {
    if (!activeQuiz || !questionStartTime) {
      return { correct: false, points: 0 };
    }

    try {
      const submissionTime = new Date();
      const question = activeQuiz.questions.find(q => q.id === answer.questionId);
      const isCorrect = question ? answer.selectedOption === question.correctOption : false;
      
      // Calculate points based on timing
      const timeDiff = (submissionTime.getTime() - questionStartTime.getTime()) / 1000;
      let points = 0;
      if (isCorrect) {
        if (timeDiff <= 3) points = 1000;
        else if (timeDiff <= 6) points = 800;
        else if (timeDiff <= 10) points = 500;
      }

      // Submit to database
      const { error } = await supabase
        .from('student_answers')
        .insert({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          student_id: answer.studentId,
          quiz_id: answer.quizId,
          question_id: answer.questionId,
          selected_option: answer.selectedOption,
          time_spent: answer.timeSpent,
          is_correct: isCorrect,
          points: points,
          submission_timestamp: submissionTime.toISOString()
        });

      if (error) {
        console.error("Error submitting classnode answer:", error);
        return { correct: false, points: 0 };
      }

      const fullAnswer: StudentAnswer = {
        ...answer,
        correct: isCorrect,
        points: points,
        submissionTimestamp: submissionTime.toISOString()
      };
      
      setStudentAnswers(prev => [...prev, fullAnswer]);
      return { correct: isCorrect, points };
    } catch (error) {
      console.error("Error in submitClassnodeAnswer:", error);
      return { correct: false, points: 0 };
    }
  };

  const updateClassnodeRankings = async () => {
    if (!activeQuiz) return;

    try {
      const { data: rankings, error } = await supabase
        .from('student_answers')
        .select(`
          student_id,
          students!student_answers_student_id_fkey (name),
          points,
          is_correct
        `)
        .eq('quiz_id', activeQuiz.id);

      if (error || !rankings) return;

      // Calculate total points and marks for each student
      const studentStats = rankings.reduce((acc, answer) => {
        const studentId = answer.student_id;
        if (!acc[studentId]) {
          acc[studentId] = {
            studentId,
            studentName: (answer.students as any)?.name || `Student ${studentId.substring(0, 4)}`,
            totalPoints: 0,
            totalMarks: 0
          };
        }
        acc[studentId].totalPoints += answer.points || 0;
        if (answer.is_correct) {
          acc[studentId].totalMarks += 1;
        }
        return acc;
      }, {} as Record<string, Omit<StudentRanking, 'rank'>>);

      // Sort by points and assign ranks
      const sortedStudents = Object.values(studentStats)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((student, index) => ({
          ...student,
          rank: index + 1
        }));

      setClassnodeRankings(sortedStudents.slice(0, 5)); // Top 5
    } catch (error) {
      console.error("Error updating classnode rankings:", error);
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
        loading,
        // Classnode quiz specific
        classnodeCurrentQuestion,
        nextClassnodeQuestion,
        submitClassnodeAnswer,
        classnodeRankings,
        questionStartTime,
        isQuestionActive
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};
