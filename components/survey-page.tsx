"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Question = {
  id: number;
  text: string;
  options: string[];
};

const questions: Question[] = [
  {
    id: 1,
    text: "How often do you review your budget?",
    options: ["Daily", "Weekly", "Monthly", "Rarely"],
  },
  {
    id: 2,
    text: "What's your primary financial goal?",
    options: [
      "Saving for a big purchase",
      "Paying off debt",
      "Building an emergency fund",
      "Investing for the future",
    ],
  },
  {
    id: 3,
    text: "How comfortable are you with your current financial situation?",
    options: [
      "Very comfortable",
      "Somewhat comfortable",
      "Neutral",
      "Uncomfortable",
    ],
  },
];

export function SurveyPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const handleOptionSelect = (option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questions[currentQuestionIndex].id]: option,
    }));
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Financial Survey</h1>
      </header>

      <main className="flex-grow p-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg bg-white shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Question {currentQuestionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2 mb-6" />
            <h2 className="text-xl font-bold mb-6">
              {questions[currentQuestionIndex].text}
            </h2>
            <div className="space-y-4">
              {questions[currentQuestionIndex].options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3 px-4 rounded-lg"
                  onClick={() => handleOptionSelect(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {currentQuestionIndex === questions.length - 1 &&
          Object.keys(answers).length === questions.length && (
            <Card className="w-full max-w-lg mt-6 bg-white shadow-lg">
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
