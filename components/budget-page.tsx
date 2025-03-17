"use client";

import React, { useState, useEffect, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { DollarSign, Sparkles, X, Edit2, Save, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useBudgetContext } from "../contexts/BudgetContext";
import { JwtContext } from "@/app/lib/jwt-provider";

export function BudgetPage() {
  const [jwt, _] = useContext(JwtContext);
  const router = useRouter();

  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  const {
    categories,
    isEditMode,
    addCategory,
    removeCategory,
    updateAmount,
    setIsEditMode,
    newCategory,
    newAmount,
    setNewCategory,
    setNewAmount,
  } = useBudgetContext();
  const [aiSuggestion, setAiSuggestion] = useState("");

  const totalBudget = categories.reduce(
    (sum, category) => sum + category.amount,
    0,
  );

  useEffect(() => {
    const highestCategory = categories.reduce(
      (max, category) => (category.amount > max.amount ? category : max),
      categories[0],
    );

    let suggestion = `Your total budget is $${totalBudget}. `;

    if (highestCategory.amount > totalBudget * 0.5) {
      suggestion += `You're allocating a large portion (${Math.round((highestCategory.amount / totalBudget) * 100)}%) to ${highestCategory.name}. Consider balancing your budget more evenly. `;
    }

    if (categories.some((category) => category.amount === 0)) {
      suggestion +=
        "Some categories have $0 allocated. Make sure to budget for all your expenses. ";
    }

    suggestion +=
      "Remember the 50/30/20 rule: Try to allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.";

    setAiSuggestion(suggestion);
  }, [categories, totalBudget]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Budget Planner</h1>
        <Button
          onClick={() => setIsEditMode(!isEditMode)}
          variant="outline"
          className="bg-white text-purple-700 hover:bg-purple-100"
        >
          {isEditMode ? (
            <Save className="w-4 h-4 mr-2" />
          ) : (
            <Edit2 className="w-4 h-4 mr-2" />
          )}
          {isEditMode ? "Save" : "Edit"}
        </Button>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Budget Summary */}
          <Card className="col-span-full bg-white shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700">
                Total Budget
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">
                  Monthly Allocation
                </span>
                <span className="text-2xl font-bold text-indigo-600">
                  ${totalBudget.toFixed(2)}
                </span>
              </div>
              <Progress value={100} className="h-2 mb-1" />
            </CardContent>
          </Card>

          {/* Budget Categories */}
          <Card className="bg-white shadow-lg md:col-span-2 lg:row-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-gray-700">
                Budget Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {categories.map((category, index) => (
                  <li key={index} className="relative overflow-hidden">
                    <div
                      className="absolute inset-0 rounded-lg opacity-20"
                      style={{
                        width: `${(category.amount / totalBudget) * 100}%`,
                        backgroundColor: category.color,
                      }}
                    ></div>
                    <div className="flex items-center justify-between p-2 rounded-lg relative z-10">
                      <div className="flex items-center flex-grow mr-2">
                        <div
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <span className="font-medium text-gray-700">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-2">
                          <DollarSign className="w-4 h-4 mr-1 text-gray-500" />
                          {isEditMode ? (
                            <Input
                              type="number"
                              value={category.amount}
                              onChange={(e) =>
                                updateAmount(index, e.target.value)
                              }
                              className="w-20 text-right"
                            />
                          ) : (
                            <span className="w-20 text-right">
                              {category.amount.toFixed(2)}
                            </span>
                          )}
                        </div>
                        {isEditMode && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCategory(index)}
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Add Category Form */}
              {isEditMode && (
                <form
                  onSubmit={addCategory}
                  className="mt-4 flex items-center space-x-2"
                >
                  <Input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Category name"
                    className="flex-grow"
                  />
                  <Input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="Amount"
                    className="w-24"
                  />
                  <Button type="submit">
                    <PlusCircle className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* AI Suggestions */}
          <Card className="bg-white shadow-lg lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg font-semibold text-gray-700">
                <Sparkles className="w-5 h-5 mr-2 text-yellow-500" />
                AI Budget Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">{aiSuggestion}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
