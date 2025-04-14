/**
 * This file serves as an adapter between the React frontend and Django backend.
 * It provides methods for making API calls to the Django REST API endpoints.
 */

import { Quiz, QuizQuestion, QuizResult, StudentAnswer } from "@/types/quiz";
import { toast } from "sonner";

const API_BASE_URL = '/api'; // Adjust this to match your Django API URL

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    // Get error message from the response body
    let errorMessage = 'An error occurred';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If we can't parse the error, use the status text
      errorMessage = response.statusText;
    }
    
    throw new Error(errorMessage);
  }
  
  return response.json();
};

// API utility functions
export const djangoApiService = {
  // Quiz CRUD operations
  fetchQuizzes: async (): Promise<Quiz[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/`);
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to fetch quizzes');
      console.error('Error fetching quizzes:', error);
      return [];
    }
  },
  
  fetchQuizById: async (quizId: string): Promise<Quiz | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/`);
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to fetch quiz');
      console.error('Error fetching quiz:', error);
      return null;
    }
  },
  
  createQuiz: async (quiz: Omit<Quiz, 'id' | 'createdAt' | 'createdBy'>, teacherId: string): Promise<Quiz | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...quiz,
          created_by: teacherId
        }),
      });
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to create quiz');
      console.error('Error creating quiz:', error);
      return null;
    }
  },
  
  updateQuiz: async (quizId: string, quiz: Partial<Quiz>): Promise<Quiz | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quiz),
      });
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to update quiz');
      console.error('Error updating quiz:', error);
      return null;
    }
  },
  
  deleteQuiz: async (quizId: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        return true;
      }
      
      throw new Error('Failed to delete quiz');
    } catch (error) {
      toast.error('Failed to delete quiz');
      console.error('Error deleting quiz:', error);
      return false;
    }
  },
  
  // Quiz results operations
  fetchQuizResults: async (): Promise<QuizResult[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz-results/`);
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to fetch quiz results');
      console.error('Error fetching quiz results:', error);
      return [];
    }
  },
  
  submitQuizResult: async (result: QuizResult): Promise<QuizResult | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz-results/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(result),
      });
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to submit quiz result');
      console.error('Error submitting quiz result:', error);
      return null;
    }
  },
  
  // Student answer operations
  submitAnswer: async (answer: StudentAnswer): Promise<StudentAnswer | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/submit-answer/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(answer),
      });
      return handleResponse(response);
    } catch (error) {
      toast.error('Failed to submit answer');
      console.error('Error submitting answer:', error);
      return null;
    }
  },
  
  // Quiz launching operations
  launchQuiz: async (quizId: string, roomCode: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/launch-quiz/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quiz_id: quizId, room_code: roomCode }),
      });
      
      if (response.ok) {
        return true;
      }
      
      throw new Error('Failed to launch quiz');
    } catch (error) {
      toast.error('Failed to launch quiz');
      console.error('Error launching quiz:', error);
      return false;
    }
  },
  
  endQuiz: async (roomCode: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/end-quiz/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ room_code: roomCode }),
      });
      
      if (response.ok) {
        return true;
      }
      
      throw new Error('Failed to end quiz');
    } catch (error) {
      toast.error('Failed to end quiz');
      console.error('Error ending quiz:', error);
      return false;
    }
  },
};

export default djangoApiService;
