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
import * as d3 from "d3";

export type ChartTransaction = {
  date: Date;
  amount: number;
  category: string;
};

export interface CategoryValue {
  category: string;
  value: number;
}

export interface StackedDataPoint {
  date: Date;
  categories: CategoryValue[];
}

export function ExpenseChart() {
  // const [selectedCategories, setSelectedCategories] = useState<
  //   (keyof (typeof mockExpenseData)[0])[]
  // >(expenseCategories.slice(0, 5) as (keyof (typeof mockExpenseData)[0])[]);
  const [savingsData, setSavingsData] = useState<StackedDataPoint[]>([]);
  // const [selectedTimeframe, setSelectedTimeframe] =
  //   useState<string>("PAST_MONTH");
  // const { categories, removeCategory, isEditMode, updateAmount } =
  //   useBudgetContext();

  useEffect(() => {
    async function fetchSavingsData() {
      try {
        const response = await fetch("/api/user-data/expenses");

        type RawData = {
          date: string;
          amount: number;
          // ISO 8601 date-time string
          category: string;
        };

        const rawData: RawData[] = await response.json();

        const transactions2: ChartTransaction[] = rawData
          .map((tx) => ({
            ...tx,
            date: d3.isoParse(tx.date) as Date,
          }))
          .sort((a, b) => d3.ascending(a.date, b.date));

        const categories: string[] = Array.from(
          new Set(transactions2.map((tx) => tx.category)),
        );

        // Group transactions first by week, then by category, summing the amounts if
        // there is multiple of the same category in the same week
        const rawGroupedTransactionsByWeek = d3.rollup(
          transactions2,
          (v) => d3.sum(v, (d) => d.amount),
          (d) => d3.timeWeek(d.date),
          (d) => d.category,
        );

        const groupedTransactionsByWeek: StackedDataPoint[] = Array.from(
          rawGroupedTransactionsByWeek.entries(),
        )
          .map(([date, categoryMap]): StackedDataPoint => {
            return {
              date: date as Date,
              categories: Array.from(
                categoryMap,
                ([category, value]): CategoryValue => ({
                  category,
                  value: value,
                }),
              ),
            };
          })
          .sort((a: StackedDataPoint, b: StackedDataPoint) =>
            d3.ascending(a.date, b.date),
          );

        const groupedCumulativeTransactionsByWeek: StackedDataPoint[] = [];
        let cumulativeSums: { [key: string]: number } = categories
          .map((cat) => ({ [cat]: 0 }))
          .reduce((acc, val) => ({ ...acc, ...val }), {});
        for (const dataPoint of groupedTransactionsByWeek) {
          dataPoint.categories.forEach(
            (cat) =>
              // TODO: REMOVE THE NEGATIVE SIGN
              (cumulativeSums[cat.category] += -cat.value),
          );
          groupedCumulativeTransactionsByWeek.push({
            date: dataPoint.date,
            categories: Object.entries(cumulativeSums).map(
              ([category, value]) => ({
                category,
                value,
              }),
            ),
          });
        }

        setSavingsData(groupedCumulativeTransactionsByWeek);
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
