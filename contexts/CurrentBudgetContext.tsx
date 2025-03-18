"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { useBudgets } from "@/contexts/BudgetContext";
import { endOfMonth, format, startOfMonth } from "date-fns";

interface CurrentBudgetContextType {
  currentBudgetUUID: string | null;
  setCurrentBudgetUUID: (uuid: string | null) => void;
  fetchCurrentBudget: (router: any) => void;
}

const CurrentBudgetContext = createContext<CurrentBudgetContextType | null>(
  null,
);

export default function CurrentBudgetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentBudgetUUID, setCurrentBudgetUUID] = useState<string | null>(
    null,
  );
  const { getBudgets, paginatedBudgets } = useBudgets();

  const fetchCurrentBudget = useCallback(
    async (router: any) => {
      try {
        const start = startOfMonth(new Date());
        const end = endOfMonth(new Date());

        const formattedStart = format(start, "yyyy-MM-dd");
        const formattedEnd = format(end, "yyyy-MM-dd");

        getBudgets({
          start_date_after: formattedStart,
          start_date_before: formattedEnd,
        });
        const { results: budgets } = paginatedBudgets;
        if (budgets.length === 0) {
          router.push("/budget/new");
          return;
        }
        const currentBudget = budgets[0];
        setCurrentBudgetUUID(currentBudget.id);
      } catch (err) {
        console.error("Error fetching current budget:", err);
      }
    },
    [getBudgets, paginatedBudgets],
  );

  const contextValue: CurrentBudgetContextType = {
    currentBudgetUUID,
    setCurrentBudgetUUID,
    fetchCurrentBudget,
  };

  return (
    <CurrentBudgetContext.Provider value={contextValue}>
      {children}
    </CurrentBudgetContext.Provider>
  );
}

export const useCurrentBudget = () => {
  const context = useContext(CurrentBudgetContext);
  if (!context) {
    throw new Error(
      "useCurrentBudget must be used within a CurrentBudgetProvider",
    );
  }

  return context;
};
