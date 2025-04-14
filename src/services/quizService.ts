
import { supabase } from "@/integrations/supabase/client";
import { Quiz, QuizQuestion, StudentAnswer, QuizResult } from "@/types/quiz";
import { toast } from "sonner";

// Helper function to generate UUID that works in all environments
export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for browsers that don't support crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const fetchQuizzes = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('created_by', userId);

    if (error) {
      toast.error('Failed to fetch quizzes');
      console.error(error);
      return [];
    }

    if (!data) return [];

    const quizzesWithQuestions = await Promise.all(
      data.map(async (quiz) => {
        const { data: questions, error: questionsError } = await supabase
          .from('quiz_questions')
          .select('*')
          .eq('quiz_id', quiz.id);

        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          return null;
        }

        const transformedQuestions: QuizQuestion[] = questions?.map(q => ({
          id: q.id,
          text: q.text,
          options: Array.isArray(q.options) 
            ? q.options as string[] 
            : typeof q.options === 'string' 
              ? JSON.parse(q.options) 
              : [],
          correctOption: q.correct_option
        })) || [];

        return {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description || "",
          timePerQuestion: quiz.time_per_question,
          questions: transformedQuestions,
          createdAt: new Date(quiz.created_at).getTime(),
          createdBy: quiz.created_by,
          roomCode: quiz.room_code,
          isActive: quiz.is_active
        } as Quiz;
      })
    );

    return quizzesWithQuestions.filter((q): q is Quiz => q !== null);
  } catch (error) {
    console.error('Error in fetchQuizzes:', error);
    toast.error('Failed to fetch quizzes');
    return [];
  }
};

export const fetchResults = async () => {
  try {
    // This query needs to be adjusted to fetch ALL results, not just for the current user
    const { data: resultsData, error: resultsError } = await supabase
      .from('quiz_results')
      .select('*, students(name)');

    if (resultsError) {
      toast.error('Failed to fetch quiz results');
      console.error(resultsError);
      return [];
    }

    if (!resultsData) return [];

    const formattedResults: QuizResult[] = await Promise.all(
      resultsData.map(async (result) => {
        const { data: answers, error: answersError } = await supabase
          .from('student_answers')
          .select('*')
          .eq('quiz_id', result.quiz_id)
          .eq('student_id', result.student_id);

        if (answersError) {
          console.error('Error fetching answers:', answersError);
          return null;
        }

        const studentName = result.students?.name || "Unknown Student";
        
        const formattedAnswers: StudentAnswer[] = answers?.map(answer => ({
          studentId: answer.student_id,
          studentName,
          quizId: answer.quiz_id,
          questionId: answer.question_id,
          selectedOption: answer.selected_option,
          timeSpent: answer.time_spent,
          correct: answer.is_correct
        })) || [];

        return {
          studentId: result.student_id,
          studentName,
          quizId: result.quiz_id,
          score: result.score,
          totalQuestions: result.total_questions,
          answers: formattedAnswers,
        } as QuizResult;
      })
    );

    return formattedResults.filter((r): r is QuizResult => r !== null);
  } catch (error) {
    console.error('Error in fetchResults:', error);
    toast.error('Failed to fetch quiz results');
    return [];
  }
};

export const createQuiz = async (
  quizData: Omit<Quiz, "id" | "createdAt" | "createdBy">, 
  userId: string
) => {
  try {
    const newRoomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data, error } = await supabase
      .from('quizzes')
      .insert({
        title: quizData.title,
        description: quizData.description,
        time_per_question: quizData.timePerQuestion,
        created_by: userId,
        room_code: newRoomCode,
      })
      .select('*')
      .single();

    if (error) {
      toast.error("Failed to create quiz");
      console.error(error);
      return null;
    }

    const questionInserts = quizData.questions.map((question, index) => ({
      quiz_id: data.id,
      text: question.text,
      options: question.options,
      correct_option: question.correctOption,
      order_num: index + 1
    }));

    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .insert(questionInserts);

    if (questionsError) {
      toast.error("Failed to save quiz questions");
      console.error(questionsError);
      return null;
    }

    const { data: fullQuiz, error: fetchError } = await supabase
      .from('quizzes')
      .select(`
        *,
        quiz_questions(*)
      `)
      .eq('id', data.id)
      .single();

    if (fetchError) {
      toast.error("Failed to retrieve full quiz details");
      console.error(fetchError);
      return null;
    }

    const formattedQuiz: Quiz = {
      id: fullQuiz.id,
      title: fullQuiz.title,
      description: fullQuiz.description || "",
      timePerQuestion: fullQuiz.time_per_question,
      questions: fullQuiz.quiz_questions.map(q => {
        let options: string[];
        if (Array.isArray(q.options)) {
          options = q.options as string[];
        } else if (typeof q.options === 'string') {
          try {
            options = JSON.parse(q.options);
          } catch (e) {
            console.error('Error parsing options:', e);
            options = [];
          }
        } else {
          options = [];
        }
        
        return {
          id: q.id,
          text: q.text,
          options,
          correctOption: q.correct_option
        };
      }),
      createdAt: new Date(fullQuiz.created_at).getTime(),
      createdBy: fullQuiz.created_by,
      roomCode: fullQuiz.room_code,
      isActive: fullQuiz.is_active
    };

    toast.success("Quiz created successfully!");
    return formattedQuiz;
  } catch (error) {
    console.error("Error creating quiz:", error);
    toast.error("Failed to create quiz");
    return null;
  }
};

export const deleteQuiz = async (quizId: string) => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', quizId);
      
    if (error) {
      toast.error("Failed to delete quiz");
      console.error(error);
      return false;
    }
    
    toast.success("Quiz deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting quiz:", error);
    toast.error("Failed to delete quiz");
    return false;
  }
};

export const launchQuiz = async (quizId: string) => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .update({ is_active: true })
      .eq('id', quizId);
      
    if (error) {
      toast.error("Failed to launch quiz");
      console.error(error);
      return false;
    }
    
    toast.success("Quiz launched successfully!");
    return true;
  } catch (error) {
    console.error("Error launching quiz:", error);
    toast.error("Failed to launch quiz");
    return false;
  }
};

export const endQuiz = async (quizId: string) => {
  try {
    const { error } = await supabase
      .from('quizzes')
      .update({ is_active: false })
      .eq('id', quizId);
      
    if (error) {
      toast.error("Failed to end quiz");
      console.error(error);
      return false;
    }
    
    toast.info("Quiz ended.");
    return true;
  } catch (error) {
    console.error("Error ending quiz:", error);
    toast.error("Failed to end quiz");
    return false;
  }
};

export const submitAnswer = async (answer: Omit<StudentAnswer, "correct">) => {
  if (!answer.questionId) {
    toast.error("Question ID is required");
    return false;
  }
  
  try {
    // Create a new student record
    const { data: newStudent, error: createError } = await supabase
      .from('students')
      .insert({ name: answer.studentName })
      .select()
      .maybeSingle();
      
    if (createError) {
      console.error("Error creating student:", createError);
      toast.error("Failed to create student");
      return false;
    }
    
    const studentId = newStudent?.id || generateUUID();
    
    // Get the correct answer
    const { data: question, error: questionError } = await supabase
      .from('quiz_questions')
      .select('correct_option')
      .eq('id', answer.questionId)
      .single();
      
    if (questionError || !question) {
      console.error("Error getting correct answer:", questionError);
      toast.error("Failed to get correct answer");
      return false;
    }
    
    const isCorrect = question.correct_option === answer.selectedOption;
    
    // Create the answer record
    const { error: answerError } = await supabase
      .from('student_answers')
      .insert({
        id: generateUUID(),
        student_id: studentId,
        quiz_id: answer.quizId,
        question_id: answer.questionId,
        selected_option: answer.selectedOption,
        is_correct: isCorrect,
        time_spent: answer.timeSpent
      });
      
    if (answerError) {
      console.error("Error saving answer:", answerError);
      toast.error("Failed to submit answer");
      return false;
    }
    
    return isCorrect;
  } catch (error) {
    console.error("Error submitting answer:", error);
    toast.error("Failed to submit answer");
    return false;
  }
};

export const submitQuizResult = async (result: QuizResult) => {
  try {
    console.log("Submitting quiz result:", result);
    
    // Create a new student record
    const { data: newStudent, error: createError } = await supabase
      .from('students')
      .insert({ name: result.studentName })
      .select()
      .maybeSingle();
      
    if (createError) {
      console.error("Error creating student:", createError);
      toast.error("Failed to create student record");
      throw createError;
    }
    
    const studentId = newStudent?.id || generateUUID();
    
    // Create the quiz result record
    const { error: resultError } = await supabase
      .from('quiz_results')
      .insert({
        id: generateUUID(),
        quiz_id: result.quizId,
        student_id: studentId,
        score: result.score,
        total_questions: result.totalQuestions,
        completed_at: new Date().toISOString()
      });

    if (resultError) {
      console.error("Failed to submit quiz result:", resultError);
      toast.error("Failed to submit quiz result");
      throw resultError;
    }
    
    // Create answer records
    for (const answer of result.answers) {
      const { error: answerError } = await supabase
        .from('student_answers')
        .insert({
          id: generateUUID(),
          quiz_id: answer.quizId,
          student_id: studentId,
          question_id: answer.questionId,
          selected_option: answer.selectedOption,
          is_correct: answer.correct,
          time_spent: answer.timeSpent
        });

      if (answerError) {
        console.error("Failed to save student answer:", answerError);
      }
    }

    toast.success("Quiz result submitted!");
    return { ...result, studentId };
  } catch (error) {
    console.error("Error submitting quiz result:", error);
    toast.error("Failed to submit quiz result");
    throw error;
  }
};
