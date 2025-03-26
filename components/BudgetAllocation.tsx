import { ReadOnlyBudget } from "@/lib/types";
import { Box, Card, Stack, Typography, Button } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { Check, Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { AddOrEditBudgetPage } from "./AddOrEditBudgetPage";
import { EditBudgetAllocation } from "./EditBudgetAllocation";

export interface BudgetAllocationProps {
  budget: ReadOnlyBudget;
  editMode: boolean;
  refetch: () => void;
}

export const BudgetAllocation: React.FC<BudgetAllocationProps> = ({
  budget,
  editMode,
  refetch,
}) => {
  const pieChartData = useMemo(() => {
    // if (budget === undefined) return [];
    if (!budget.budget_items.length || !budget.total_allocation) {
      return [];
    }

    return budget.budget_items.map((item, index) => {
      // percentage rounded to one decimal place
      const percentage =
        Math.round((item.allocation / budget.total_allocation) * 1000) / 10;
      return {
        id: index.toString(),
        value: percentage,
        label: item.category.name,
        color: item.category.color,
      };
    });
  }, [budget]);

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5" gutterBottom>
          Budget Allocation
        </Typography>
      </Stack>
      {editMode ? (
        <EditBudgetAllocation budget={budget} refetch={refetch} />
      ) : (
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
      )}
    </Card>
  );
};
