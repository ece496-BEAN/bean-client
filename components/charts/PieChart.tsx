import { PieChart } from "@mui/x-charts/PieChart";
import { ReadOnlyBudgetItem } from "@/lib/types"; // Adjust path to your ReadOnlyBudgetItem type
import React, { useMemo } from "react";

interface BudgetOverviewPieChartProps {
  selectedBudget: {
    budget_items: ReadOnlyBudgetItem[];
  };
  totalAllocation: number; // Assuming you have calculated this value
}

const BudgetOverviewPieChart: React.FC<BudgetOverviewPieChartProps> = ({
  selectedBudget,
  totalAllocation,
}) => {
  // Calculate pie chart data using useMemo for optimization
  const pieChartData = useMemo(() => {
    if (!selectedBudget?.budget_items || totalAllocation === 0) {
      return []; // Return empty data if no budget items or total allocation is zero
    }

    return selectedBudget.budget_items.map((item, index) => {
      const percentage = (item.allocation / totalAllocation) * 100;
      return {
        id: index.toString(), // Unique ID for each slice, using index as string
        value: percentage,
        label: item.category.name, // Or item.name if budget item has a name
        color: item.category.color,
      };
    });
  }, [selectedBudget, totalAllocation]);

  // Optional value formatter to display percentage with % symbol
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
