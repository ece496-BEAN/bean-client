"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentBudget } from "@/contexts/CurrentBudgetContext";

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
      console.log("No current budget found, redirecting to new budget page");
      router.push("/budget/new");
    }
  }, [currentBudgetUUID, router]);
  return <p>Welp</p>;
}
export default CurrentBudgetContent;
