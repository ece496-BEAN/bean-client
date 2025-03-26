"use client";

import React, { useState, useEffect, useContext } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { useRouter } from "next/navigation";
import { JwtContext } from "@/app/lib/jwt-provider";
import StackedAreaChart from "./charts/StackedAreaChart";
import * as d3 from "d3";
import { expenseColors, incomeColors } from "@/lib/colors";
import ThresholdChart, { DataPoint } from "./charts/ThresholdChart";
import StackedBarChart from "./charts/StackedBarChart";
import {
  CategoryValue,
  ChartTransaction,
  StackedDataPoint,
} from "./charts/common";
import { useTransactions } from "@/contexts/TransactionsContext";
import { useBudgets } from "@/contexts/BudgetContext";
import { fetchAndComputeData } from "@/lib/data-fetcher"; // Import the new function

const TODO = -1;

export function ExpenseChart() {
  const router = useRouter(); // Add this line
  const [jwt] = useContext(JwtContext);

  useEffect(() => {
    if (!jwt) {
      router.push("/login"); // Redirect to login if JWT is not set
    }
  }, [jwt, router]);

  const { transactionGroups } = useTransactions();

  const { budgets } = useBudgets();

  const [expenseData, setExpenseData] = useState<StackedDataPoint[]>([]);
  const [incomeData, setIncomeData] = useState<StackedDataPoint[]>([]);
  const [cumulativeExpenseData, setCumulativeExpenseData] = useState<
    StackedDataPoint[]
  >([]);
  const [cumulativeExpenseEndIndex, setCumulativeExpenseEndIndex] =
    useState<number>(0);

  const [cumulativeIncomeData, setCumulativeIncomeData] = useState<
    StackedDataPoint[]
  >([]);
  const [cumulativeIncomeEndIndex, setCumulativeIncomeEndIndex] =
    useState<number>(0);

  const [savingsData, setSavingsData] = useState<DataPoint[]>([]);

  useEffect(() => {
    async function fetchData() {
      const {
        expenseData,
        incomeData,
        cumulativeExpenseData,
        cumulativeExpenseEndIndex,
        cumulativeIncomeData,
        cumulativeIncomeEndIndex,
        savingsData,
      } = await fetchAndComputeData(transactionGroups.results, budgets);
      setExpenseData(expenseData);
      setIncomeData(incomeData);
      setCumulativeExpenseData(cumulativeExpenseData);
      setCumulativeExpenseEndIndex(cumulativeExpenseEndIndex);
      setCumulativeIncomeData(cumulativeIncomeData);
      setCumulativeIncomeEndIndex(cumulativeIncomeEndIndex);
      setSavingsData(savingsData);
    }

    fetchData();
  }, [transactionGroups, budgets]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-4">
        <h1 className="text-2xl font-bold">Savings and Expense Graphs</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-0">
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Savings Graph
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
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
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Cumulative Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) =>
                  cumulativeExpenseData.length > 0 &&
                  width > 0 &&
                  height > 0 && (
                    <StackedAreaChart
                      width={width}
                      height={height}
                      data={cumulativeExpenseData}
                      projectionDateIdx={cumulativeExpenseEndIndex}
                      colorPalette={expenseColors}
                    />
                  )
                }
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
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) =>
                  cumulativeIncomeData.length > 0 &&
                  width > 0 &&
                  height > 0 && (
                    <StackedAreaChart
                      width={width}
                      height={height}
                      data={cumulativeIncomeData}
                      projectionDateIdx={cumulativeIncomeEndIndex}
                      colorPalette={incomeColors}
                    />
                  )
                }
              </ParentSize>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Income By Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) =>
                  incomeData.length > 0 &&
                  width > 0 &&
                  height > 0 && (
                    <StackedBarChart
                      width={width}
                      height={height}
                      data={incomeData}
                      projectionDateIdx={TODO}
                      colorPalette={incomeColors}
                    />
                  )
                }
              </ParentSize>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg col-span-full lg:col-span-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg font-semibold text-gray-700">
              Expense By Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) =>
                  expenseData.length > 0 &&
                  width > 0 &&
                  height > 0 && (
                    <StackedBarChart
                      width={width}
                      height={height}
                      data={expenseData}
                      projectionDateIdx={TODO}
                      colorPalette={expenseColors}
                    />
                  )
                }
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

function groupTransactionsByPeriod(
  data: ChartTransaction[],
  d3PeriodFn: (date: Date) => Date,
): StackedDataPoint[] {
  const groupedTransactions = d3.rollup(
    data,
    (v) => d3.sum(v, (d) => d.amount),
    (d) => d3PeriodFn(d.date),
    (d) => d.category,
  );

  return Array.from(groupedTransactions.entries())
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

  const groupedTransactionsByWeek: StackedDataPoint[] =
    groupTransactionsByPeriod(combinedData, d3.timeWeek);

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
      categories: Object.entries(cumulativeSums).map(([category, value]) => ({
        category,
        value,
      })),
    });
  }
  const findClosestDate = d3.bisector((d: StackedDataPoint) => d.date).left;
  const lastSavingsDataPointIndex =
    findClosestDate(groupedCumulativeTransactionsByWeek, savingsEndDate) - 1;
  return [groupedCumulativeTransactionsByWeek, lastSavingsDataPointIndex];
}
