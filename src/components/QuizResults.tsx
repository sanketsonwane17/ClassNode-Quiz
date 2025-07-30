import React, { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizResult, Quiz } from "@/types/quiz";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, XAxis, YAxis, Bar, Cell, ResponsiveContainer, Legend, Tooltip, PieChart, Pie } from "recharts";
import { AlertCircle, Award, BarChart2, FileText, Users, Download, Brain, TrendingDown, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import QuestionAnalytics from "./QuestionAnalytics";
import { useQuizAnalytics } from "@/hooks/useQuizAnalytics";
import { generateDetailedCSV, generateMultiQuizCSV } from "@/utils/analyticsProcessor";

interface QuizResultsProps {
  results: QuizResult[];
  quizzes: Quiz[];
}

const QuizResults: React.FC<QuizResultsProps> = ({ results, quizzes }) => {
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  
  const selectedQuizData = useMemo(() => {
    if (selectedQuiz === "all") return null;
    return quizzes.find(q => q.id === selectedQuiz) || null;
  }, [selectedQuiz, quizzes]);

  const { 
    analytics, 
    detailedReport, 
    questionDifficultyDistribution, 
    mostMissedQuestions,
    commonMisconceptions 
  } = useQuizAnalytics(selectedQuizData, results);
  
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
    if (selectedQuiz !== "all" && detailedReport) {
      // Generate detailed analytics CSV for specific quiz
      console.log("Generating detailed CSV for quiz:", selectedQuizData?.title);
      const csvContent = generateDetailedCSV(detailedReport);
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `detailed-quiz-analytics-${selectedQuizData?.title || selectedQuiz}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate comprehensive analytics CSV for all quizzes
      console.log("Generating comprehensive analytics CSV for all quizzes");
      const csvContent = generateMultiQuizCSV(quizzes, filteredResults);
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `comprehensive-quiz-analytics-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const difficultyChartData = useMemo(() => {
    if (!questionDifficultyDistribution) return [];
    
    return [
      { name: "Easy (80%+)", value: questionDifficultyDistribution.easy, color: "#22c55e" },
      { name: "Medium (60-79%)", value: questionDifficultyDistribution.medium, color: "#f59e0b" },
      { name: "Hard (40-59%)", value: questionDifficultyDistribution.hard, color: "#f97316" },
      { name: "Very Hard (<40%)", value: questionDifficultyDistribution.veryHard, color: "#ef4444" }
    ].filter(item => item.value > 0);
  }, [questionDifficultyDistribution]);

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
            {selectedQuiz !== "all" ? "Download Detailed Analytics" : "Download Comprehensive Report"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          {selectedQuiz !== "all" && (
            <>
              <TabsTrigger value="questions">Question Analysis</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

          {/* Additional Analytics Cards for Single Quiz */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Brain className="h-5 w-5 mr-2" />
                    Question Difficulty Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {difficultyChartData.length > 0 ? (
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={difficultyChartData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {difficultyChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No difficulty data available</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <TrendingDown className="h-5 w-5 mr-2" />
                    Most Missed Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {mostMissedQuestions.slice(0, 3).map((question, index) => (
                      <div key={question.questionId} className="p-2 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-800">
                          Q{index + 1}: {question.questionText.substring(0, 50)}...
                        </p>
                        <p className="text-xs text-red-600">
                          Only {question.difficultyScore}% got this correct
                        </p>
                      </div>
                    ))}
                    {mostMissedQuestions.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No questions to analyze</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="h-5 w-5 mr-2" />
                Student Performance
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
        </TabsContent>

        {selectedQuiz !== "all" && analytics && (
          <TabsContent value="questions" className="space-y-6">
            <div className="space-y-6">
              {analytics.questions.map((questionAnalytics, index) => (
                <QuestionAnalytics
                  key={questionAnalytics.questionId}
                  analytics={questionAnalytics}
                  questionNumber={index + 1}
                />
              ))}
              {analytics.questions.length === 0 && (
                <div className="text-center py-12">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mb-2 mx-auto" />
                  <h3 className="text-lg font-medium">No question analysis available</h3>
                  <p className="text-muted-foreground">
                    Select a specific quiz to see detailed question analytics.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {selectedQuiz !== "all" && analytics && (
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2" />
                    Common Misconceptions
                  </CardTitle>
                  <CardDescription>
                    Most frequently selected wrong answers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {commonMisconceptions.slice(0, 5).map((misconception, index) => (
                      <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm font-medium text-orange-800">
                          {misconception.questionText.substring(0, 60)}...
                        </p>
                        <p className="text-xs text-orange-600 mt-1">
                          Wrong answer: "{misconception.wrongOption.substring(0, 40)}..."
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {misconception.count} students ({misconception.percentage}%)
                        </Badge>
                      </div>
                    ))}
                    {commonMisconceptions.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">No misconceptions data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="h-5 w-5 mr-2" />
                    Quiz Quality Metrics
                  </CardTitle>
                  <CardDescription>
                    Overall assessment of quiz effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Difficulty</span>
                      <Badge variant="outline">
                        {analytics.averageScore}% correct rate
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Question Balance</span>
                      <div className="flex gap-1">
                        <Badge className="bg-green-100 text-green-800">{questionDifficultyDistribution.easy} Easy</Badge>
                        <Badge className="bg-yellow-100 text-yellow-800">{questionDifficultyDistribution.medium} Medium</Badge>
                        <Badge className="bg-red-100 text-red-800">{questionDifficultyDistribution.hard + questionDifficultyDistribution.veryHard} Hard</Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Average Time per Question</span>
                      <Badge variant="outline">
                        {analytics.timeAnalytics.averageTimePerQuestion}s
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Participation Rate</span>
                      <Badge variant="outline">
                        {analytics.totalStudents} students
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default QuizResults;
