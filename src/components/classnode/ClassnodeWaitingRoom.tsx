import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { JoinedStudent, Quiz, QuizSession } from "@/types/quiz";
import { useAuth } from "@/contexts/AuthContext";

interface ClassnodeWaitingRoomProps {
  quiz: Quiz;
  onQuizLaunched: () => void;
}

const ClassnodeWaitingRoom: React.FC<ClassnodeWaitingRoomProps> = ({ 
  quiz, 
  onQuizLaunched 
}) => {
  const { user } = useAuth();
  const [joinedStudents, setJoinedStudents] = useState<JoinedStudent[]>([]);
  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch current session state
      const { data: sessionData } = await supabase
        .from("quiz_sessions")
        .select("*")
        .eq("quiz_id", quiz.id)
        .single();

      if (sessionData) {
        const session: QuizSession = {
          id: sessionData.id,
          quizId: sessionData.quiz_id,
          sessionState: sessionData.session_state as 'created' | 'pre-launch' | 'active' | 'completed',
          launchedAt: sessionData.launched_at,
          currentQuestion: sessionData.current_question,
          questionStartTime: sessionData.question_start_time,
          createdAt: sessionData.created_at,
          updatedAt: sessionData.updated_at
        };
        setQuizSession(session);
        
        // If quiz is already active, notify parent
        if (session.sessionState === 'active') {
          onQuizLaunched();
          return;
        }
      }

      // Fetch joined students
      const { data: studentsData } = await supabase
        .from("joined_students")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("joined_at", { ascending: true });

      if (studentsData) {
        setJoinedStudents(studentsData.map(student => ({
          id: student.id,
          quizId: student.quiz_id,
          studentId: student.student_id,
          studentName: student.student_name,
          joinedAt: student.joined_at
        })));
      }
    };

    fetchData();

    // Set up real-time subscriptions
    const studentsChannel = supabase
      .channel('waiting-room-students')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'joined_students',
          filter: `quiz_id=eq.${quiz.id}`
        },
        (payload) => {
          const rawStudent = payload.new as any;
          const newStudent: JoinedStudent = {
            id: rawStudent.id,
            quizId: rawStudent.quiz_id,
            studentId: rawStudent.student_id,
            studentName: rawStudent.student_name,
            joinedAt: rawStudent.joined_at
          };
          setJoinedStudents(prev => [...prev, newStudent]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'joined_students',
          filter: `quiz_id=eq.${quiz.id}`
        },
        (payload) => {
          const rawStudent = payload.old as any;
          const deletedStudent: JoinedStudent = {
            id: rawStudent.id,
            quizId: rawStudent.quiz_id,
            studentId: rawStudent.student_id,
            studentName: rawStudent.student_name,
            joinedAt: rawStudent.joined_at
          };
          setJoinedStudents(prev => prev.filter(s => s.id !== deletedStudent.id));
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel('waiting-room-session')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `quiz_id=eq.${quiz.id}`
        },
        (payload) => {
          const rawSession = payload.new as any;
          const updatedSession: QuizSession = {
            id: rawSession.id,
            quizId: rawSession.quiz_id,
            sessionState: rawSession.session_state as 'created' | 'pre-launch' | 'active' | 'completed',
            launchedAt: rawSession.launched_at,
            currentQuestion: rawSession.current_question,
            questionStartTime: rawSession.question_start_time,
            createdAt: rawSession.created_at,
            updatedAt: rawSession.updated_at
          };
          setQuizSession(updatedSession);
          
          // If quiz was launched, notify parent
          if (updatedSession.sessionState === 'active') {
            onQuizLaunched();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(studentsChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [quiz.id, onQuizLaunched]);

  const myPosition = joinedStudents.findIndex(s => s.studentId === user?.id) + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{quiz.title}</CardTitle>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
      <div className="flex items-center justify-center gap-2 mt-4">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        <span className="text-lg font-medium bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Waiting for teacher to start...
        </span>
      </div>
        </CardHeader>
      </Card>

      {/* Quiz Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
          <CardContent className="flex items-center gap-3 p-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{joinedStudents.length}</div>
              <div className="text-sm text-blue-600 dark:text-blue-400">Students Joined</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800">
          <CardContent className="flex items-center gap-3 p-6">
            <Clock className="h-8 w-8 text-emerald-600" />
            <div>
              <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{quiz.questions?.length || 0}</div>
              <div className="text-sm text-emerald-600 dark:text-emerald-400">Total Questions</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-900 border-purple-200 dark:border-purple-800">
          <CardContent className="flex items-center gap-3 p-6">
            <Badge variant="outline" className="text-lg px-3 py-1 border-purple-300 text-purple-700 dark:border-purple-600 dark:text-purple-300">
              #{myPosition || 'N/A'}
            </Badge>
            <div>
              <div className="text-lg font-bold text-purple-700 dark:text-purple-300">Your Position</div>
              <div className="text-sm text-purple-600 dark:text-purple-400">In Queue</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Students in Waiting Room ({joinedStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {joinedStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">You're the first one here!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {joinedStudents.map((student, index) => (
                <div
                  key={student.id}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all transform hover:scale-105 ${
                    student.studentId === user?.id
                      ? 'bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 border-orange-300 dark:border-orange-600 shadow-lg'
                      : 'bg-gradient-to-r from-slate-50 to-gray-100 dark:from-slate-800 dark:to-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      student.studentId === user?.id
                        ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white shadow-md'
                        : 'bg-gradient-to-r from-blue-400 to-purple-500 text-white'
                    }`}>
                      {student.studentName.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate text-sm ${
                      student.studentId === user?.id ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {student.studentName}
                      {student.studentId === user?.id && ' (You)'}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`text-xs ${
                      student.studentId === user?.id 
                        ? 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200' 
                        : 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                    }`}
                  >
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent className="text-center py-6">
          <h3 className="font-semibold mb-2">What's Next?</h3>
          <p className="text-muted-foreground mb-4">
            Your teacher will launch the quiz when ready. All students will start at the same time.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
              <span>Questions are timed (10 seconds each)</span>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
              <span>Points based on speed and accuracy</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassnodeWaitingRoom;