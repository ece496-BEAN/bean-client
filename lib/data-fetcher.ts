import {
  Budget,
  ReadOnlyBudgetItem,
  ReadOnlyTransaction,
  TransactionGroup,
} from "@/lib/types";
import * as d3 from "d3";
import {
  CategoryValue,
  ChartTransaction,
  StackedDataPoint,
} from "@/components/charts/common";
import { DataPoint } from "@/components/charts/ThresholdChart";

export async function fetchAndComputeData(
  transactionGroups: TransactionGroup<ReadOnlyTransaction>[],
  budgets: Budget[],
) {
  function fetchTransactionData(expenses: boolean = true): ChartTransaction[] {
    const parsedTransactions: ChartTransaction[] = transactionGroups
      .flatMap((tx) =>
        tx.transactions
          .filter((t) =>
            expenses ? !t.category.is_income_type : t.category.is_income_type,
          )
          .map((t) => ({
            date: new Date(tx.date),
            amount: expenses ? -t.amount : t.amount,
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
        expense ? !item.category.is_income_type : item.category.is_income_type,
      )
      .map((item) => ({
        category: item.category.name,
        budget: expense ? -item.allocation : item.allocation,
      }));

    const startDate = new Date(transactionsEndDate);
    startDate.setDate(1);
    startDate.setMonth(startDate.getMonth() + 1);

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

  const expenseData = await expenseDataProm;
  const incomeData = await incomeDataProm;

  const expenseEndDate =
    expenseData[expenseData.length - 1]?.date ?? new Date();
  const budgetData = await fetchBudgetData(expenseEndDate);
  const [cumulativeExpenseData, cumulativeExpenseEndIndex] = mergeData(
    expenseData,
    budgetData,
    -1,
  );

  const groupedExpenseData = groupTransactionsByPeriod(
    expenseData,
    d3.timeMonth,
  ).map((d) => ({
    date: d.date,
    categories: d.categories.map((c) => ({
      category: c.category,
      value: -c.value,
    })),
  }));

  const groupedIncomeData = groupTransactionsByPeriod(incomeData, d3.timeMonth);

  const incomeEndDate = incomeData[incomeData.length - 1]?.date ?? new Date();
  const incomeProjectionData = await fetchIncomeProjectionData(incomeEndDate);
  const [cumulativeIncomeData, cumulativeIncomeEndIndex] = mergeData(
    incomeData,
    incomeProjectionData,
    1,
  );

  const combinedSavingsData = d3
    .rollups(
      [...incomeData, ...expenseData.map((d) => ({ ...d, amount: d.amount }))],
      (v) => d3.sum(v, (d) => d.amount),
      (d) => d.date,
    )
    .map(([date, value]) => ({ date, value }));

  combinedSavingsData.sort((a, b) => d3.ascending(a.date, b.date));
  const cumulativeSavingsData = combinedSavingsData.reduce((acc, d) => {
    acc.push({
      date: d.date,
      value: acc.length === 0 ? d.value : acc[acc.length - 1].value + d.value,
    });
    return acc;
  }, [] as DataPoint[]);

  return {
    expenseData: groupedExpenseData,
    incomeData: groupedIncomeData,
    cumulativeExpenseData,
    cumulativeExpenseEndIndex,
    cumulativeIncomeData,
    cumulativeIncomeEndIndex,
    savingsData: cumulativeSavingsData,
  };
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
  const savingsEndDate =
    historicalData[historicalData.length - 1]?.date ?? new Date();
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
