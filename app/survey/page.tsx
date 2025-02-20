"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";

type QuestionType = "single" | "multiple" | "singleWithOther" | "number";

type Question = {
  id: number;
  text: string;
  type: QuestionType;
  options?: string[];
};

const questions: Question[] = [
  {
    id: 1,
    text: "How often do you review your budget?",
    type: "single",
    options: ["Daily", "Weekly", "Monthly", "Rarely"],
  },
  {
    id: 2,
    text: "Which financial tools do you currently use? (Select all that apply)",
    type: "multiple",
    options: ["Budgeting app", "Spreadsheet", "Financial advisor", "None"],
  },
  {
    id: 3,
    text: "What's your primary method of saving money?",
    type: "singleWithOther",
    options: [
      "Automatic transfers",
      "Manual deposits",
      "Cutting expenses",
      "Increasing income",
    ],
  },
  {
    id: 4,
    text: "What percentage of your income do you currently save?",
    type: "number",
  },
];

export default function SurveyPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<number, string | string[] | number>
  >({});
  const [otherAnswer, setOtherAnswer] = useState("");
  const [multipleChoiceSelections, setMultipleChoiceSelections] = useState<
    Record<number, string[]>
  >({});
  const [numberInputs, setNumberInputs] = useState<Record<number, string>>({});
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const completionCardRef = useRef<HTMLDivElement | null>(null);

  const handleSingleChoice = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].id]: option,
    }));
    goToNextQuestion();
  };

  const handleMultipleChoice = (questionId: number, option: string) => {
    setMultipleChoiceSelections((prev) => {
      const currentSelections = prev[questionId] || [];
      let newSelections: string[];

      if (option === "None") {
        newSelections = currentSelections.includes("None") ? [] : ["None"];
      } else {
        newSelections = currentSelections.includes(option)
          ? currentSelections.filter(
              (item) => item !== option && item !== "None",
            )
          : [...currentSelections.filter((item) => item !== "None"), option];
      }

      return { ...prev, [questionId]: newSelections };
    });
  };

  const confirmMultipleChoice = () => {
    const questionId = questions[currentQuestionIndex].id;
    setAnswers((prev) => ({
      ...prev,
      [questionId]: multipleChoiceSelections[questionId] || [],
    }));
    goToNextQuestion();
  };

  const handleSingleWithOther = (option: string) => {
    if (option === "Other") {
      setOtherAnswer("");
      setAnswers((prev) => ({
        ...prev,
        [questions[currentQuestionIndex].id]: "Other",
      }));
    } else {
      setAnswers((prev) => ({
        ...prev,
        [questions[currentQuestionIndex].id]: option,
      }));
      goToNextQuestion();
    }
  };

  const confirmOtherAnswer = () => {
    if (otherAnswer.trim() !== "") {
      setAnswers((prev) => ({
        ...prev,
        [questions[currentQuestionIndex].id]: otherAnswer,
      }));
      goToNextQuestion();
    }
  };

  const handleNumberInput = (questionId: number, value: string) => {
    setNumberInputs((prev) => ({ ...prev, [questionId]: value }));
  };

  const confirmNumberInput = () => {
    const questionId = questions[currentQuestionIndex].id;
    const numberValue = Number.parseFloat(numberInputs[questionId] || "");
    if (!isNaN(numberValue)) {
      setAnswers((prev) => ({ ...prev, [questionId]: numberValue }));
      if (isLastQuestion) {
        validateAndComplete();
      } else {
        goToNextQuestion();
      }
    }
  };

  const goToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const validateAndComplete = () => {
    const unansweredQuestionIndex = questions.findIndex(
      (q) => !(q.id in answers),
    );
    if (unansweredQuestionIndex !== -1) {
      setCurrentQuestionIndex(unansweredQuestionIndex);
    } else {
      // All questions are answered, scroll to completion card
      setTimeout(() => {
        completionCardRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  useEffect(() => {
    if (questionRefs.current[currentQuestionIndex]) {
      questionRefs.current[currentQuestionIndex]?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [currentQuestionIndex]);

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const isOptionSelected = (questionId: number, option: string) => {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
      return answer.includes(option);
    }
    return answer === option;
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Financial Survey</h1>
        <Progress value={progress} className="h-2 mt-2" />
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-6">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className={`bg-white shadow-lg ${index !== currentQuestionIndex ? "hidden" : ""}`}
              ref={(el) => {
                questionRefs.current[index] = el;
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-700">
                  Question {index + 1}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="text-xl font-bold mb-6">{question.text}</h2>
                {question.type === "single" && (
                  <div className="space-y-4">
                    {question.options?.map((option, optionIndex) => (
                      <Button
                        key={optionIndex}
                        variant={
                          isOptionSelected(question.id, option)
                            ? "default"
                            : "outline"
                        }
                        className={`w-full justify-start text-left h-auto py-3 px-4 rounded-lg ${
                          isOptionSelected(question.id, option)
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : ""
                        }`}
                        onClick={() => handleSingleChoice(option)}
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                )}
                {question.type === "multiple" && (
                  <div className="space-y-4">
                    {question.options?.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`${question.id}-${optionIndex}`}
                          checked={(
                            multipleChoiceSelections[question.id] || []
                          ).includes(option)}
                          onCheckedChange={() =>
                            handleMultipleChoice(question.id, option)
                          }
                          disabled={
                            option !== "None" &&
                            (
                              multipleChoiceSelections[question.id] || []
                            ).includes("None")
                          }
                          className="border-purple-300 text-purple-600 focus:ring-purple-500"
                        />
                        <Label
                          htmlFor={`${question.id}-${optionIndex}`}
                          className={`${(multipleChoiceSelections[question.id] || []).includes(option) ? "text-purple-700" : ""}`}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                    <Button
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={confirmMultipleChoice}
                      disabled={
                        (multipleChoiceSelections[question.id] || []).length ===
                        0
                      }
                    >
                      Confirm Selection
                    </Button>
                  </div>
                )}
                {question.type === "singleWithOther" && (
                  <div className="space-y-4">
                    {question.options?.map((option, optionIndex) => (
                      <Button
                        key={optionIndex}
                        variant={
                          isOptionSelected(question.id, option)
                            ? "default"
                            : "outline"
                        }
                        className={`w-full justify-start text-left h-auto py-3 px-4 rounded-lg ${
                          isOptionSelected(question.id, option)
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : ""
                        }`}
                        onClick={() => handleSingleWithOther(option)}
                      >
                        {option}
                      </Button>
                    ))}
                    <Button
                      variant={
                        isOptionSelected(question.id, "Other")
                          ? "default"
                          : "outline"
                      }
                      className={`w-full justify-start text-left h-auto py-3 px-4 rounded-lg ${
                        isOptionSelected(question.id, "Other")
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : ""
                      }`}
                      onClick={() => handleSingleWithOther("Other")}
                    >
                      Other
                    </Button>
                    {answers[question.id] === "Other" && (
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="Enter your answer"
                          value={otherAnswer}
                          onChange={(e) => setOtherAnswer(e.target.value)}
                          className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                        />
                        <Button
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={confirmOtherAnswer}
                        >
                          Confirm
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {question.type === "number" && (
                  <div className="space-y-4">
                    <Input
                      type="number"
                      placeholder="Enter a number"
                      value={numberInputs[question.id] || ""}
                      onChange={(e) =>
                        handleNumberInput(question.id, e.target.value)
                      }
                      className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={confirmNumberInput}
                    >
                      Confirm
                    </Button>
                  </div>
                )}
                <div className="flex justify-between mt-6">
                  <Button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="border-purple-300 text-purple-700 hover:bg-purple-100"
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                  </Button>
                  {!isLastQuestion && (
                    <Button
                      onClick={goToNextQuestion}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {isLastQuestion && (
                    <Button
                      onClick={validateAndComplete}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      Complete Survey
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(answers).length === questions.length && (
          <Card
            className="max-w-lg mx-auto mt-6 bg-white shadow-lg"
            ref={completionCardRef}
          >
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-700">
                Survey Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-green-600 font-semibold">
                Thank you for completing the survey!
              </p>
              <p className="mt-2 text-gray-600">
                Your responses have been recorded.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
