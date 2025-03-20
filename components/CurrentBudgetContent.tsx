"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";
import { Button } from "@mui/material";
import Link from "next/link";

function CurrentBudgetContent() {
  const { currentBudgetUUID } = useCurrentBudget();
  const router = useRouter();
  useEffect(() => {
    if (currentBudgetUUID) {
      // Redirect to the specific budget page if UUID is available
      console.log(
        `Found current budget, redirecting to /budget/${currentBudgetUUID}`,
      );
      router.push(`/budget/${currentBudgetUUID}`);
    } else {
      console.log("No current budget found");
    }
  }, [currentBudgetUUID, router]);
  return (
    <div>
      <h1>Current Budget Content</h1>
      <Button>
        <Link href="/budget/new">Create New Budget</Link>
      </Button>
    </div>
  );
}
export default CurrentBudgetContent;
