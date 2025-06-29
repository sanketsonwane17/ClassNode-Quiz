import React from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StudentHeader: React.FC = () => {
  const { user, logout, roomCode } = useAuth();

  if (!user) return null;

  return (
    <header className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Logo + Role */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold">
            <span className="text-quiz-primary">Class</span>
            <span className="text-quiz-secondary">Node</span>
          </h1>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-md">
            Student
          </span>
        </div>

        {/* Room Code + Logout */}
        <div className="flex items-center gap-4">
          {roomCode && (
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">Room:</span>
              <span className="font-mono font-semibold text-sm bg-quiz-primary/10 text-quiz-primary px-2 py-1 rounded-md">
                {roomCode}
              </span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default StudentHeader;
