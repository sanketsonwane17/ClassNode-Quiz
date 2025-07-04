import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentJoin from "./pages/StudentJoin";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { QuizProvider } from "./contexts/quiz";
import { inject } from '@vercel/analytics'; // ✅ Vercel Analytics

// Create a new QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  // Inject Vercel Analytics script once when the app mounts
  useEffect(() => {
    inject();
  }, []);

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <QuizProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Login />} />
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/join/:roomCode?" element={<StudentJoin />} />
                  <Route path="/student" element={<StudentDashboard />} />
                  <Route path="/room/:roomCode" element={<StudentJoin />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </QuizProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
