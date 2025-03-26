"use client";

import { useState, useRef, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Budget, ReadOnlyBudgetItem, Category } from "@/lib/types";
import { endOfMonth, format, startOfMonth } from "date-fns";
import CategoryProvider, { useCategories } from "@/contexts/CategoriesContext";
import { JwtContext } from "@/app/lib/jwt-provider";
import { AddOrEditBudgetPage } from "@/components/AddOrEditBudgetPage";
import { UUID } from "crypto";

type QuestionType = "single" | "multiple" | "singleWithOther" | "number";

type Question = {
  text: string;
  type: QuestionType;
  options?: string[];
};

const predefinedQuestionList: Question[] = [
  {
    text: "What is your monthly after-tax income?",
    type: "number",
  },
  {
    text: "Which of the following categories do you spend money on? (Select multiple)",
    type: "multiple",
    options: [
      "Food",
      "Clothing",
      "Transportation",
      "Entertainment",
      "Housing",
      "Other Debt",
      "Education",
      "Charity",
      "Health and Fitness",
    ],
  },
];

interface Action {
  category: Category;
  budgetItem: ReadOnlyBudgetItem;
}

type ActionStack = Action[];

// predefined categories for the survey
const initialCategories: Category[] = [
  {
    id: "" as UUID,
    name: "Housing",
    description: "Rent, mortgage, utilities, etc...",
    legacy: false,
    is_income_type: false,
    color: "#0062ff",
  },
  {
    id: "" as UUID,
    name: "Transportation",
    description: "Gas, public transit fare, etc...",
    legacy: false,
    is_income_type: false,
    color: "#0062ff",
  },
  {
    id: "" as UUID,
    name: "Food",
    description: "Groceries, take-out, etc...",
    legacy: false,
    is_income_type: false,
    color: "#0062ff",
  },
];

const initialActionStack: ActionStack = initialCategories.map((cat) => ({
  category: cat,
  budgetItem: {
    id: "" as UUID,
    budget_id: "" as UUID,
    allocation: 0,
    category: cat,
    allocation_used: 0,
  },
}));

function generateQuestionFromAction(action: Action): Question {
  return {
    text: `How much do you spend on ${action.category.name} per month? 
             Examples: ${action.category.description}`,
    type: "number",
  };
}

export default function SurveyPage() {
  // const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [startedSurvey, setStartedSurvey] = useState<boolean>(false);
  const [finishedSurvey, setFinishedSurvey] = useState<boolean>(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number>(-1);
  const [actionStack, setActionStack] =
    useState<ActionStack>(initialActionStack);
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Wait for a short period to allow JwtProvider to finish initialization
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!isLoading && !jwt) {
      router.push("/login");
    }
  }, [jwt, isLoading, router]);

  // console.log("DEBUG: initialActionStack: ", initialActionStack);
  const [questions, setQuestions] = useState<Question[]>([
    generateQuestionFromAction(actionStack[0]),
  ]);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [numberInput, setNumberInput] = useState<number>(0);
  const completionCardRef = useRef<HTMLDivElement | null>(null);
  const editMode: boolean = false;
  const [budgetItemArrayState, setBudgetItemArrayState] = useState<
    ReadOnlyBudgetItem[]
  >([]);
  const [finalNumBudgets, setFinalNumBudgets] = useState<number>(
    initialCategories.length,
  );
  const { categories, addCategory, isCategoriesLoading } = useCategories();

  const generateQuestion = async (user_response: string) => {
    console.log("generateQuestion called!");
    // const response = await fetch("/api/budget-chat/chatbot", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: user_response,
    // });
    // const respJSON = await response.json()

    // DEBUG
    const respJSON = {
      done: 1,
      aiResponse: "Survey completed!",
      questionFormat: "single" as QuestionType,
      possibleResponses: [],
      groceries_budget_limit: 54321,
    };
    console.log("DEBUG response: ", respJSON);

    // check if survey is done
    if (respJSON.done === 1) {
      console.log("Survey is done!");
      setFinishedSurvey(true);
      const temp: Question = {
        text: "Survey completed!",
        type: "single",
        options: [],
      };

      // create categories for budget items
      const newCategories: Category[] = [
        {
          id: "" as UUID,
          name: "Food",
          description: "Food and groceries",
          legacy: false,
          is_income_type: false,
          color: "#0062ff",
        },
        {
          id: "" as UUID,
          name: "Transportation",
          description: "Gas, public transit fares",
          legacy: false,
          is_income_type: false,
          color: "#0062ff",
        },
      ];

      const retCategories = (await addCategory(newCategories)) as Category[];
      // console.log("DEBUG retCategories: ", retCategories);

      // create budget_item for each budget category, update state accordingly
      // const budgetItems : ReadOnlyBudgetItem[] = [];
      const budgetItems: ReadOnlyBudgetItem[] = retCategories.map(
        (category) => ({
          id: "" as UUID,
          budget_id: "" as UUID,
          allocation: 1234,
          category: category,
          allocation_used: 0,
        }),
      );
      // const foodBudgetItem : ReadOnlyBudgetItem = {
      //   id: "",
      //   budget_id: "",
      //   allocation: respJSON.groceries_budget_limit,
      //   category: retCategories.find((category) => category.name === "Food") as Category,
      // };
      // budgetItems.push(foodBudgetItem);
      console.log("DEBUG: budgetItems: ", budgetItems);
      setBudgetItemArrayState((prev) => [...prev, ...budgetItems]);
      return temp;
    }

    const retQuestion: Question = {
      text: respJSON.aiResponse,
      type: respJSON.questionFormat,
      options: respJSON.possibleResponses,
    };

    // reset selected answer index for new question
    setSelectedAnswerIndex(-1);

    return retQuestion;
  };

  const handleNumberInput = async () => {
    const action = actionStack[0];
    console.log("parsing action: ", action);

    // add budget to budgetItemArrayState
    const newBudgetItem = {
      id: "" as UUID,
      budget_id: "" as UUID,
      allocation: numberInput,
      category: action.category,
      allocation_used: 0,
    };
    setBudgetItemArrayState((prev) => [...prev, newBudgetItem]);

    // advance to next action if possible
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

      // remove budgets that have 0 allocation
      const finishedBudgetItemArrayState = [
        ...budgetItemArrayState,
        newBudgetItem,
      ].filter((budgetItem) => budgetItem.allocation > 0);
      // update expected final number of budgets
      setFinalNumBudgets(finishedBudgetItemArrayState.length);

      // need to add the categories in BudgetItemArrayState to backend
      const categoriesToAdd: Category[] = finishedBudgetItemArrayState.map(
        (budgetItem) => budgetItem.category,
      );
      const retCat = (await addCategory(categoriesToAdd)) as Category[];
      console.log("DEBUG retCat: ", retCat);

      // update the categories in BudgetItemArrayState with the returned categories
      const newBudgetItemArrayState = finishedBudgetItemArrayState.map(
        (budgetItem) => {
          budgetItem.category = retCat.find(
            (cat) => cat.name === budgetItem.category.name,
          ) as Category;
          return budgetItem;
        },
      );
      // console.log("DEBUG newBudgetItemArrayState: ", newBudgetItemArrayState);
      setBudgetItemArrayState(newBudgetItemArrayState);

      setFinishedSurvey(true); // FOR NOW
    }
  };

  // const handleHelp = async () => {
  //   console.log("Help button clicked");

  //   const category = actionStack[0].category;

  //   const resp = await generateSubcategories(category);
  //   console.log("response: ", resp);

  //   const subcategoryActions: GetSubcategoryAction[] = resp.map(
  //     (subcategory) => ({
  //       type: "get_subcategory",
  //       category: category,
  //       subcategory: subcategory.subcategory,
  //       examples: subcategory.examples,
  //     }),
  //   );

  //   const newStack = [...subcategoryActions, ...actionStack.slice(1)];
  //   const newBudget = { ...budget, [category]: 0 };

  //   // Prepend new questions to the question stack
  //   setActionStack(newStack);
  //   setQuestions((prev) => [
  //     ...prev,
  //     ...subcategoryActions.map((action) => generateQuestionFromAction(action)),
  //   ]);
  //   setQuestionCount((prev) => prev + 1);
  //   setBudget(newBudget);
  // };

  // const generateSubcategories = async (
  //   category: string,
  // ): Promise<GeneratedSubcategories> => {
  //   const response = await fetch("/api/budget-chat/generate-subcategories", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify({ category: category }),
  //   });
  //   return await response.json();
  // };

  const handleSingleChoice = async (option: string, optionIndex: number) => {
    setSelectedAnswerIndex(optionIndex);

    const new_question = await generateQuestion(option);

    setQuestions((prev) => [...prev, new_question]);
    setQuestionCount((prev) => prev + 1);
  };

  const startSurvey = async () => {
    console.log("startSurvey called!");
    setStartedSurvey(true);

    // start with predefined questions
    // const newStack = actionStack.slice(1);
    // setActionStack(newStack);
    // const newQuestion = generateQuestionFromAction(newStack[0]);

    // generate question, replace placeholder
    // const newQuestion = await generateQuestion("Hello, let's start.");
    // setQuestions([newQuestion]);
    setQuestionCount(1);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Financial Survey v2</h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-6">
          {!startedSurvey &&
            !finishedSurvey && ( // welcome page
              <Card key={questions.length} className={`bg-white shadow-lg`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Welcome!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <h2 className="text-xl font-bold mb-6">
                    Welcome to BEAN! Would you like to take a quick financial
                    survey to help set up your budget?
                  </h2>
                  <div className="space-y-4">
                    <Button
                      key={98} // hardcoded shit
                      variant={startedSurvey ? "default" : "outline"}
                      className={`w-full justify-start text-left h-auto py-3 px-4 rounded-lg ${
                        startedSurvey
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : ""
                      }`}
                      onClick={() => startSurvey()}
                    >
                      Sure!
                    </Button>
                    <Button
                      key={99} // hardcoded shit
                      variant={startedSurvey ? "default" : "outline"}
                      className={`w-full justify-start text-left h-auto py-3 px-4 rounded-lg ${
                        startedSurvey
                          ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                          : ""
                      }`}
                      onClick={() => {
                        router.push("/");
                      }}
                    >
                      No, thanks. Take me straight to the app.
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          {startedSurvey && !finishedSurvey && !isCategoriesLoading && (
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
                {["singleWithOther", "single"].includes(
                  questions[questions.length - 1].type,
                ) && (
                  <div className="space-y-4">
                    {questions[questions.length - 1].options?.map(
                      (option, optionIndex) => (
                        <Button
                          key={optionIndex}
                          variant={
                            selectedAnswerIndex === optionIndex
                              ? "default"
                              : "outline"
                          }
                          className={`w-full justify-start text-left h-auto py-3 px-4 rounded-lg ${
                            selectedAnswerIndex === optionIndex
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                              : ""
                          }`}
                          onClick={() =>
                            handleSingleChoice(option, optionIndex)
                          }
                        >
                          {option}
                        </Button>
                      ),
                    )}
                    {/* <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        console.log("help clicked");
                        handleHelp();
                      }}
                    >
                      Help
                    </Button> */}
                  </div>
                )}
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
                        handleNumberInput();
                      }}
                    >
                      Confirm
                    </Button>
                    {/* <Button
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        console.log("help clicked");
                        handleHelp();
                      }}
                    >
                      Help
                    </Button> */}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        {finishedSurvey &&
          budgetItemArrayState.length === finalNumBudgets && ( // wait until budgetItems has been updated
            <Card
              className="max-w-lg mx-auto mt-6 bg-white shadow-lg"
              ref={completionCardRef}
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-700">
                  Survey Completed!
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-600 font-semibold">
                  Here's the budget we've generated for you. Please review it
                  and make changes as needed, then hit Submit!
                </p>
                <p className="mt-2 text-gray-600"></p>
                <AddOrEditBudgetPage
                  editMode={editMode}
                  initial_budget={{
                    id: "" as UUID,
                    name: "budget1",
                    description: "Generated by BEAN",
                    start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
                    end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
                    budget_items: budgetItemArrayState,
                    total_allocation: 0,
                    total_used: 0,
                  }}
                />
              </CardContent>
            </Card>
          )}
      </main>
    </div>
  );
}
