import { useMemo } from "react";
import { Quiz, QuizResult } from "@/types/quiz";
import { QuizAnalytics, DetailedQuizReport } from "@/types/analytics";
import { processQuizAnalytics, generateDetailedReport } from "@/utils/analyticsProcessor";

export const useQuizAnalytics = (
  quiz: Quiz | null,
  results: QuizResult[]
) => {
  const analytics = useMemo(() => {
    if (!quiz) return null;
    
    const quizResults = results.filter(result => result.quizId === quiz.id);
    return processQuizAnalytics(quiz, quizResults);
  }, [quiz, results]);

  const detailedReport = useMemo(() => {
    if (!quiz) return null;
    
    const quizResults = results.filter(result => result.quizId === quiz.id);
    return generateDetailedReport(quiz, quizResults);
  }, [quiz, results]);

  const questionDifficultyDistribution = useMemo(() => {
    if (!analytics) return { easy: 0, medium: 0, hard: 0, veryHard: 0 };
    
    return analytics.questions.reduce((acc, question) => {
      if (question.difficultyScore >= 80) acc.easy++;
      else if (question.difficultyScore >= 60) acc.medium++;
      else if (question.difficultyScore >= 40) acc.hard++;
      else acc.veryHard++;
      return acc;
    }, { easy: 0, medium: 0, hard: 0, veryHard: 0 });
  }, [analytics]);

  const mostMissedQuestions = useMemo(() => {
    if (!analytics) return [];
    
    return [...analytics.questions]
      .sort((a, b) => a.difficultyScore - b.difficultyScore)
      .slice(0, 5);
  }, [analytics]);

  const commonMisconceptions = useMemo(() => {
    if (!analytics) return [];
    
    const misconceptions: Array<{
      questionText: string;
      wrongOption: string;
      count: number;
      percentage: number;
    }> = [];

    analytics.questions.forEach(question => {
      const wrongOptions = question.optionDistribution.filter(
        option => !option.isCorrect && option.count > 0
      );
      
      wrongOptions.forEach(option => {
        misconceptions.push({
          questionText: question.questionText,
          wrongOption: option.optionText,
          count: option.count,
          percentage: option.percentage
        });
      });
    });

    return misconceptions
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [analytics]);

  return {
    analytics,
    detailedReport,
    questionDifficultyDistribution,
    mostMissedQuestions,
    commonMisconceptions
  };
};