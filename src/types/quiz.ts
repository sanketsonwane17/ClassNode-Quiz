export type QuizQuestion = {
  id: string;
  text: string;
  options: string[];
  correctOption: number;
};

export type Quiz = {
  id: string;
  title: string;
  description: string;
  timePerQuestion: number;
  questions: QuizQuestion[];
  createdAt: number;
  createdBy: string;
  roomCode?: string;
  isActive?: boolean;
  quizType?: 'traditional' | 'classnode';
};

export type StudentAnswer = {
  studentId: string;
  studentName: string;
  quizId: string;
  questionId: string;
  selectedOption: number;
  timeSpent: number;
  correct: boolean;
  points?: number;
  submissionTimestamp?: string;
};

export type QuizResult = {
  studentId: string;
  studentName: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  answers: StudentAnswer[];
};

export type QuizContextType = {
  quizzes: Quiz[];
  createQuiz: (quiz: Omit<Quiz, "id" | "createdAt" | "createdBy">) => void;
  deleteQuiz: (quizId: string) => void;
  activeQuiz: Quiz | null;
  launchQuiz: (quizId: string) => void;
  endQuiz: () => void;
  currentQuestion: number;
  setCurrentQuestion: React.Dispatch<React.SetStateAction<number>>;
  submitAnswer: (answer: Omit<StudentAnswer, "correct">) => Promise<boolean>;
  studentAnswers: StudentAnswer[];
  results: QuizResult[];
  submitQuizResult: (result: QuizResult) => Promise<void>;
  loading: boolean;
  // Classnode quiz specific
  classnodeCurrentQuestion: number;
  nextClassnodeQuestion: () => void;
  submitClassnodeAnswer: (answer: Omit<StudentAnswer, "correct" | "points">) => Promise<{ correct: boolean; points: number }>;
  classnodeRankings: StudentRanking[];
  questionStartTime: Date | null;
  isQuestionActive: boolean;
};

export type StudentRanking = {
  studentId: string;
  studentName: string;
  totalPoints: number;
  totalMarks: number;
  rank: number;
};

export type QuizSession = {
  id: string;
  quizId: string;
  sessionState: 'created' | 'pre-launch' | 'active' | 'completed';
  launchedAt?: string;
  currentQuestion: number;
  questionStartTime?: string;
  createdAt: string;
  updatedAt: string;
};

export type JoinedStudent = {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  joinedAt: string;
};
