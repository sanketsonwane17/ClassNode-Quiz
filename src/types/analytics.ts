export interface QuestionAnalytics {
  questionId: string;
  questionText: string;
  correctOption: number;
  totalResponses: number;
  optionDistribution: {
    optionIndex: number;
    optionText: string;
    count: number;
    percentage: number;
    isCorrect: boolean;
  }[];
  difficultyScore: number; // Percentage who got it right
  discriminationIndex: number; // How well this question separates high and low performers
}

export interface QuizAnalytics {
  quizId: string;
  quizTitle: string;
  totalStudents: number;
  totalQuestions: number;
  averageScore: number;
  questions: QuestionAnalytics[];
  completionRate: number;
  timeAnalytics: {
    averageTimePerQuestion: number;
    questionTimeBreakdown: {
      questionId: string;
      averageTime: number;
      minTime: number;
      maxTime: number;
    }[];
  };
}

export interface DetailedQuizReport {
  summary: QuizAnalytics;
  studentResponses: {
    studentId: string;
    studentName: string;
    score: number;
    percentage: number;
    completedAt: string;
    timeSpent: number;
    questionResponses: {
      questionId: string;
      selectedOption: number;
      isCorrect: boolean;
      timeSpent: number;
    }[];
  }[];
}