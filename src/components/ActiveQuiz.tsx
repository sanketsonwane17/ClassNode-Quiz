import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Quiz, StudentAnswer } from "@/types/quiz";
import { useQuiz } from "@/contexts/quiz";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StopCircle, Users, CheckCircle, XCircle, UserPlus, User } from "lucide-react";

interface ActiveQuizProps {
  quiz: Quiz;
  studentAnswers: StudentAnswer[];
  onEndQuiz: () => void;
}

const ActiveQuiz: React.FC<ActiveQuizProps> = ({ quiz, studentAnswers, onEndQuiz }) => {
  const { currentQuestion } = useQuiz();
  const [uniqueStudents, setUniqueStudents] = useState<string[]>([]);
  const [answersForCurrentQuestion, setAnswersForCurrentQuestion] = useState<StudentAnswer[]>([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [studentNames, setStudentNames] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Calculate unique students from all student answers
    const studentIds = new Set<string>();
    const nameMap: {[key: string]: string} = {};
    
    studentAnswers.forEach(answer => {
      studentIds.add(answer.studentId);
      if (answer.studentName) {
        nameMap[answer.studentId] = answer.studentName;
      }
    });
    
    setUniqueStudents(Array.from(studentIds));
    setStudentNames(nameMap);
    
    // Filter answers for current question
    if (quiz && quiz.questions[currentQuestion]) {
      const currentQuestionId = quiz.questions[currentQuestion].id;
      const filteredAnswers = studentAnswers.filter(a => a.questionId === currentQuestionId);
      setAnswersForCurrentQuestion(filteredAnswers);
      
      // Count correct and incorrect answers
      setCorrectCount(filteredAnswers.filter(a => a.correct).length);
      setIncorrectCount(filteredAnswers.filter(a => !a.correct).length);
    }
  }, [quiz, studentAnswers, currentQuestion]);

  console.log("Student answers:", studentAnswers);
  console.log("Unique students:", uniqueStudents);
  console.log("Student names:", studentNames);
  console.log("Current question answers:", answersForCurrentQuestion);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          <p className="text-muted-foreground">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Card className="flex items-center p-2 bg-blue-50">
            <Users className="h-5 w-5 text-blue-500 mr-2" />
            <div>
              <p className="text-sm font-medium">Students connected</p>
              <p className="text-xl font-bold">{uniqueStudents.length}</p>
            </div>
          </Card>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <StopCircle className="h-4 w-4 mr-1" />
                End Quiz
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>End this quiz?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will end the active quiz for all students. Results will still be available.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onEndQuiz}>End Quiz</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-white rounded-md border p-6">
        <h3 className="text-xl font-bold mb-4">
          {quiz.questions[currentQuestion].text}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {quiz.questions[currentQuestion].options.map((option, index) => {
            const isCorrect = quiz.questions[currentQuestion].correctOption === index;
            
            return (
              <div 
                key={index}
                className={p-4 rounded-md border-2 ${
                  isCorrect 
                    ? "border-green-400 bg-green-50" 
                    : "border-gray-200"
                }}
              >
                <div className="flex justify-between items-center">
                  <span className={isCorrect ? "font-medium" : ""}>
                    {option}
                  </span>
                  {isCorrect && <CheckCircle className="h-5 w-5 text-green-500" />}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">
                Student Responses: {answersForCurrentQuestion.length}/{uniqueStudents.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round((answersForCurrentQuestion.length / Math.max(1, uniqueStudents.length)) * 100)}%
              </span>
            </div>
            <Progress value={(answersForCurrentQuestion.length / Math.max(1, uniqueStudents.length)) * 100} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Correct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {correctCount}
                  <span className="text-lg text-muted-foreground ml-1">
                    ({answersForCurrentQuestion.length > 0 
                      ? Math.round((correctCount / answersForCurrentQuestion.length) * 100) 
                      : 0}%)
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-red-600">
                  <XCircle className="h-5 w-5 mr-2" />
                  Incorrect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {incorrectCount}
                  <span className="text-lg text-muted-foreground ml-1">
                    ({answersForCurrentQuestion.length > 0 
                      ? Math.round((incorrectCount / answersForCurrentQuestion.length) * 100) 
                      : 0}%)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-lg mb-2">
          Connected Students ({uniqueStudents.length})
        </h3>
        {uniqueStudents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {uniqueStudents.map((studentId) => {
              const studentName = studentNames[studentId] || Student ${studentId.substring(0, 4)};
              return (
                <Card key={studentId} className="p-2 flex items-center space-x-2">
                  <div className="bg-blue-100 text-blue-500 p-2 rounded-full">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-medium">
                    {studentName}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed border-2 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-6">
              <UserPlus className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Waiting for students to join</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Share your room code with students to let them join the quiz.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ActiveQuiz;
