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

// Mock data for expenses
const mockExpenseData = [
  {
    month: "Jan",
    Housing: 1200,
    Food: 450,
    Entertainment: 200,
    Transportation: 150,
    Utilities: 100,
    Other: 80,
  },
  {
    month: "Feb",
    Housing: 1200,
    Food: 600,
    Entertainment: 180,
    Transportation: 140,
    Utilities: 110,
    Other: 90,
  },
  {
    month: "Mar",
    Housing: 1200,
    Food: 350,
    Entertainment: 220,
    Transportation: 160,
    Utilities: 105,
    Other: 75,
  },
  {
    month: "Apr",
    Housing: 1200,
    Food: 500,
    Entertainment: 190,
    Transportation: 145,
    Utilities: 95,
    Other: 85,
  },
  {
    month: "May",
    Housing: 1200,
    Food: 480,
    Entertainment: 210,
    Transportation: 155,
    Utilities: 100,
    Other: 70,
  },
  {
    month: "Jun",
    Housing: 1200,
    Food: 520,
    Entertainment: 230,
    Transportation: 170,
    Utilities: 110,
    Other: 95,
  },
  {
    month: "Jul",
    Housing: 1200,
    Food: 550,
    Entertainment: 250,
    Transportation: 180,
    Utilities: 120,
    Other: 100,
  },
  {
    month: "Aug",
    Housing: 1200,
    Food: 530,
    Entertainment: 240,
    Transportation: 175,
    Utilities: 115,
    Other: 90,
  },
  {
    month: "Sep",
    Housing: 1200,
    Food: 490,
    Entertainment: 220,
    Transportation: 160,
    Utilities: 105,
    Other: 85,
  },
  {
    month: "Oct",
    Housing: 1200,
    Food: 510,
    Entertainment: 200,
    Transportation: 150,
    Utilities: 100,
    Other: 80,
  },
  {
    month: "Nov",
    Housing: 1200,
    Food: 540,
    Entertainment: 230,
    Transportation: 165,
    Utilities: 110,
    Other: 95,
  },
  {
    month: "Dec",
    Housing: 1200,
    Food: 600,
    Entertainment: 300,
    Transportation: 200,
    Utilities: 120,
    Other: 110,
  },
];

const expenseCategories = [
  "Housing",
  "Food",
  "Entertainment",
  "Transportation",
  "Utilities",
  "Other",
];

const colors = [
  "rgba(33, 150, 243, 1)", // Solid blue
  "rgba(33, 150, 243, 0.8)",
  "rgba(33, 150, 243, 0.6)",
  "rgba(33, 150, 243, 0.4)",
  "rgba(33, 150, 243, 0.2)",
  "rgba(33, 150, 243, 0.1)", // Lightest blue
];

export function ExpenseChart() {
  const [selectedCategories, setSelectedCategories] = useState<
    (keyof (typeof mockExpenseData)[0])[]
  >(expenseCategories.slice(0, 5) as (keyof (typeof mockExpenseData)[0])[]);
  const [savingsData, setSavingsData] = useState<
    { date: Date; value: number }[]
  >([]);
  const [selectedTimeframe, setSelectedTimeframe] =
    useState<string>("PAST_MONTH");
  const { categories, removeCategory, isEditMode, updateAmount } =
    useBudgetContext();

  useEffect(() => {
    async function fetchSavingsData() {
      try {
        const response = await fetch("/api/user-data");
        const data = await response.json();
        const savingsData: { date: Date; value: number }[] = [];

        for (const dateEntry of data) {
          for (const date in dateEntry) {
            let dailyValue = 0;
            for (const transaction of dateEntry[date]) {
              dailyValue +=
                transaction.transaction_type === "credit"
                  ? transaction.amount
                  : -transaction.amount;
            }
            savingsData.push({ date: new Date(date), value: dailyValue });
          }
        }

        setSavingsData(savingsData);
      } catch (error) {
        console.error("Failed to fetch savings data:", error);
      }
    }

    fetchSavingsData();
  }, []);

  const handleCategoryToggle = (
    category: keyof (typeof mockExpenseData)[0],
  ) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  type DataPoint = { month: string; [key: string]: number | string };

  const chartData = mockExpenseData.map((entry) => {
    const dataPoint: Record<string, string | number> = { month: entry.month };
    let total = 0;

    selectedCategories.forEach((category) => {
      const categoryValue = entry[category as keyof typeof entry] as number;
      total += categoryValue;
      dataPoint[category] = categoryValue;
    });

    dataPoint["Total"] = total;
    return dataPoint;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Savings and Expense Graphs</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
        {/* Savings Graph */}
        <Card className="bg-white shadow-lg col-span-full lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Savings Graph
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64">
              <ParentSize>
                {({ width, height }) => (
                  <LineChart width={width} height={height} data={savingsData} />
                )}
              </ParentSize>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
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
        </Card>
      </div>
    </div>
  );
}
