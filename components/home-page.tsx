"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import ParentSize from "@visx/responsive/lib/components/ParentSize"; // Import ParentSize
import { useTransactions } from "@/contexts/TransactionsContext";

import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";
import { useBudgets } from "@/contexts/BudgetContext";
import { RingChart } from "./charts/RingChart";
import ThresholdChart, { DataPoint } from "@/components/charts/ThresholdChart";
import { expenseColors } from "@/lib/colors";
import { fetchAndComputeData } from "@/lib/data-fetcher"; // Import the new function
import { HeaderBanner } from "@/components/HeaderBanner";
import { TransactionGroupList } from "@/components/RecentTransactionsPage";
import {
  CircularProgress,
  Grid2,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import LaunchIcon from "@mui/icons-material/Launch";
// TODO: Migrate Card Components to MUI
// TODO: Display errors in toast or banner in the future
export function MainPage() {
  const { paginatedTransactionGroups } = useTransactions();
  const [isLoading, setIsLoading] = useState(true);

  // Wait for a short period to allow JwtProvider to finish initialization
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

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
  const { getSelectedBudget, selectedBudget, isSelectedBudgetLoading } =
    useBudgets();

  useEffect(() => {
    if (currentBudgetUUID) getSelectedBudget(currentBudgetUUID);
  }, [currentBudgetUUID, getSelectedBudget]);

  const spendingPercentage = selectedBudget
    ? (selectedBudget.budget_items
        .filter((item) => !item.category.is_income_type)
        .reduce((acc, item) => acc + item.allocation_used, 0) /
        selectedBudget.budget_items
          .filter((item) => !item.category.is_income_type)
          .reduce((acc, item) => acc + item.allocation, 0)) *
      100
    : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isLoading || isSelectedBudgetLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg font-semibold">
            <CircularProgress />
          </div>
        </div>
      ) : (
        <>
          <HeaderBanner headerText="Financial Dashboard" showAccountMenu />

          <main className="flex-grow p-4 overflow-y-auto">
            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {/* Savings Graph */}
              <Card className="bg-white shadow-lg col-span-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Savings Graph</Typography>
                      <IconButton
                        href="/savings-graph"
                        size="small"
                        aria-label="View Savings Graph"
                      >
                        <LaunchIcon />
                      </IconButton>
                    </Stack>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-96">
                    <ParentSize>
                      {({ width, height }) =>
                        savingsData.length >= 2 && width > 0 && height > 0 ? (
                          <ThresholdChart
                            width={width}
                            height={height}
                            data={savingsData}
                            projectionDateIdx={cumulativeExpenseEndIndex}
                            colorPalette={expenseColors}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            Add at least two week's worth of data to show this
                            graph!
                          </div>
                        )
                      }
                    </ParentSize>
                  </div>
                </CardContent>
              </Card>

              {/* Spending Summary */}
              <Card className="col-span-full bg-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    Monthly Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-indigo-600">
                      $
                      {selectedBudget?.budget_items
                        .filter((item) => !item.category.is_income_type)
                        .reduce((acc, item) => acc + item.allocation_used, 0)
                        .toFixed(2)}
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">
                      $
                      {selectedBudget?.budget_items
                        .filter((item) => !item.category.is_income_type)
                        .reduce((acc, item) => acc + item.allocation, 0)
                        .toFixed(2)}
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
              <Card className="bg-white shadow-lg lg:row-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    <Stack direction="row" justifyContent="space-between">
                      <Typography>Spending Categories</Typography>
                      <IconButton
                        href="/budget"
                        size="small"
                        aria-label="View Budget"
                      >
                        <LaunchIcon />
                      </IconButton>
                    </Stack>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!selectedBudget?.budget_items?.length ? (
                    <div className="flex justify-center items-center h-48 text-gray-600 font-medium">
                      {/* You can adjust h-48 as needed to match the expected height of RingCharts */}
                      No budget items set. Consider adding some.
                    </div>
                  ) : (
                    <Grid2 container spacing={2}>
                      {selectedBudget?.budget_items
                        ?.filter(
                          (budget_item) => !budget_item.category.is_income_type,
                        )
                        .map((budget_item) => (
                          <Grid2
                            key={budget_item.id}
                            className="flex flex-col items-center"
                            size={{ xs: 6, sm: 4, md: 4, lg: 4, xl: 3 }}
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
                          </Grid2>
                        ))}
                    </Grid2>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-white shadow-lg md:col-span-2 lg:row-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-gray-700">
                    <Stack direction="row" justifyContent="space-between">
                      Recent Transactions
                      <IconButton
                        href="/transactions"
                        size="small"
                        aria-label="View Savings Graph"
                      >
                        <LaunchIcon />
                      </IconButton>
                    </Stack>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TransactionGroupList
                    readOnly
                    transactionGroups={paginatedTransactionGroups.results.slice(
                      0,
                      5,
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
