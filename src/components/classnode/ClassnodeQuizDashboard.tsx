import React, { useEffect, useState } from "react";
import { useQuiz } from "@/contexts/quiz";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Trophy, Users, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ClassnodeQuizDashboardProps {
  quiz: any;
  onEndQuiz: () => void;
}

const ClassnodeQuizDashboard: React.FC<ClassnodeQuizDashboardProps> = ({ quiz, onEndQuiz }) => {
  const { 
    studentAnswers,
    classnodeRankings
  } = useQuiz();
  
  const [timer, setTimer] = useState(quiz.timePerQuestion || 30);
  const [quizSession, setQuizSession] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [liveRankings, setLiveRankings] = useState<any[]>([]);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  
  // Get answers for current question
  const currentQuestionAnswers = studentAnswers.filter(
    answer => answer.questionId === currentQuestion?.id
  );
  
  const totalStudents = new Set(studentAnswers.map(a => a.studentId)).size;
  const answeredStudents = currentQuestionAnswers.length;

  // Fetch quiz session and set up real-time subscription
  useEffect(() => {
    const fetchQuizSession = async () => {
      const { data: sessionData } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .single();

      if (sessionData) {
        setQuizSession(sessionData);
        setCurrentQuestionIndex(sessionData.current_question || 0);
        
        // Calculate timer if question is active
        if (sessionData.question_start_time) {
          const elapsed = Math.floor((Date.now() - new Date(sessionData.question_start_time).getTime()) / 1000);
          const remaining = Math.max(0, (quiz.timePerQuestion || 30) - elapsed);
          setTimer(remaining);
        }
      }
    };

    fetchQuizSession();

    // Set up real-time subscription for quiz session updates
    const sessionChannel = supabase
      .channel('quiz-session-teacher-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `quiz_id=eq.${quiz.id}`
        },
        (payload) => {
          const updatedSession = payload.new as any;
          setQuizSession(updatedSession);
          setCurrentQuestionIndex(updatedSession.current_question || 0);
          
          // Reset timer if new question started
          if (updatedSession.question_start_time) {
            const elapsed = Math.floor((Date.now() - new Date(updatedSession.question_start_time).getTime()) / 1000);
            const remaining = Math.max(0, (quiz.timePerQuestion || 30) - elapsed);
            setTimer(remaining);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, [quiz.id]);

  // Set up real-time subscription for live leaderboard
  useEffect(() => {
    const fetchLiveRankings = async () => {
      const { data: answers } = await supabase
        .from("student_answers")
        .select("student_id, is_correct, points")
        .eq("quiz_id", quiz.id);

      if (answers) {
        const rankingsMap = new Map();
        
        answers.forEach((answer: any) => {
          const existing = rankingsMap.get(answer.student_id) || {
            studentId: answer.student_id,
            studentName: `Student ${answer.student_id.slice(-4)}`,
            totalPoints: 0,
            correctAnswers: 0
          };
          
          existing.totalPoints += answer.points || 0;
          if (answer.is_correct) existing.correctAnswers++;
          
          rankingsMap.set(answer.student_id, existing);
        });

        const rankings = Array.from(rankingsMap.values())
          .sort((a, b) => b.totalPoints - a.totalPoints);
        
        setLiveRankings(rankings);
      }
    };

    fetchLiveRankings();

    // Set up real-time subscription for student answers
    const answersChannel = supabase
      .channel('live-leaderboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_answers',
          filter: `quiz_id=eq.${quiz.id}`
        },
        () => {
          fetchLiveRankings(); // Refresh rankings when answers change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(answersChannel);
    };
  }, [quiz.id]);

  // Timer countdown effect
  useEffect(() => {
    if (!quizSession?.question_start_time) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - new Date(quizSession.question_start_time).getTime()) / 1000);
      const remaining = Math.max(0, (quiz.timePerQuestion || 30) - elapsed);
      setTimer(remaining);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [quizSession?.question_start_time]);

  const handleNextQuestion = async () => {
    if (isLastQuestion) {
      // End the quiz
      await supabase
        .from("quiz_sessions")
        .update({ 
          session_state: 'completed',
          current_question: currentQuestionIndex 
        })
        .eq("quiz_id", quiz.id);
      onEndQuiz();
    } else {
      // Move to next question
      const nextQuestionIndex = currentQuestionIndex + 1;
      await supabase
        .from("quiz_sessions")
        .update({ 
          current_question: nextQuestionIndex,
          question_start_time: new Date().toISOString()
        })
        .eq("quiz_id", quiz.id);
      
      setTimer(quiz.timePerQuestion || 30);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quiz Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </CardTitle>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {timer}s
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </CardHeader>
      </Card>

      {/* Current Question Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion?.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion?.options.map((option: string, index: number) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 transition-all ${
                  index === currentQuestion.correctOption
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{String.fromCharCode(65 + index)}. {option}</span>
                  {index === currentQuestion.correctOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {currentQuestionAnswers.filter(a => a.selectedOption === index).length} responses
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Participation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Students Answered:</span>
                <Badge variant="outline">
                  {answeredStudents} / {totalStudents || 'N/A'}
                </Badge>
              </div>
              {totalStudents > 0 && (
                <Progress value={(answeredStudents / totalStudents) * 100} className="h-2" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Live Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Top 5 Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {liveRankings.slice(0, 5).map((student, index) => (
                <div
                  key={student.studentId}
                  className={`
                    flex items-center justify-between p-3 rounded-lg transition-all duration-500 ease-out
                    hover:scale-[1.02] hover:shadow-md animate-fade-in
                    ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200' : 'bg-muted/50'}
                  `}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both'
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={index === 0 ? "default" : "secondary"}
                      className={`transition-all duration-300 ${
                        index === 0 ? "bg-yellow-500 scale-110" : ""
                      }`}
                    >
                      #{index + 1}
                    </Badge>
                    <span className={`font-medium transition-colors duration-300 ${
                      index === 0 ? 'text-yellow-700 font-bold' : ''
                    }`}>
                      {student.studentName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg transition-all duration-300 ${
                      index === 0 ? 'text-yellow-600 scale-110' : 'text-quiz-primary'
                    } animate-pulse`}>
                      {student.totalPoints}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {student.correctAnswers} correct
                    </div>
                  </div>
                </div>
              ))}
              {liveRankings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground animate-fade-in">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No student answers yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center">
        <Button
          onClick={handleNextQuestion}
          size="lg"
          className="quiz-gradient px-8 py-3 text-lg"
        >
          {isLastQuestion ? (
            <>Finish Quiz</>
          ) : (
            <>
              Next Question
              <ChevronRight className="h-5 w-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ClassnodeQuizDashboard;