import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionAnalytics as QuestionAnalyticsType } from "@/types/analytics";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Users } from "lucide-react";

interface QuestionAnalyticsProps {
  analytics: QuestionAnalyticsType;
  questionNumber: number;
}

const QuestionAnalytics: React.FC<QuestionAnalyticsProps> = ({ 
  analytics, 
  questionNumber 
}) => {
  const getDifficultyColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getDifficultyLabel = (score: number) => {
    if (score >= 80) return "Easy";
    if (score >= 60) return "Medium";
    if (score >= 40) return "Hard";
    return "Very Hard";
  };

  const getDiscriminationColor = (index: number) => {
    if (index >= 30) return "text-green-600";
    if (index >= 20) return "text-yellow-600";
    if (index >= 10) return "text-orange-600";
    return "text-red-600";
  };

  const chartData = analytics.optionDistribution.map((option, index) => ({
    option: String.fromCharCode(65 + index), // A, B, C, D
    count: option.count,
    percentage: option.percentage,
    isCorrect: option.isCorrect,
    text: option.optionText.substring(0, 30) + (option.optionText.length > 30 ? "..." : "")
  }));

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Question {questionNumber}</CardTitle>
          <div className="flex gap-2">
            <Badge 
              variant="secondary" 
              className={`${getDifficultyColor(analytics.difficultyScore)} text-white`}
            >
              {getDifficultyLabel(analytics.difficultyScore)}
            </Badge>
            <Badge variant="outline">
              {analytics.totalResponses} responses
            </Badge>
          </div>
        </div>
        <CardDescription className="text-left">
          {analytics.questionText}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Statistics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Difficulty</p>
              <p className="text-lg font-bold">{analytics.difficultyScore}%</p>
              <p className="text-xs text-muted-foreground">got it correct</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <TrendingUp className={`h-5 w-5 ${getDiscriminationColor(analytics.discriminationIndex)}`} />
            <div>
              <p className="text-sm font-medium">Discrimination</p>
              <p className={`text-lg font-bold ${getDiscriminationColor(analytics.discriminationIndex)}`}>
                {analytics.discriminationIndex}%
              </p>
              <p className="text-xs text-muted-foreground">separates performers</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Responses</p>
              <p className="text-lg font-bold">{analytics.totalResponses}</p>
              <p className="text-xs text-muted-foreground">total students</p>
            </div>
          </div>
        </div>

        {/* Response Distribution Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3">Response Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <XAxis 
                  dataKey="option" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value}% (${props.payload.count} students)`,
                    "Response Rate"
                  ]}
                  labelFormatter={(label: string, payload: any) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `Option ${label}: ${data.text}`;
                    }
                    return `Option ${label}`;
                  }}
                  contentStyle={{ 
                    backgroundColor: "white", 
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0"
                  }}
                />
                <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isCorrect ? "#22c55e" : "#6366f1"} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Option Breakdown */}
        <div>
          <h4 className="text-sm font-medium mb-3">Option Breakdown</h4>
          <div className="space-y-2">
            {analytics.optionDistribution.map((option, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  option.isCorrect 
                    ? "bg-green-50 border-green-200" 
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${
                      option.isCorrect ? "text-green-700" : "text-gray-700"
                    }`}>
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span className={`text-sm ${
                      option.isCorrect ? "text-green-700" : "text-gray-700"
                    }`}>
                      {option.optionText}
                    </span>
                    {option.isCorrect && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Correct
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">
                      {option.count} ({option.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuestionAnalytics;