"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useBudgets } from "@/contexts/BudgetContext"; // Import your Budget context
import BudgetOverviewPieChart from "@/components/charts/PieChart";
import {
  Budget,
  Category,
  ReadOnlyBudget,
  ReadOnlyBudgetItem,
} from "@/lib/types";
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Grid2,
  Card,
  CardContent,
  CardHeader,
} from "@mui/material";
import { DollarSign, Pencil } from "lucide-react";
import { AddOrEditBudgetPage } from "@/components/AddOrEditBudgetPage";
import BudgetSelector from "@/components/BudgetSelector"; // Import your budget selector
import { CardTitle } from "@/components/ui/card";
import { DatePicker } from "@mui/x-date-pickers";

function BudgetOverview() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [month, setMonth] = useState<Date | null>(new Date(Date.now()));

  const uuid = params.uuid as string;
  const {
    getSelectedBudget,
    selectedBudget,
    selectedBudgetQueryError,
    refetchSelectedBudget,
    isSelectedBudgetLoading: isLoading,
  } = useBudgets();
  const initialEditMode = searchParams.get("edit") === "true";
  const [editMode, setEditMode] = useState(initialEditMode);

  useEffect(() => {
    getSelectedBudget(uuid);
  }, [uuid, getSelectedBudget]);

  useEffect(() => {
    // Update URL when editMode changes
    const newSearchParams = new URLSearchParams(searchParams);
    if (editMode) {
      newSearchParams.set("edit", "true");
    } else {
      newSearchParams.delete("edit");
    }

    router.push(`${location.pathname}?${newSearchParams}`);
  }, [editMode, router, searchParams]);

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };
  if (selectedBudgetQueryError) {
    return (
      <Box className="flex flex-col h-auto bg-gray-50 p-2">
        <Typography
          variant="h4"
          component="h1"
          sx={{ color: "grey" }}
          gutterBottom
        >
          Budget Not Found
        </Typography>
        <Typography variant="body1" sx={{ color: "grey" }} gutterBottom>
          The budget you are looking for does not exist.
        </Typography>
        <Typography variant="body1" sx={{ color: "grey" }} gutterBottom>
          Consider creating a new budget.
        </Typography>
      </Box>
    );
  }
  if (isLoading || !selectedBudget) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  const totalAllocation = (selectedBudget.budget_items || []).reduce(
    (sum, item) => sum + item.allocation,
    0,
  );

  return (
    <div className="flex-grow p-4 overflow-y-auto">
      <Grid2 container columns={{ xs: 1, md: 2 }} spacing={2}>
        <Grid2 container columns={12} spacing={2} alignItems="center" size={2}>
          {/* <Card variant="outlined" sx={{ p: 2 }}>
            <Grid2
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              columns={{ xs: 1, md: 2 }}
              sx={{ width: "100%" }}
            >
              <Typography variant="h4">Monthly Breakdown (rename?)</Typography>
              <DatePicker
                label="Month"
                views={["month", "year"]}
                value={month}
                onChange={(date) => setMonth(date)}
              />
            </Grid2>
          </Card> */}
          <Grid2 size="grow">
            <BudgetSelector
              value={selectedBudget}
              onChange={(budget: ReadOnlyBudget | null) => {
                if (budget) {
                  router.push(`/budget/${budget.id}`);
                }
              }}
            />
          </Grid2>
          {/* HOPEFULLY DOESN'T NEED TO EXIST FOR MONTHLY...
           <Grid2 size="auto">
            <Button
              variant="outlined"
              onClick={toggleEditMode}
              startIcon={<Pencil />}
            >
              {editMode ? "Exit Edit Mode" : "Edit"}
            </Button>
          </Grid2> */}
        </Grid2>
        <Grid2 size={1}>
          <Card variant="outlined" sx={{ p: 2 }}>
            {/* <CardContent>pie charts</CardContent> */}
            <BudgetOverviewPieChart
              selectedBudget={
                selectedBudget as ReadOnlyBudget & {
                  budget_items: ReadOnlyBudgetItem[];
                }
              }
              totalAllocation={totalAllocation}
            />
          </Card>
        </Grid2>
        <Grid2 size={1}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Grid2
              container
              direction="row"
              justifyContent="space-between" // Align items to edges
              sx={{ width: "100%" }}
              paddingBottom={1}
            >
              <Grid2 size={12} paddingBottom={2}>
                <Stack
                  direction="row"
                  spacing={0.5}
                  justifyContent="space-between"
                >
                  <Typography variant="h5" gutterBottom>
                    Usage
                  </Typography>
                </Stack>
              </Grid2>
            </Grid2>
            {editMode ? (
              <AddOrEditBudgetPage
                editMode={editMode}
                initial_budget={selectedBudget}
                onSubmit={() => {
                  setEditMode(false);
                }}
              />
            ) : (
              <div>
                {(selectedBudget.budget_items as ReadOnlyBudgetItem[]).map(
                  (item) => {
                    const percentage =
                      (item.allocation / totalAllocation) * 100;
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
                                <DollarSign className="w-4 h-4 mr-1 text-gray-700" />
                                <span className="font-medium text-gray-700">{`${item.allocation_used} / ${item.allocation}`}</span>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                      // <Box key={item.id} sx={{ width: "100%", mb: 2 }}>
                      //   <Stack direction="row" spacing={1} alignItems="center">
                      //     <Typography variant="body2" sx={{ color: "grey" }}>
                      //       {item.category.name} ({percentage.toFixed(2)}%)
                      //     </Typography>
                      //     <Chip
                      //       label={
                      //         item.category.is_income_type ? "Income" : "Expense"
                      //       }
                      //       color={
                      //         item.category.is_income_type ? "success" : "error"
                      //       }
                      //       size="small"
                      //       variant="outlined"
                      //     />
                      //     <Chip
                      //       label={item.category.legacy ? "Legacy" : "Active"}
                      //       color={item.category.legacy ? "default" : "primary"}
                      //       size="small"
                      //       variant="outlined"
                      //     />
                      //   </Stack>
                      //   <LinearProgress variant="determinate" value={percentage} />
                      // </Box>
                    );
                  },
                )}
              </div>
            )}
          </Card>
        </Grid2>
      </Grid2>
    </div>
  );
}

export default BudgetOverview;
