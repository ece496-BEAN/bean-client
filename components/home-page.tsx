"use client";

import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import ParentSize from "@visx/responsive/lib/components/ParentSize"; // Import ParentSize
import { useTransactions } from "@/contexts/TransactionsContext";
import { JwtContext } from "@/app/lib/jwt-provider";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";
import { useBudgets } from "@/contexts/BudgetContext";
import { RingChart } from "./charts/RingChart";
import ThresholdChart, { DataPoint } from "@/components/charts/ThresholdChart";
import { expenseColors } from "@/lib/colors";
import { fetchAndComputeData } from "@/lib/data-fetcher"; // Import the new function

export function MainPage() {
  const [jwt, setAndStoreJwt] = useContext(JwtContext);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

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

  const { transactionGroups } = useTransactions();
  const { budgets } = useBudgets();

  const [savingsData, setSavingsData] = useState<DataPoint[]>([]);
  const [cumulativeExpenseEndIndex, setCumulativeExpenseEndIndex] =
    useState<number>(0);

  useEffect(() => {
    async function fetchData() {
      const { savingsData, cumulativeExpenseEndIndex } =
        await fetchAndComputeData(transactionGroups.results, budgets);
      setSavingsData(savingsData);
      setCumulativeExpenseEndIndex(cumulativeExpenseEndIndex);
    }

    fetchData();
  }, [transactionGroups, budgets]);

  const { currentBudgetUUID } = useCurrentBudget();
  const {
    getSelectedBudget,
    selectedBudget,
    selectedBudgetQueryError,
    isSelectedBudgetLoading,
  } = useBudgets();

  useEffect(() => {
    if (currentBudgetUUID) getSelectedBudget(currentBudgetUUID);
  }, [currentBudgetUUID, getSelectedBudget]);

  const spendingPercentage =
    ((selectedBudget?.total_used ?? 0) /
      (selectedBudget?.total_allocation ?? 1)) *
    100;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isLoading || isSelectedBudgetLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg font-semibold">Loading...</div>
        </div>
      ) : (
        <>
          <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
            <h1 className="text-2xl font-bold">Financial Dashboard</h1>
          </header>

          <main className="flex-grow p-4 overflow-y-auto">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Savings Graph */}
              <Card className="bg-white shadow-lg col-span-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Savings Graph
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-96">
                    <ParentSize>
                      {({ width, height }) =>
                        savingsData.length > 0 &&
                        width > 0 &&
                        height > 0 && (
                          <ThresholdChart
                            width={width}
                            height={height}
                            data={savingsData}
                            projectionDateIdx={cumulativeExpenseEndIndex}
                            colorPalette={expenseColors}
                          />
                        )
                      }
                    </ParentSize>
                  </div>
                </CardContent>
              </Card>

              {/* Spending Summary */}
              <Card
                className="col-span-full bg-white shadow-lg"
                onClick={() => router.push("/budget")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Monthly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-indigo-600">
                      ${(selectedBudget?.total_used ?? 0).toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">
                      ${(selectedBudget?.total_allocation ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <Progress value={spendingPercentage} className="h-2 mb-1" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="text-sm font-medium text-gray-500">
                      Used
                    </span>
                    <span>{spendingPercentage.toFixed(1) || 0}%</span>
                    <span className="text-sm font-medium text-gray-500">
                      Allocated
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Spending Categories */}
              <Card
                className="bg-white shadow-lg lg:row-span-2"
                onClick={() => router.push("/budget")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Spending Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center gap-4">
                    {selectedBudget?.budget_items?.map((budget_item) => (
                      <div
                        key={budget_item.id}
                        className="flex flex-col items-center"
                      >
                        <RingChart
                          percentage={
                            (budget_item.allocation_used /
                              budget_item.allocation) *
                            100
                          }
                          color={budget_item.category.color}
                        />
                        <span className="mt-2 text-sm font-medium text-gray-600">
                          {budget_item.category.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card
                className="bg-white shadow-lg md:col-span-2 lg:row-span-2"
                onClick={() => router.push("/transactions")}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                {/* TODO: Implement proper way to display transaction groups */}
                {/* <CardContent>
                  <ul className="space-y-3">
                    {transactionGroups
                      .sort(
                        (a, b) =>
                          new Date(b.date).getTime() -
                          new Date(a.date).getTime(),
                      )
                      .slice(0, 5)
                      .map((transaction) => (
                        <li
                          key={transaction.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div
                              className={`p-2 rounded-full mr-3 ${transaction.amount >= 0 ? "bg-green-100" : "bg-red-100"}`}
                            >
                              {transaction.amount >= 0 ? (
                                <TrendingUp className="w-4 h-4 text-green-600" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">
                                {transaction.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {transaction.date}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-semibold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {transaction.amount >= 0 ? "+" : "-"}$
                            {Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </CardContent> */}
              </Card>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
