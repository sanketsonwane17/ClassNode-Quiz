import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StudentHeader: React.FC = () => {
  const { user, logout, roomCode } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
        
        {/* App Name and Role */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
          <h1 className="text-xl sm:text-2xl font-bold leading-tight">
            <span className="text-quiz-primary">Class</span>
            <span className="text-quiz-secondary">Node</span>
          </h1>
          <span className="text-xs sm:text-sm bg-gray-100 px-2 py-0.5 rounded-md">
            Student
          </span>
        </div>

        {/* Room Code and Logout */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          {roomCode && (
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="text-sm text-gray-500">Room:</span>
              <span className="font-mono font-bold text-sm bg-quiz-primary/10 text-quiz-primary px-2 py-1 rounded-md">
                {roomCode}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="px-3 py-2"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>

      </div>
    </header>
  );
};

export default StudentHeader;
