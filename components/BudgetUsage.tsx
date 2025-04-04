import { ReadOnlyBudget } from "@/lib/types";
import { Card, Stack, Typography, Button, Grid2 } from "@mui/material";
import { Check, DollarSign, Pencil } from "lucide-react";

export interface BudgetUsageProps {
  budget: ReadOnlyBudget;
}

export const BudgetUsage: React.FC<BudgetUsageProps> = ({ budget }) => {
  const expenseItems = budget.budget_items.filter(
    (item) => !item.category.is_income_type,
  );

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="h5" gutterBottom>
          Budget Usage
        </Typography>
      </Stack>
      <div>
        <Typography variant="h6" gutterBottom>
          Expenses
        </Typography>
        {expenseItems.map((item) => {
          const usageColour =
            item.allocation_used > item.allocation
              ? "text-red-500"
              : "text-gray-700";
          return (
            <ul key={item.id} className="space-y-3 my-3">
              <li className="relative overflow-hidden p-2">
                <div
                  className="absolute inset-0 rounded-lg opacity-20"
                  style={{
                    width: `${(item.allocation_used / item.allocation) * 100}%`,
                    backgroundColor: item.category.color,
                  }}
                ></div>
                <div
                  className="absolute inset-0 rounded-lg w-full border-solid border-2"
                  style={{
                    borderColor: item.category.color,
                  }}
                ></div>
                <div className="flex items-center justify-between p-2 rounded-lg relative z-10 text-lg">
                  <div className="flex items-center flex-grow mr-2">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: item.category.color }}
                    ></div>
                    <span className="font-medium text-gray-700">
                      {item.category.name}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      <DollarSign className={`w-4 h-4 mr-1 ${usageColour}`} />
                      <span
                        className={`font-medium ${usageColour}`}
                      >{`${item.allocation_used} / ${item.allocation}`}</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          );
        })}
      </div>
    </Card>
  );
};
