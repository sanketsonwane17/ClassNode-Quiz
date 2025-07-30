import { QuizResult, Quiz } from "@/types/quiz";
import { QuestionAnalytics, QuizAnalytics, DetailedQuizReport } from "@/types/analytics";

export const processQuestionAnalytics = (
  quiz: Quiz,
  results: QuizResult[]
): QuestionAnalytics[] => {
  return quiz.questions.map((question) => {
    // Get all answers for this question
    const questionAnswers = results.flatMap(result => 
      result.answers.filter(answer => answer.questionId === question.id)
    );

    const totalResponses = questionAnswers.length;
    
    // Calculate option distribution
    const optionCounts = question.options.map((_, index) => 
      questionAnswers.filter(answer => answer.selectedOption === index).length
    );

    const optionDistribution = question.options.map((optionText, index) => ({
      optionIndex: index,
      optionText,
      count: optionCounts[index] || 0,
      percentage: totalResponses > 0 ? Math.round((optionCounts[index] || 0) / totalResponses * 100) : 0,
      isCorrect: index === question.correctOption
    }));

    // Calculate difficulty (percentage who got it right)
    const correctAnswers = questionAnswers.filter(answer => answer.correct).length;
    const difficultyScore = totalResponses > 0 ? Math.round((correctAnswers / totalResponses) * 100) : 0;

    // Calculate discrimination index (simplified version)
    // This measures how well the question separates high and low performers
    const studentScores = results.map(result => ({
      studentId: result.studentId,
      totalScore: (result.score / result.totalQuestions) * 100,
      gotThisCorrect: result.answers.find(a => a.questionId === question.id)?.correct || false
    }));

    studentScores.sort((a, b) => b.totalScore - a.totalScore);
    const topThird = studentScores.slice(0, Math.ceil(studentScores.length / 3));
    const bottomThird = studentScores.slice(-Math.ceil(studentScores.length / 3));

    const topCorrect = topThird.filter(s => s.gotThisCorrect).length;
    const bottomCorrect = bottomThird.filter(s => s.gotThisCorrect).length;
    
    const discriminationIndex = topThird.length > 0 && bottomThird.length > 0 
      ? Math.round(((topCorrect / topThird.length) - (bottomCorrect / bottomThird.length)) * 100)
      : 0;

    return {
      questionId: question.id,
      questionText: question.text,
      correctOption: question.correctOption,
      totalResponses,
      optionDistribution,
      difficultyScore,
      discriminationIndex
    };
  });
};

export const processQuizAnalytics = (
  quiz: Quiz,
  results: QuizResult[]
): QuizAnalytics => {
  const totalStudents = results.length;
  const averageScore = totalStudents > 0 
    ? Math.round(results.reduce((sum, result) => sum + (result.score / result.totalQuestions) * 100, 0) / totalStudents)
    : 0;

  const questions = processQuestionAnalytics(quiz, results);

  // Calculate time analytics
  const allAnswers = results.flatMap(result => result.answers);
  const averageTimePerQuestion = allAnswers.length > 0 
    ? Math.round(allAnswers.reduce((sum, answer) => sum + answer.timeSpent, 0) / allAnswers.length)
    : 0;

  const questionTimeBreakdown = quiz.questions.map(question => {
    const questionAnswers = allAnswers.filter(answer => answer.questionId === question.id);
    const times = questionAnswers.map(answer => answer.timeSpent);
    
    return {
      questionId: question.id,
      averageTime: times.length > 0 ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length) : 0,
      minTime: times.length > 0 ? Math.min(...times) : 0,
      maxTime: times.length > 0 ? Math.max(...times) : 0
    };
  });

  return {
    quizId: quiz.id,
    quizTitle: quiz.title,
    totalStudents,
    totalQuestions: quiz.questions.length,
    averageScore,
    questions,
    completionRate: 100, // Assuming all results are completed quizzes
    timeAnalytics: {
      averageTimePerQuestion,
      questionTimeBreakdown
    }
  };
};

export const generateDetailedReport = (
  quiz: Quiz,
  results: QuizResult[]
): DetailedQuizReport => {
  const summary = processQuizAnalytics(quiz, results);
  
  const studentResponses = results.map(result => ({
    studentId: result.studentId,
    studentName: result.studentName,
    score: result.score,
    percentage: Math.round((result.score / result.totalQuestions) * 100),
    completedAt: new Date().toISOString(), // Using current date as fallback
    timeSpent: result.answers.reduce((sum, answer) => sum + answer.timeSpent, 0),
    questionResponses: result.answers.map(answer => ({
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.correct,
      timeSpent: answer.timeSpent
    }))
  }));

  return {
    summary,
    studentResponses
  };
};

// Function to generate analytics for multiple quizzes
export const processMultiQuizAnalytics = (
  quizzes: Quiz[],
  results: QuizResult[]
): {
  overallStats: {
    totalQuizzes: number;
    totalStudents: number;
    totalCompletions: number;
    averageScore: number;
  };
  quizBreakdown: Array<{
    quizId: string;
    quizTitle: string;
    completions: number;
    averageScore: number;
    averageTime: number;
  }>;
  studentPerformance: Array<{
    studentId: string;
    studentName: string;
    quizzesCompleted: number;
    overallAverage: number;
    bestScore: number;
    worstScore: number;
  }>;
} => {
  const totalStudents = new Set(results.map(r => r.studentId)).size;
  const totalCompletions = results.length;
  const overallAverage = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
    : 0;

  const quizBreakdown = quizzes.map(quiz => {
    const quizResults = results.filter(r => r.quizId === quiz.id);
    const completions = quizResults.length;
    const averageScore = completions > 0 
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / completions)
      : 0;
    const averageTime = completions > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + r.answers.reduce((timeSum, a) => timeSum + a.timeSpent, 0), 0) / completions)
      : 0;

    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      completions,
      averageScore,
      averageTime
    };
  });

  const studentMap = new Map<string, { scores: number[], name: string }>();
  results.forEach(result => {
    const score = (result.score / result.totalQuestions) * 100;
    if (!studentMap.has(result.studentId)) {
      studentMap.set(result.studentId, { scores: [score], name: result.studentName });
    } else {
      studentMap.get(result.studentId)!.scores.push(score);
    }
  });

  const studentPerformance = Array.from(studentMap.entries()).map(([studentId, data]) => ({
    studentId,
    studentName: data.name,
    quizzesCompleted: data.scores.length,
    overallAverage: Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length),
    bestScore: Math.round(Math.max(...data.scores)),
    worstScore: Math.round(Math.min(...data.scores))
  }));

  return {
    overallStats: {
      totalQuizzes: quizzes.length,
      totalStudents,
      totalCompletions,
      averageScore: overallAverage
    },
    quizBreakdown,
    studentPerformance
  };
};

export const generateMultiQuizCSV = (
  quizzes: Quiz[],
  results: QuizResult[]
): string => {
  const analytics = processMultiQuizAnalytics(quizzes, results);
  let csv = "";
  
  // Overall Summary
  csv += "COMPREHENSIVE QUIZ ANALYTICS REPORT\n";
  csv += `Generated: ${new Date().toLocaleDateString()}\n`;
  csv += `Total Quizzes: ${analytics.overallStats.totalQuizzes}\n`;
  csv += `Total Students: ${analytics.overallStats.totalStudents}\n`;
  csv += `Total Quiz Completions: ${analytics.overallStats.totalCompletions}\n`;
  csv += `Overall Average Score: ${analytics.overallStats.averageScore}%\n\n`;

  // Quiz-by-Quiz Breakdown
  csv += "QUIZ BREAKDOWN\n";
  csv += "Quiz Title,Completions,Average Score (%),Average Time (seconds)\n";
  analytics.quizBreakdown.forEach(quiz => {
    csv += `"${quiz.quizTitle}",${quiz.completions},${quiz.averageScore},${quiz.averageTime}\n`;
  });
  csv += "\n";

  // Student Performance Overview
  csv += "STUDENT PERFORMANCE OVERVIEW\n";
  csv += "Student Name,Quizzes Completed,Overall Average (%),Best Score (%),Worst Score (%)\n";
  analytics.studentPerformance
    .sort((a, b) => b.overallAverage - a.overallAverage)
    .forEach(student => {
      csv += `"${student.studentName}",${student.quizzesCompleted},${student.overallAverage},${student.bestScore},${student.worstScore}\n`;
    });
  csv += "\n";

  // Detailed Results
  csv += "DETAILED QUIZ RESULTS\n";
  csv += "Student Name,Quiz Title,Score,Percentage (%),Total Questions,Completion Date\n";
  results
    .sort((a, b) => b.score / b.totalQuestions - a.score / a.totalQuestions)
    .forEach(result => {
      const quiz = quizzes.find(q => q.id === result.quizId);
      const percentage = Math.round((result.score / result.totalQuestions) * 100);
      csv += `"${result.studentName}","${quiz?.title || 'Unknown Quiz'}",${result.score},${percentage},${result.totalQuestions},"${new Date().toLocaleDateString()}"\n`;
    });

  return csv;
};

export const generateDetailedCSV = (report: DetailedQuizReport): string => {
  let csv = "";
  
  // Quiz Summary Section
  csv += "DETAILED QUIZ ANALYTICS REPORT\n";
  csv += `Quiz: ${report.summary.quizTitle}\n`;
  csv += `Total Students: ${report.summary.totalStudents}\n`;
  csv += `Average Score: ${report.summary.averageScore}%\n`;
  csv += `Total Questions: ${report.summary.totalQuestions}\n\n`;

  // Enhanced Question-wise Analysis with Option Selection Details
  csv += "QUESTION-WISE ANALYSIS WITH OPTION SELECTION\n";
  csv += "============================================\n\n";
  
  report.summary.questions.forEach((question, index) => {
    csv += `QUESTION ${index + 1}: "${question.questionText}"\n`;
    csv += `Difficulty Score: ${question.difficultyScore}%\n`;
    csv += `Total Responses: ${question.totalResponses}\n`;
    csv += `Correct Answer: Option ${String.fromCharCode(65 + question.correctOption)}\n\n`;
    
    csv += "Option Selection Breakdown:\n";
    csv += "Option,Option Text,Students Selected,Percentage,Is Correct\n";
    question.optionDistribution.forEach(option => {
      const optionLetter = String.fromCharCode(65 + option.optionIndex);
      csv += `${optionLetter},"${option.optionText}",${option.count},${option.percentage}%,${option.isCorrect ? 'Yes' : 'No'}\n`;
    });
    csv += "\n";
  });

  // Student Responses with Question-wise Details
  csv += "STUDENT RESPONSES WITH QUESTION-WISE ANSWERS\n";
  csv += "==========================================\n";
  csv += "Student Name,Total Score,Percentage,Completion Date,Total Time (minutes)";
  
  // Add question headers for selected options
  report.summary.questions.forEach((_, index) => {
    csv += `,Q${index + 1} Selected Option,Q${index + 1} Result`;
  });
  csv += "\n";

  // Add student data with their question-wise selections
  report.studentResponses.forEach(student => {
    const completionDate = new Date(student.completedAt).toLocaleDateString();
    const timeSpentMinutes = (student.timeSpent / 60).toFixed(2);
    
    csv += `"${student.studentName}",${student.score}/${report.summary.totalQuestions},${student.percentage}%,${completionDate},${timeSpentMinutes}`;
    
    // Add question responses showing which option they selected
    report.summary.questions.forEach(question => {
      const response = student.questionResponses.find(r => r.questionId === question.questionId);
      if (response) {
        const selectedOptionLetter = String.fromCharCode(65 + response.selectedOption);
        csv += `,${selectedOptionLetter},${response.isCorrect ? 'Correct' : 'Incorrect'}`;
      } else {
        csv += ",No Answer,No Response";
      }
    });
    csv += "\n";
  });

  csv += "\n";

  // Summary table showing option selection statistics
  csv += "OPTION SELECTION SUMMARY\n";
  csv += "=======================\n";
  csv += "Question,Option A Count,Option B Count,Option C Count,Option D Count,Correct Option,Most Selected Option\n";
  
  report.summary.questions.forEach((question, index) => {
    const optionCounts = ['A', 'B', 'C', 'D'].map(letter => {
      const optionIndex = letter.charCodeAt(0) - 65;
      const option = question.optionDistribution.find(opt => opt.optionIndex === optionIndex);
      return option ? option.count : 0;
    });
    
    const correctOption = String.fromCharCode(65 + question.correctOption);
    const maxCount = Math.max(...optionCounts);
    const mostSelectedIndex = optionCounts.indexOf(maxCount);
    const mostSelected = String.fromCharCode(65 + mostSelectedIndex);
    
    csv += `"Q${index + 1}",${optionCounts.join(',')},${correctOption},${mostSelected}\n`;
  });

  return csv;
};