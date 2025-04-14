
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizResult, Quiz } from "@/types/quiz";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, XAxis, YAxis, Bar, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertCircle, Award, BarChart2, FileText, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuizResultsProps {
  results: QuizResult[];
  quizzes: Quiz[];
}

const QuizResults: React.FC<QuizResultsProps> = ({ results, quizzes }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  
  const filteredResults = useMemo(() => {
    if (selectedQuiz === "all") {
      return results;
    }
    return results.filter(result => result.quizId === selectedQuiz);
  }, [results, selectedQuiz]);
  
  const chartData = useMemo(() => {
    const data: { name: string; score: number; color: string }[] = [];
    
    filteredResults.forEach(result => {
      const percentScore = Math.round((result.score / result.totalQuestions) * 100);
      let color = "#6366f1"; // Default color
      
      if (percentScore >= 80) {
        color = "#22c55e"; // Green for high scores
      } else if (percentScore < 50) {
        color = "#ef4444"; // Red for low scores
      } else {
        color = "#f59e0b"; // Amber for medium scores
      }
      
      data.push({
        name: result.studentName,
        score: percentScore,
        color
      });
    });
    
    return data.sort((a, b) => b.score - a.score).slice(0, 10); // Top 10 scores
  }, [filteredResults]);
  
  const averageScore = useMemo(() => {
    if (filteredResults.length === 0) return 0;
    const total = filteredResults.reduce((sum, result) => {
      return sum + (result.score / result.totalQuestions) * 100;
    }, 0);
    return Math.round(total / filteredResults.length);
  }, [filteredResults]);
  
  const uniqueStudents = useMemo(() => {
    return new Set(filteredResults.map(r => r.studentId)).size;
  }, [filteredResults]);

  // Function to download quiz results as CSV
  const downloadResults = () => {
    // Create CSV header
    let csvContent = "Student Name,Quiz Name,Score,Percentage,Date\n";
    
    // Add data rows
    filteredResults.forEach(result => {
      const quiz = quizzes.find(q => q.id === result.quizId);
      const quizName = quiz ? quiz.title : "Unknown Quiz";
      const percentage = Math.round((result.score / result.totalQuestions) * 100);
      const date = new Date().toLocaleDateString(); // Use current date as fallback since timestamp is missing
      
      csvContent += `"${result.studentName}","${quizName}",${result.score}/${result.totalQuestions},${percentage}%,"${date}"\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quiz-results-${selectedQuiz === "all" ? "all" : "quiz-" + selectedQuiz}.csv`);
    document.body.appendChild(link);
    
    // Download file
    link.click();
    
    // Clean up
    document.body.removeChild(link);
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block p-4 rounded-full bg-muted mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No results yet</h3>
        <p className="text-muted-foreground">
          Results will appear here after students complete quizzes.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Quiz Results</h2>
        
        <div className="flex gap-2 items-center">
          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a quiz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              {quizzes.map(quiz => (
                <SelectItem key={quiz.id} value={quiz.id}>{quiz.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={downloadResults}
            disabled={filteredResults.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Download Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Score</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-amber-500" />
            <div className="text-2xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes Completed</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            <div className="text-2xl font-bold">{filteredResults.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students Participated</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Users className="h-5 w-5 mr-2 text-green-500" />
            <div className="text-2xl font-bold">{uniqueStudents}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="h-5 w-5 mr-2" />
            Performance Overview
          </CardTitle>
          <CardDescription>
            Top student performances {selectedQuiz !== "all" && "for selected quiz"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 40,
                  }}
                >
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, "Score"]}
                    labelStyle={{ color: "black" }}
                    contentStyle={{ backgroundColor: "white", borderRadius: "8px" }}
                  />
                  <Legend />
                  <Bar 
                    name="Score (%)" 
                    dataKey="score" 
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">No data available</h3>
              <p className="text-muted-foreground">
                There are no results for the selected quiz.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
