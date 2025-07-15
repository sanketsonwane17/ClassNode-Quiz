import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Users } from "lucide-react";

interface StudentRanking {
  id: string;
  name: string;
  score: number;
  position: number;
  isCurrentUser?: boolean;
}

interface AnimatedLeaderboardProps {
  rankings: StudentRanking[];
  title?: string;
}

const AnimatedLeaderboard: React.FC<AnimatedLeaderboardProps> = ({ 
  rankings, 
  title = "Live Rankings" 
}) => {
  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getRankingColor = (position: number, isCurrentUser?: boolean) => {
    if (isCurrentUser) return "bg-quiz-primary/20 border-quiz-primary/40";
    if (position === 1) return "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200";
    if (position === 2) return "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200";
    if (position === 3) return "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200";
    return "bg-background border-border";
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-quiz-primary" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {rankings.length} students
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rankings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No students have answered yet</p>
          </div>
        ) : (
          rankings.map((student, index) => (
            <div
              key={student.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border transition-all duration-500 ease-out
                hover:scale-[1.02] hover:shadow-md
                ${getRankingColor(student.position, student.isCurrentUser)}
                ${student.isCurrentUser ? 'ring-2 ring-quiz-primary/30' : ''}
                animate-slide-in-right
              `}
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: 'both'
              }}
            >
              <div className="flex items-center justify-center w-10 h-10">
                {getRankIcon(student.position)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium truncate ${student.isCurrentUser ? 'text-quiz-primary' : ''}`}>
                    {student.name}
                  </p>
                  {student.isCurrentUser && (
                    <Badge variant="default" className="text-xs">You</Badge>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-quiz-primary animate-pulse">
                  {student.score}
                </div>
                <div className="text-xs text-muted-foreground">points</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AnimatedLeaderboard;