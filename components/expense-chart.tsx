"use client";

import React, { useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBudgetContext } from "@/contexts/BudgetContext";
import LineChart from "@/components/LineChart";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import StackedAreaChart from "./StackedAreaChart";

export type ChartTransaction = {
  date: string;
  amount: number;
  category: string;
};
export interface CumulativeStackedDataPoint {
  date: string;
  categories: { category: string; value: number }[];
}

export function ExpenseChart() {
  // const [selectedCategories, setSelectedCategories] = useState<
  //   (keyof (typeof mockExpenseData)[0])[]
  // >(expenseCategories.slice(0, 5) as (keyof (typeof mockExpenseData)[0])[]);
  const [savingsData, setSavingsData] = useState<CumulativeStackedDataPoint[]>(
    [],
  );
  // const [selectedTimeframe, setSelectedTimeframe] =
  //   useState<string>("PAST_MONTH");
  // const { categories, removeCategory, isEditMode, updateAmount } =
  //   useBudgetContext();

  useEffect(() => {
    async function fetchSavingsData() {
      try {
        const response = await fetch("/api/user-data/expenses");
        const transactions: ChartTransaction[] = await response.json();
        // Create a sorted copy of the transactions (assuming ISO date strings, so lexicographical sort works)
        const sortedTransactions = transactions
          .slice()
          .sort((a, b) => a.date.localeCompare(b.date));

        // Group transactions by date.
        const transactionsByDate: Map<string, ChartTransaction[]> = new Map();
        for (const tx of sortedTransactions) {
          if (!transactionsByDate.has(tx.date)) {
            transactionsByDate.set(tx.date, []);
          }
          transactionsByDate.get(tx.date)!.push(tx);
        }

        // Get unique dates in ascending order.
        const uniqueDates: string[] = Array.from(
          transactionsByDate.keys(),
        ).sort((a, b) => a.localeCompare(b));

        // Collect all unique categories from the transactions.
        const categories: Set<string> = new Set();
        transactions.forEach((tx) => categories.add(tx.category));

        // Initialize cumulative sums for each category.
        const cumulativeSums: { [key: string]: number } = {};
        categories.forEach((cat) => {
          cumulativeSums[cat] = 0;
        });

        // Build the cumulative stacked data points.
        const cumulativeData: CumulativeStackedDataPoint[] = [];

        for (const date of uniqueDates) {
          // Get all transactions for the current date.
          const dailyTransactions = transactionsByDate.get(date)!;

          // Update cumulative sums with all transactions from this date.
          dailyTransactions.forEach((tx) => {
            cumulativeSums[tx.category] += -tx.amount;
          });

          // Create a data point that includes the current cumulative sum for each category.
          const dataPoint: CumulativeStackedDataPoint = {
            date,
            categories: [],
          };
          categories.forEach((cat) => {
            // If a category hasn't been encountered, default to 0.
            dataPoint.categories.push({
              category: cat,
              value: cumulativeSums[cat] || 0,
            });
          });

          cumulativeData.push(dataPoint);
        }
        console.log("Savings data fetched:", cumulativeData);

        setSavingsData(cumulativeData);
      } catch (error) {
        console.error("Failed to fetch savings data:", error);
      }
    }

    fetchSavingsData();
  }, []);

  // const handleCategoryToggle = (
  //   category: keyof (typeof mockExpenseData)[0],
  // ) => {
  //   setSelectedCategories((prev) =>
  //     prev.includes(category)
  //       ? prev.filter((c) => c !== category)
  //       : [...prev, category],
  //   );
  // };

  // type DataPoint = { month: string;[key: string]: number | string };

  // const chartData = mockExpenseData.map((entry) => {
  //   const dataPoint: Record<string, string | number> = { month: entry.month };
  //   let total = 0;

  //   selectedCategories.forEach((category) => {
  //     const categoryValue = entry[category as keyof typeof entry] as number;
  //     total += categoryValue;
  //     dataPoint[category] = categoryValue;
  //   });

  //   dataPoint["Total"] = total;
  //   return dataPoint;
  // });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Savings and Expense Graphs</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-0">
        {/* Savings Graph */}
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Savings Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedAreaChart
                    width={width}
                    height={height}
                    data={savingsData}
                  />
                )}
              </ParentSize>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown
        <Card className="bg-white shadow-lg col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Expense Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={Object.fromEntries(
                [...selectedCategories, "Total"].map((category, index) => [
                  category,
                  { label: category, color: colors[index % colors.length] },
                ]),
              )}
              className="h-[400px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  {selectedCategories.map((category, index) => (
                    <Area
                      key={category}
                      type="monotone"
                      dataKey={category}
                      stackId="1"
                      stroke={colors[index % colors.length]}
                      fill={colors[index % colors.length]}
                      fillOpacity={1}
                    />
                  ))}
                  <Area
                    type="monotone"
                    dataKey="Total"
                    stroke="#000000"
                    fill="none"
                    strokeDasharray="5 5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              {expenseCategories.map((category) => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(
                      category as keyof (typeof mockExpenseData)[0],
                    )}
                    onCheckedChange={() =>
                      handleCategoryToggle(
                        category as keyof (typeof mockExpenseData)[0],
                      )
                    }
                  />
                  <Label htmlFor={`category-${category}`}>{category}</Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}
