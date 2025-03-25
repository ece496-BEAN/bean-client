"use client";

import React, { useContext, useEffect, useState } from "react";
import {
  Bell,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import LineChart from "@/components/charts/ThresholdChart"; // Import the new LineChart component
import ParentSize from "@visx/responsive/lib/components/ParentSize"; // Import ParentSize
import { useTransactions } from "@/contexts/TransactionsContext";
import { StackedDataPoint } from "./charts/common";
import { CategoryValue } from "./charts/common";
import { ChartTransaction } from "./charts/common";
import * as d3 from "d3";
import { JwtContext } from "@/app/lib/jwt-provider";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";
import { useBudgets } from "@/contexts/BudgetContext";

interface RingChartProps {
  percentage: number;
  color: string;
  size?: number;
}

const RingChart: React.FC<RingChartProps> = ({
  percentage,
  color,
  size = 100,
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold">{percentage}%</span>
      </div>
    </div>
  );
};

interface Notification {
  id: number;
  message: string;
  type: "warning" | "alert";
}

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

  const spendingCategories = [
    { name: "Housing", percentage: 40, color: "#4CAF50" },
    { name: "Food", percentage: 20, color: "#FFC107" },
    { name: "Transportation", percentage: 15, color: "#2196F3" },
    { name: "Entertainment", percentage: 10, color: "#9C27B0" },
    { name: "Others", percentage: 15, color: "#FF5722" },
  ];

  const [savingsData, setSavingsData] = useState<StackedDataPoint[]>([]);

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
  console.log(currentBudgetUUID, selectedBudget);

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
                {/* <CardContent>
                  <div className="w-full h-64">
                    <ParentSize>
                      {({ width, height }) => (
                        <LineChart
                          width={width}
                          height={height}
                          data={savingsData}
                        />
                      )}
                    </ParentSize>
                  </div>
                </CardContent> */}
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
                    {/* <div className="flex flex-col"> */}
                    <span className="text-2xl font-bold text-indigo-600">
                      ${selectedBudget?.total_used?.toFixed(2)}
                    </span>
                    {/* </div> */}
                    <span className="text-2xl font-bold text-indigo-600">
                      ${selectedBudget?.total_allocation?.toFixed(2)}
                    </span>
                  </div>
                  <Progress value={spendingPercentage} className="h-2 mb-1" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="text-sm font-medium text-gray-500">
                      Used
                    </span>
                    <span>{spendingPercentage.toFixed(1)}%</span>
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
                    {spendingCategories.map((category, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <RingChart
                          percentage={category.percentage}
                          color={category.color}
                        />
                        <span className="mt-2 text-sm font-medium text-gray-600">
                          {category.name}
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
