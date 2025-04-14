
import { createContext } from "react";
import { QuizContextType } from "@/types/quiz";

export const QuizContext = createContext<QuizContextType | undefined>(undefined);
