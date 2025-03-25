"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
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
import { ReadOnlyBudgetItem } from "@/lib/types";
import { HeaderBanner } from "@/components/HeaderBanner";

const TODO = -1;

export function ExpenseChart() {
  const { transactionGroups, getTransactionGroups } = useTransactions();

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
    function fetchTransactionData(
      expenses: boolean = true,
    ): ChartTransaction[] {
      const parsedTransactions: ChartTransaction[] = transactionGroups.results
        .flatMap((tx) =>
          tx.transactions
            .filter((t) =>
              expenses ? !t.category.is_income_type : t.category.is_income_type,
            )
            .map((t) => ({
              date: new Date(tx.date),
              amount: -t.amount,
              category: t.category.name,
            })),
        )
        .sort((a, b) => d3.ascending(a.date, b.date));

      return parsedTransactions;
    }
    async function fetchProjectionData(
      expense: boolean,
      transactionsEndDate: Date,
    ): Promise<ChartTransaction[]> {
      // First, find the right budget. We'll use the budget that includes the current date.
      const budget = budgets.find(
        (b) =>
          new Date(b.start_date) <= new Date() &&
          new Date(b.end_date) >= new Date(),
      );
      if (!budget) {
        return [];
      }
      type RawData = {
        category: string;
        budget: number;
      };
      const rawData: RawData[] = (budget.budget_items as ReadOnlyBudgetItem[])
        .filter((item) =>
          expense
            ? !item.category.is_income_type
            : item.category.is_income_type,
        )
        .map((item) => ({
          category: item.category.name,
          budget: expense ? -item.allocation : item.allocation,
        }));

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
    }
    async function fetchExpenseData(): Promise<ChartTransaction[]> {
      return fetchTransactionData();
    }

    async function fetchBudgetData(
      expenseEndDate: Date,
    ): Promise<ChartTransaction[]> {
      return fetchProjectionData(true, expenseEndDate);
    }

    async function fetchIncomeData(): Promise<ChartTransaction[]> {
      return fetchTransactionData(false);
    }

    async function fetchIncomeProjectionData(
      incomeEndDate: Date,
    ): Promise<ChartTransaction[]> {
      return fetchProjectionData(false, incomeEndDate);
    }

    const expenseDataProm = fetchExpenseData();
    const incomeDataProm = fetchIncomeData();

    expenseDataProm.then((expenseData) => {
      const expenseEndDate = expenseData[expenseData.length - 1].date;
      fetchBudgetData(expenseEndDate).then((budgetData) => {
        const [data, index] = mergeData(expenseData, budgetData, -1);
        setCumulativeExpenseData(data);
        setCumulativeExpenseEndIndex(index);
      });
    });

    expenseDataProm.then((expenseData) => {
      setExpenseData(
        groupTransactionsByPeriod(expenseData, d3.timeMonth).map((d) => ({
          date: d.date,
          categories: d.categories.map((c) => ({
            category: c.category,
            value: -c.value,
          })),
        })),
      );
    });

    incomeDataProm.then((incomeData) => {
      setIncomeData(groupTransactionsByPeriod(incomeData, d3.timeMonth));
    });

    incomeDataProm.then((incomeData) => {
      const incomeEndDate = incomeData[incomeData.length - 1].date;
      fetchIncomeProjectionData(incomeEndDate).then((incomeProjectionData) => {
        const [data, index] = mergeData(incomeData, incomeProjectionData, 1);
        setCumulativeIncomeData(data);
        setCumulativeIncomeEndIndex(index);
      });
    });

    expenseDataProm.then((expenseData) => {
      incomeDataProm.then((incomeData) => {
        const combinedSavingsData = d3
          .rollups(
            [
              ...incomeData,
              ...expenseData.map((d) => ({ ...d, amount: d.amount })),
            ],
            (v) => d3.sum(v, (d) => d.amount),
            (d) => d.date,
          )
          .map(([date, value]) => ({ date, value }));

        combinedSavingsData.sort((a, b) => d3.ascending(a.date, b.date));
        const cumulativeSavingsData = combinedSavingsData.reduce((acc, d) => {
          acc.push({
            date: d.date,
            value:
              acc.length === 0 ? d.value : acc[acc.length - 1].value + d.value,
          });
          return acc;
        }, [] as DataPoint[]);
        setSavingsData(cumulativeSavingsData);
      });
    });
  }, [transactionGroups, budgets]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <HeaderBanner headerText="Savings and Expense Graphs" showAccountMenu />

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
                {({ width, height }) => (
                  <ThresholdChart
                    width={width}
                    height={height}
                    data={savingsData}
                    projectionDateIdx={cumulativeExpenseEndIndex}
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
              Cumulative Expenses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedAreaChart
                    width={width}
                    height={height}
                    data={cumulativeExpenseData}
                    projectionDateIdx={cumulativeExpenseEndIndex}
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
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedAreaChart
                    width={width}
                    height={height}
                    data={cumulativeIncomeData}
                    projectionDateIdx={cumulativeIncomeEndIndex}
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
              Income By Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedBarChart
                    width={width}
                    height={height}
                    data={incomeData}
                    projectionDateIdx={TODO}
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
              Expense By Month
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <div className="w-full h-96">
              <ParentSize>
                {({ width, height }) => (
                  <StackedBarChart
                    width={width}
                    height={height}
                    data={expenseData}
                    projectionDateIdx={TODO}
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
