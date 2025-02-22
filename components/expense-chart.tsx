"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import ParentSize from "@visx/responsive/lib/components/ParentSize";
import StackedAreaChart from "./StackedAreaChart";
import * as d3 from "d3";
import { expenseColors, incomeColors } from "@/lib/colors";

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
  const [expenseData, setExpenseData] = useState<StackedDataPoint[]>([]);
  const [expenseEndIndex, setExpenseEndIndex] = useState<number>(0);

  const [incomeData, setIncomeData] = useState<StackedDataPoint[]>([]);
  const [incomeEndIndex, setIncomeEndIndex] = useState<number>(0);

  useEffect(() => {
    async function fetchTransactionData(
      endpoint: string,
    ): Promise<ChartTransaction[]> {
      try {
        const response = await fetch(endpoint);

        type RawData = {
          date: string;
          amount: number;
          // ISO 8601 date-time string
          category: string;
        };

        const rawData: RawData[] = await response.json();

        const parsedTransactions: ChartTransaction[] = rawData
          .map((tx) => ({
            ...tx,
            date: d3.isoParse(tx.date) as Date,
          }))
          .sort((a, b) => d3.ascending(a.date, b.date));

        return parsedTransactions;
      } catch (error) {
        console.error("Failed to fetch savings data:", error);
        return [];
      }
    }
    async function fetchProjectionData(
      endpoint: string,
      transactionsEndDate: Date,
    ): Promise<ChartTransaction[]> {
      try {
        const response = await fetch(endpoint);
        type RawData = {
          category: string;
          budget: number;
        };
        const rawData: RawData[] = await response.json();

        // the first of the next month after the last savings data point
        const startDate = new Date(transactionsEndDate);
        startDate.setDate(1);
        startDate.setMonth(startDate.getMonth() + 1);

        // Project the next 6 months of data
        const projectedData: ChartTransaction[] = [];
        for (let i = 0; i < 6; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);

          const transactions: ChartTransaction[] = rawData.map((d) => ({
            date: date,
            amount: d.budget,
            category: d.category,
          }));

          projectedData.push(...transactions);
        }
        return projectedData;
      } catch (error) {
        console.error("Failed to fetch data:", error);
        return [];
      }
    }
    async function fetchExpenseData(): Promise<ChartTransaction[]> {
      return fetchTransactionData("/api/user-data/expense");
    }

    async function fetchBudgetData(
      expenseEndDate: Date,
    ): Promise<ChartTransaction[]> {
      return fetchProjectionData("/api/user-data/budget", expenseEndDate);
    }

    async function fetchIncomeData(): Promise<ChartTransaction[]> {
      return fetchTransactionData("/api/user-data/income");
    }

    async function fetchIncomeProjectionData(
      incomeEndDate: Date,
    ): Promise<ChartTransaction[]> {
      return fetchProjectionData(
        "/api/user-data/income-projection",
        incomeEndDate,
      );
    }

    function mergeData(
      historicalData: ChartTransaction[],
      projectionData: ChartTransaction[],
      multiplyFactor: number,
    ): [StackedDataPoint[], number] {
      const savingsEndDate = historicalData[historicalData.length - 1].date;
      const combinedData: ChartTransaction[] = [
        ...historicalData,
        ...projectionData,
      ];

      const categories: string[] = Array.from(
        new Set(combinedData.map((tx) => tx.category)),
      );

      // Group transactions first by week, then by category, summing the amounts if
      // there is multiple of the same category in the same week
      const rawGroupedTransactionsByWeek = d3.rollup(
        combinedData,
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
          (cat) => (cumulativeSums[cat.category] += multiplyFactor * cat.value),
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
      const findClosestDate = d3.bisector((d: StackedDataPoint) => d.date).left;
      const lastSavingsDataPointIndex =
        findClosestDate(groupedCumulativeTransactionsByWeek, savingsEndDate) -
        1;
      return [groupedCumulativeTransactionsByWeek, lastSavingsDataPointIndex];
    }

    fetchExpenseData().then((expenseData) => {
      const expenseEndDate = expenseData[expenseData.length - 1].date;
      fetchBudgetData(expenseEndDate).then((budgetData) => {
        const [data, index] = mergeData(expenseData, budgetData, -1);
        setExpenseData(data);
        setExpenseEndIndex(index);
      });
    });

    fetchIncomeData().then((incomeData) => {
      const incomeEndDate = incomeData[incomeData.length - 1].date;
      fetchIncomeProjectionData(incomeEndDate).then((incomeProjectionData) => {
        const [data, index] = mergeData(incomeData, incomeProjectionData, 1);
        setIncomeData(data);
        setIncomeEndIndex(index);
      });
    });
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Savings and Expense Graphs</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-0">
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Cumulative Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedAreaChart
                    width={width}
                    height={height}
                    data={expenseData}
                    projectionDateIdx={expenseEndIndex}
                    colorPalette={expenseColors}
                  />
                )}
              </ParentSize>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Cumulative Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedAreaChart
                    width={width}
                    height={height}
                    data={incomeData}
                    projectionDateIdx={incomeEndIndex}
                    colorPalette={incomeColors}
                  />
                )}
              </ParentSize>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Padding so the footer doesn't hide content
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
