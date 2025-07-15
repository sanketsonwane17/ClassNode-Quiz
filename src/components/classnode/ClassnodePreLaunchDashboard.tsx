import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Play, Clock, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { JoinedStudent, Quiz } from "@/types/quiz";
import { toast } from "sonner";

interface ClassnodePreLaunchDashboardProps {
  quiz: Quiz;
  onLaunchQuiz: () => void;
}

const ClassnodePreLaunchDashboard: React.FC<ClassnodePreLaunchDashboardProps> = ({ 
  quiz, 
  onLaunchQuiz 
}) => {
  const [joinedStudents, setJoinedStudents] = useState<JoinedStudent[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);

  // Fetch joined students
  useEffect(() => {
    const fetchJoinedStudents = async () => {
      const { data, error } = await supabase
        .from("joined_students")
        .select("*")
        .eq("quiz_id", quiz.id)
        .order("joined_at", { ascending: true });

      if (error) {
        console.error("Error fetching joined students:", error);
        return;
      }

      setJoinedStudents(data?.map(student => ({
        id: student.id,
        quizId: student.quiz_id,
        studentId: student.student_id,
        studentName: student.student_name,
        joinedAt: student.joined_at
      })) || []);
    };

    fetchJoinedStudents();

    // Set up real-time subscription for joined students
    const channel = supabase
      .channel('joined-students-updates')
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
          toast.success(`${newStudent.studentName} joined the quiz!`);
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
          toast.info(`${deletedStudent.studentName} left the quiz`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [quiz.id]);

  const handleLaunchQuiz = async () => {
    if (joinedStudents.length === 0) {
      toast.error("Wait for at least one student to join before launching");
      return;
    }

    setIsLaunching(true);
    try {
      // Create or update quiz session to 'active' state
      const { error: sessionError } = await supabase
        .from("quiz_sessions")
        .upsert({
          quiz_id: quiz.id,
          session_state: 'active',
          launched_at: new Date().toISOString(),
          current_question: 0,
          question_start_time: new Date().toISOString()
        }, {
          onConflict: 'quiz_id'
        });

      if (sessionError) {
        throw sessionError;
      }

      toast.success("Quiz launched successfully!");
      onLaunchQuiz();
    } catch (error) {
      console.error("Error launching quiz:", error);
      toast.error("Failed to launch quiz. Please try again.");
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Room Code */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{quiz.title}</CardTitle>
              <p className="text-muted-foreground mt-1">{quiz.description}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-2 mb-2">
                <QrCode className="h-5 w-5" />
                <span className="text-sm font-medium">Room Code</span>
              </div>
              <Badge variant="default" className="text-2xl px-4 py-2 font-mono">
                {quiz.roomCode}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quiz Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Users className="h-8 w-8 text-quiz-primary" />
            <div>
              <div className="text-2xl font-bold">{joinedStudents.length}</div>
              <div className="text-sm text-muted-foreground">Students Joined</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Clock className="h-8 w-8 text-quiz-secondary" />
            <div>
              <div className="text-2xl font-bold">{quiz.questions.length}</div>
              <div className="text-sm text-muted-foreground">Total Questions</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-6">
            <Play className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-2xl font-bold">Ready to Launch</div>
              <div className="text-sm text-muted-foreground">Classnode Quiz</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Joined Students List */}
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
              <p className="text-muted-foreground">
                No students have joined yet. Share the room code: <strong>{quiz.roomCode}</strong>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {joinedStudents.map((student, index) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-quiz-primary/10 flex items-center justify-center">
                      <span className="text-quiz-primary font-semibold">
                        {student.studentName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{student.studentName}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(student.joinedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="secondary">#{index + 1}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Launch Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleLaunchQuiz}
          disabled={joinedStudents.length === 0 || isLaunching}
          size="lg"
          className="quiz-gradient px-12 py-4 text-lg"
        >
          <Play className="h-5 w-5 mr-2" />
          {isLaunching ? "Launching..." : "Launch Quiz"}
        </Button>
      </div>

      {joinedStudents.length === 0 && (
        <div className="text-center text-muted-foreground">
          <p>Students need to join using room code <strong>{quiz.roomCode}</strong> before you can launch the quiz.</p>
        </div>
      )}
    </div>
  );
};

export default ClassnodePreLaunchDashboard;