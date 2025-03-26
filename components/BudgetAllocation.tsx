import { ReadOnlyBudget } from "@/lib/types";
import { Card, Stack, Typography } from "@mui/material";
import { PieChart } from "@mui/x-charts/PieChart";
import { useCallback, useMemo } from "react";
import { EditBudgetAllocation } from "./EditBudgetAllocation";

export interface BudgetAllocationProps {
  budget: ReadOnlyBudget;
  editMode: boolean;
  setEditMode: (editMode: boolean) => void;
  refetch: () => void;
  type: "income" | "expense";
}

export const BudgetAllocation: React.FC<BudgetAllocationProps> = ({
  budget,
  editMode,
  setEditMode,
  refetch,
  type,
}) => {
  const pieChartData = useMemo(() => {
    const filteredItems = budget.budget_items.filter(
      (item) => !item.category.is_income_type,
    );

    const totalFilteredAllocation = filteredItems.reduce(
      (total, item) => total + item.allocation,
      0,
    );

    if (!filteredItems.length || !totalFilteredAllocation) {
      return [];
    }

    return filteredItems.map((item, index) => {
      const percentage =
        Math.round((item.allocation / totalFilteredAllocation) * 1000) / 10;
      return {
        id: index.toString(),
        value: percentage,
        label: item.category.name,
        color: item.category.color,
      };
    });
  }, [budget]);

  const pieChartBottomMargin = useCallback((items: number) => {
    if (items < 5) return 50;
    if (items < 8) return 100;
    return 150;
  }, []);

  const pieChartHeight = useCallback((items: number) => {
    if (items < 5) return 300;
    if (items < 8) return 350;
    return 400;
  }, []);

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5" gutterBottom>
          Expense Allocation
        </Typography>
      </Stack>
      {editMode ? (
        <EditBudgetAllocation
          budget={budget}
          refetch={refetch}
          setEditMode={setEditMode}
        />
      ) : (
        <PieChart
          series={[
            {
              data: pieChartData,
              highlightScope: { fade: "global", highlight: "item" },
              faded: { innerRadius: 30, additionalRadius: -30, color: "gray" },
            },
          ]}
          margin={{
            top: 0,
            right: 50,
            bottom: pieChartBottomMargin(pieChartData.length),
            left: 50,
          }}
          height={pieChartHeight(pieChartData.length)}
          slotProps={{
            legend: {
              direction: "row",
              padding: 0,
              position: { vertical: "bottom", horizontal: "middle" },
            },
          }}
        />
      )}
    </Card>
  );
};
