"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useBudgets } from "@/contexts/BudgetContext"; // Import your Budget context
import { Budget, Category, ReadOnlyBudgetItem } from "@/lib/types";
import {
  Box,
  Typography,
  LinearProgress,
  Stack,
  Button,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Pencil } from "lucide-react";
import { AddOrEditBudgetPage } from "@/components/AddOrEditBudgetPage";
import BudgetSelector from "@/components/BudgetSelector"; // Import your budget selector

function BudgetOverview() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

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
    <Box className="flex flex-col h-auto bg-gray-50 p-2">
      <div className="flex justify-between mb-4">
        {" "}
        {/* Header */}
        <Typography
          variant="h4"
          component="h1"
          sx={{ color: "grey" }}
          gutterBottom
        >
          Budget Overview
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {" "}
          {/* Right-aligned controls */}
          <BudgetSelector
            value={selectedBudget}
            onChange={(budget: Budget | null) => {
              if (budget) {
                router.push(`/budget/${budget.id}`);
              }
            }}
          />
          <Button
            variant="outlined"
            onClick={toggleEditMode}
            startIcon={<Pencil />}
          >
            {editMode ? "Exit Edit Mode" : "Edit"}
          </Button>
        </Stack>
      </div>
      {editMode ? (
        <AddOrEditBudgetPage
          editMode={editMode}
          initial_budget={selectedBudget}
        />
      ) : (
        <div>
          {(selectedBudget.budget_items as ReadOnlyBudgetItem[]).map((item) => {
            const percentage = (item.allocation / totalAllocation) * 100;
            return (
              <Box key={item.id} sx={{ width: "100%", mb: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" sx={{ color: "grey" }}>
                    {item.category.name} ({percentage.toFixed(2)}%)
                  </Typography>

                  <Chip
                    label={item.category.is_income_type ? "Income" : "Expense"}
                    color={item.category.is_income_type ? "success" : "error"}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
                    label={item.category.legacy ? "Legacy" : "Active"}
                    color={item.category.legacy ? "default" : "primary"}
                    size="small"
                    variant="outlined"
                  />
                </Stack>

                <LinearProgress variant="determinate" value={percentage} />
              </Box>
            );
          })}
        </div>
      )}
    </Box>
  );
}

export default BudgetOverview;
