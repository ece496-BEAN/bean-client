"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { GeneratedSubcategories } from "../api/budget-chat/generate-subcategories/route";

type QuestionType = "single" | "multiple" | "singleWithOther" | "number";

type Question = {
  text: string;
  type: QuestionType;
  options?: string[];
};

interface GetCategoryAction {
  type: "get_category";
  category: string;
}

interface GetSubcategoryAction {
  type: "get_subcategory";
  category: string;
  subcategory: string;
  examples: string;
}

type Action = GetCategoryAction | GetSubcategoryAction;
type ActionStack = Action[];

const initialActionStack: ActionStack = [
  { type: "get_category", category: "Housing" },
  { type: "get_category", category: "Transportation" },
  { type: "get_category", category: "Food" },
  { type: "get_category", category: "Entertainment" },
];

interface Budget {
  [key: string]: number;
}

function generateQuestionFromAction(action: Action): Question {
  switch (action.type) {
    case "get_category":
      return {
        text: `How much do you spend on ${action.category} per month?`,
        type: "number",
      };
    case "get_subcategory":
      return {
        text: `${action.category}: How much do you spend on ${action.subcategory} per month?
        Examples: ${action.examples}`,
        type: "number",
      };
  }
}

export default function SurveyPage() {
  const [actionStack, setActionStack] =
    useState<ActionStack>(initialActionStack);
  const [budget, setBudget] = useState<Budget>({});

  const [questions, setQuestions] = useState<Question[]>([
    generateQuestionFromAction(actionStack[0]),
  ]);
  const [questionCount, setQuestionCount] = useState<number>(1);
  const [numberInput, setNumberInput] = useState<number>(0);

  const handleInput = () => {
    const action = actionStack[0];
    console.log("parsing action: ", action);
    const category = action.category;

    let newBudgetValue = numberInput;
    if (action.type === "get_subcategory") {
      newBudgetValue = budget[category] + numberInput;
    }
    const newBudget = { ...budget, [category]: newBudgetValue };
    setBudget(newBudget);
    console.log("updated budget: ", newBudget);

    if (actionStack.length > 1) {
      const newStack = actionStack.slice(1);
      setActionStack(newStack);
      setQuestions((prev) => [
        ...prev,
        generateQuestionFromAction(newStack[0]),
      ]);
      setQuestionCount((prev) => prev + 1);
    } else {
      console.log("Survey completed!");
    }
  };

  const handleHelp = async () => {
    console.log("Help button clicked");

    const category = actionStack[0].category;

    const resp = await generateSubcategories(category);
    console.log("response: ", resp);

    const subcategoryActions: GetSubcategoryAction[] = resp.map(
      (subcategory) => ({
        type: "get_subcategory",
        category: category,
        subcategory: subcategory.subcategory,
        examples: subcategory.examples,
      }),
    );

    const newStack = [...subcategoryActions, ...actionStack.slice(1)];
    const newBudget = { ...budget, [category]: 0 };

    // Prepend new questions to the question stack
    setActionStack(newStack);
    setQuestions((prev) => [
      ...prev,
      ...subcategoryActions.map((action) => generateQuestionFromAction(action)),
    ]);
    setQuestionCount((prev) => prev + 1);
    setBudget(newBudget);
  };

  const generateSubcategories = async (
    category: string,
  ): Promise<GeneratedSubcategories> => {
    const response = await fetch("/api/budget-chat/generate-subcategories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: category }),
    });
    return await response.json();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Financial Survey</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-6">
          {questions.length !== 0 && (
            <Card key={questions.length} className={`bg-white shadow-lg`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-gray-700">
                  Question {questionCount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="text-xl font-bold mb-6">
                  {questions[questions.length - 1].text}
                </h2>
                {questions[questions.length - 1].type === "number" && (
                  <div className="space-y-4">
                    <Input
                      type="number"
                      placeholder="Enter a number"
                      defaultValue={0}
                      onChange={(e) => setNumberInput(parseInt(e.target.value))}
                      className="border-purple-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        handleInput();
                      }}
                    >
                      Confirm
                    </Button>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        console.log("help clicked");
                        handleHelp();
                      }}
                    >
                      Help
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
