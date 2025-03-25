import { PieChart } from "@mui/x-charts/PieChart";
import { ReadOnlyBudgetItem } from "@/lib/types";
import React, { useMemo } from "react";

interface BudgetOverviewPieChartProps {
  selectedBudget: {
    budget_items: ReadOnlyBudgetItem[];
  };
  totalAllocation: number;
}

const BudgetOverviewPieChart: React.FC<BudgetOverviewPieChartProps> = ({
  selectedBudget,
  totalAllocation,
}) => {
  const pieChartData = useMemo(() => {
    if (!selectedBudget?.budget_items || totalAllocation === 0) {
      return [];
    }

    return selectedBudget.budget_items.map((item, index) => {
      const percentage = (item.allocation / totalAllocation) * 100;
      return {
        id: index.toString(),
        value: percentage,
        label: item.category.name,
        color: item.category.color,
      };
    });
  }, [selectedBudget, totalAllocation]);

  const valueFormatter = (value: number) => `${value.toFixed(1)}%`;

  return (
    <PieChart
      series={[
        {
          data: pieChartData,
          highlightScope: { fade: "global", highlight: "item" },
          faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
        },
      ]}
      height={200}
    />
  );
};

export default BudgetOverviewPieChart;
