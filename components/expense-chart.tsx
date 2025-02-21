"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  const [savingsData, setSavingsData] = useState<StackedDataPoint[]>([]);
  const [savingsEndIndex, setSavingsEndIndex] = useState<number>(0);

  useEffect(() => {
    async function fetchSavingsData(): Promise<ChartTransaction[]> {
      try {
        const response = await fetch("/api/user-data/expenses");

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

    async function fetchBudgetData(
      savingsEndDate: Date,
    ): Promise<ChartTransaction[]> {
      try {
        const response = await fetch("/api/user-data/budget");
        type RawData = {
          category: string;
          budget: number;
        };
        const rawData: RawData[] = await response.json();

        // the first of the next month after the last savings data point
        const startDate = new Date(savingsEndDate);
        startDate.setDate(1);
        startDate.setMonth(startDate.getMonth() + 1);

        // Project the next 6 months of budget data
        const projectedBudgetData: ChartTransaction[] = [];
        for (let i = 0; i < 6; i++) {
          const date = new Date(startDate);
          date.setMonth(date.getMonth() + i);

          const transactions: ChartTransaction[] = rawData.map((d) => ({
            date: date,
            amount: -d.budget,
            category: d.category,
          }));

          projectedBudgetData.push(...transactions);
        }
        return projectedBudgetData;
      } catch (error) {
        console.error("Failed to fetch budget data:", error);
        return [];
      }
    }

    function mergeSavingsAndBudgetData(
      savingsData: ChartTransaction[],
      budgetData: ChartTransaction[],
    ): [StackedDataPoint[], number] {
      const savingsEndDate = savingsData[savingsData.length - 1].date;
      const combinedData: ChartTransaction[] = [...savingsData, ...budgetData];

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
      const findClosestDate = d3.bisector((d: StackedDataPoint) => d.date).left;
      const lastSavingsDataPointIndex =
        findClosestDate(groupedCumulativeTransactionsByWeek, savingsEndDate) -
        1;
      return [groupedCumulativeTransactionsByWeek, lastSavingsDataPointIndex];
    }

    fetchSavingsData().then((savingsData) => {
      const savingsEndDate = savingsData[savingsData.length - 1].date;
      fetchBudgetData(savingsEndDate).then((budgetData) => {
        const [data, index] = mergeSavingsAndBudgetData(
          savingsData,
          budgetData,
        );
        setSavingsData(data);
        setSavingsEndIndex(index);
      });
    });
  }, []);

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
                    projectionDateIdx={savingsEndIndex}
                  />
                )}
              </ParentSize>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
