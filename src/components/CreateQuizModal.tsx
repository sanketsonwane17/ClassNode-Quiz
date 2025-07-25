
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
    if (!currentQuestionText.trim()) {
      toast.error("Please enter a question");
      return;
    }
    if (currentOptions.some(option => !option.trim())) {
      toast.error("Please fill in all options");
      return;
    }

    const newQuestion: QuizQuestion = {
      id: editingQuestionIndex !== null ? questions[editingQuestionIndex].id : Date.now().toString(),
      text: currentQuestionText,
      options: [...currentOptions],
      correctOption,
    };

    if (editingQuestionIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setQuestions(updatedQuestions);
    } else {
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

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error("Please enter a quiz title");
      return;
    }
    if (!description.trim()) {
      toast.error("Please enter a quiz description");
      return;
    }
    if (questions.length === 0) {
      toast.error("Please add at least one question");
      return;
    }

    createQuiz({ title, description, questions, timePerQuestion });
    resetForm();
    onClose();
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div key={index} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
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

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                {editingQuestionIndex !== null && (
                  <Button type="button" variant="outline" onClick={resetQuestionForm}>
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
                      <div className="flex flex-col sm:flex-row justify-between gap-2">
                        <div className="font-medium">Q{index + 1}: {question.text}</div>
                        <div className="flex space-x-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(index)}>
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

        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto quiz-gradient"
          >
            {loading ? "Creating..." : "Create Quiz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateQuizModal;
