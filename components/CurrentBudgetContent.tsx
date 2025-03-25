"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";
import { Box, Button, Typography } from "@mui/material";
import Link from "next/link";
import { Budget, ReadOnlyBudget } from "@/lib/types";
import BudgetSelector from "@/components/BudgetSelector";

function CurrentBudgetContent() {
  const { currentBudgetUUID } = useCurrentBudget();
  const router = useRouter();
  useEffect(() => {
    if (currentBudgetUUID) {
      router.push(`/budget/${currentBudgetUUID}`);
    }
  }, [currentBudgetUUID, router]);
  return (
    <Box className="flex flex-col h-auto bg-gray-50 p-2">
      <Typography
        variant="h4"
        component="h1"
        sx={{ color: "grey" }}
        gutterBottom
      >
        Current Budget Content
      </Typography>
      <BudgetSelector
        onChange={(budget: ReadOnlyBudget | null) => {
          if (budget) {
            router.push(`/budget/${budget.id}`);
          }
        }}
      />
      <Button>
        <Link href="/budget/new">Create New Budget</Link>
      </Button>
    </Box>
  );
}
export default CurrentBudgetContent;
