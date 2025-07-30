
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuizQuestion, Quiz } from "@/types/quiz";
import { useQuiz } from "@/contexts/quiz";
import { PlusCircle, Trash2, Edit, Save, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CreateQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({ isOpen, onClose }) => {
  const { createQuiz, loading } = useQuiz();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [currentOptions, setCurrentOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(0);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTimePerQuestion(30);
    setQuestions([]);
    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setCurrentQuestionText("");
    setCurrentOptions(["", "", "", ""]);
    setCorrectOption(0);
    setEditingQuestionIndex(null);
  };

  const handleAddQuestion = () => {
    console.log("Adding/updating question:", { currentQuestionText, currentOptions, correctOption });
    
    // Enhanced validation
    if (!currentQuestionText.trim()) {
      toast.error("Please enter a question");
      return;
    }

    if (currentQuestionText.trim().length < 5) {
      toast.error("Question must be at least 5 characters long");
      return;
    }

    if (currentOptions.some(option => !option.trim())) {
      toast.error("Please fill in all options");
      return;
    }

    if (currentOptions.some(option => option.trim().length < 1)) {
      toast.error("Each option must have content");
      return;
    }

    // Check for duplicate options
    const trimmedOptions = currentOptions.map(opt => opt.trim().toLowerCase());
    if (new Set(trimmedOptions).size !== trimmedOptions.length) {
      toast.error("All options must be unique");
      return;
    }

    if (correctOption < 0 || correctOption >= currentOptions.length) {
      toast.error("Please select a valid correct option");
      return;
    }

    const newQuestion: QuizQuestion = {
      id: editingQuestionIndex !== null ? 
        questions[editingQuestionIndex].id : 
        `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: currentQuestionText.trim(),
      options: currentOptions.map(opt => opt.trim()),
      correctOption
    };
    
    console.log("Created question:", newQuestion);

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, newQuestion]);
    }

    resetQuestionForm();
  };

  const handleEditQuestion = (index: number) => {
    const question = questions[index];
    setCurrentQuestionText(question.text);
    setCurrentOptions([...question.options]);
    setCorrectOption(question.correctOption);
    setEditingQuestionIndex(index);
  };

  const handleDeleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...currentOptions];
    updatedOptions[index] = value;
    setCurrentOptions(updatedOptions);
  };

  const handleSubmit = async () => {
    console.log("Submitting quiz:", { title, description, questions, timePerQuestion });
    
    // Enhanced validation
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }

    if (title.trim().length < 3) {
      toast.error("Quiz title must be at least 3 characters long");
      return;
    }

    if (!description.trim()) {
      toast.error("Please enter a quiz description");
      return;
    }

    if (description.trim().length < 10) {
      toast.error("Quiz description must be at least 10 characters long");
      return;
    }

    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    if (questions.length > 50) {
      toast.error("Maximum 50 questions allowed per quiz");
      return;
    }

    if (timePerQuestion < 10 || timePerQuestion > 300) {
      toast.error("Time per question must be between 10 and 300 seconds");
      return;
    }

    // Validate all questions one more time
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if (!question.text.trim()) {
        toast.error(`Question ${i + 1} is missing text`);
        return;
      }
      if (question.options.some(opt => !opt.trim())) {
        toast.error(`Question ${i + 1} has empty options`);
        return;
      }
    }

    try {
      await createQuiz({
        title: title.trim(),
        description: description.trim(),
        questions,
        timePerQuestion
      });

      resetForm();
      onClose();
      toast.success("Quiz created successfully!");
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast.error("Failed to create quiz. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Quiz</DialogTitle>
          <DialogDescription>
            Add questions and options for your interactive quiz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Quiz Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
              />
            </div>
            <div>
              <Label htmlFor="time">Time per Question (seconds)</Label>
              <Input
                id="time"
                type="number"
                min={10}
                max={300}
                value={timePerQuestion}
                onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter quiz description"
              className="resize-none"
            />
          </div>

          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-medium mb-2">
              {editingQuestionIndex !== null ? "Edit Question" : "Add New Question"}
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="questionText">Question</Label>
                <Textarea
                  id="questionText"
                  value={currentQuestionText}
                  onChange={(e) => setCurrentQuestionText(e.target.value)}
                  placeholder="Enter your question"
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Options (select the correct one)</Label>
                {currentOptions.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant={correctOption === index ? "default" : "outline"}
                      onClick={() => setCorrectOption(index)}
                      className={correctOption === index ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      Correct
                    </Button>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end space-x-2">
                {editingQuestionIndex !== null && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={resetQuestionForm}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel Edit
                  </Button>
                )}
                <Button 
                  type="button" 
                  onClick={handleAddQuestion}
                  className={editingQuestionIndex !== null ? "bg-amber-500 hover:bg-amber-600" : ""}
                >
                  {editingQuestionIndex !== null ? (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Update Question
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add Question
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {questions.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2">Questions ({questions.length})</h3>
              <div className="space-y-2">
                {questions.map((question, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex justify-between">
                        <div className="font-medium">Q{index + 1}: {question.text}</div>
                        <div className="flex space-x-1">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => handleEditQuestion(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteQuestion(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div className="font-medium">Options:</div>
                        <ol className="list-decimal list-inside">
                          {question.options.map((option, optIndex) => (
                            <li 
                              key={optIndex}
                              className={optIndex === question.correctOption ? "text-green-600 font-medium" : ""}
                            >
                              {option} {optIndex === question.correctOption && "(Correct)"}
                            </li>
                          ))}
                        </ol>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="quiz-gradient">
            {loading ? "Creating..." : "Create Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizModal;