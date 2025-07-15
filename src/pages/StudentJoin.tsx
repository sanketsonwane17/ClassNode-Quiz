
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const StudentJoin = () => {
  const { login, setRoomCode } = useAuth();
  const [name, setName] = useState("");
  const [roomCode, setRoomCodeState] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { roomCode: urlRoomCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlRoomCode) {
      setRoomCodeState(urlRoomCode);
    }
  }, [urlRoomCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!roomCode.trim()) {
      toast.error("Please enter a room code");
      return;
    }

    setIsValidating(true);

    try {
      // Check if room code exists and is active
      const { data: quizData, error: quizError } = await supabase
        .from("quizzes")
        .select("id, is_active, room_code, title, quiz_type")
        .eq("room_code", roomCode.toUpperCase())
        .single();

      if (quizError || !quizData) {
        toast.error("Invalid room code. Please check and try again.");
        setIsValidating(false);
        return;
      }

      if (!quizData.is_active) {
        toast.error("This quiz is not currently active.");
        setIsValidating(false);
        return;
      }

      // Create a student profile
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert([{ name: name.trim() }])
        .select()
        .single();

      if (studentError) {
        console.error("Error creating student:", studentError);
        toast.error("Failed to join quiz. Please try again.");
        setIsValidating(false);
        return;
      }

      // For Classnode quizzes, add student to joined_students table and handle differently
      if (quizData.quiz_type === 'classnode') {
        const { error: joinError } = await supabase
          .from("joined_students")
          .insert([{
            quiz_id: quizData.id,
            student_id: studentData.id,
            student_name: name.trim()
          }]);

        if (joinError) {
          console.error("Error joining classnode quiz:", joinError);
          toast.error("Failed to join quiz. Please try again.");
          setIsValidating(false);
          return;
        }

        // Store quiz info in sessionStorage for Classnode quizzes instead of context
        sessionStorage.setItem('classnodeQuiz', JSON.stringify({
          id: quizData.id,
          title: quizData.title,
          roomCode: quizData.room_code,
          quizType: quizData.quiz_type
        }));

        // Store the room code and student ID in localStorage for persistence
        localStorage.setItem("quizRoomCode", roomCode.toUpperCase());
        localStorage.setItem("studentId", studentData.id);
        
        // Set room code in auth context
        setRoomCode(roomCode.toUpperCase());
        
        // Login the student
        login(name, "student");
        
        toast.success("Successfully joined the waiting room!");
        navigate("/student");
        return;
      }

      // Store the room code and student ID in localStorage for persistence
      localStorage.setItem("quizRoomCode", roomCode.toUpperCase());
      localStorage.setItem("studentId", studentData.id);
      
      // Set room code in auth context
      setRoomCode(roomCode.toUpperCase());
      
      // Login the student
      login(name, "student");
      
      console.log("Student joined successfully:", {
        studentId: studentData.id,
        roomCode: roomCode.toUpperCase(),
        quizTitle: quizData.title
      });
      
      // Navigate to student dashboard
      navigate("/student");
    } catch (error) {
      console.error("Error joining quiz:", error);
      toast.error("Failed to join quiz. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen quiz-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md mobile-card">
        <Card className="border-2 border-quiz-primary/20 shadow-lg">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="text-quiz-primary">Quiz</span>
              <span className="text-quiz-secondary">Flow</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Join a quiz session as a student
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm sm:text-base">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base h-12"
                  autoComplete="name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roomCode" className="text-sm sm:text-base">Room Code</Label>
                <Input
                  id="roomCode"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCodeState(e.target.value.toUpperCase())}
                  className="uppercase text-base h-12 font-mono"
                  maxLength={6}
                  autoComplete="off"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full quiz-gradient mobile-button"
                disabled={isValidating}
                size="lg"
              >
                {isValidating ? "Joining..." : "Join Quiz"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col justify-center gap-2 text-xs sm:text-sm text-gray-500 text-center">
            <p>Enter the room code provided by your teacher</p>
            <a href="/" className="text-quiz-primary hover:underline">Teacher? Login here</a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StudentJoin;
