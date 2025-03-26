import React from "react";
import AllBudgetsPage from "@/components/AllBudgetsPage";
import { BudgetAndCategoryPage } from "@/components/BudgetManagement";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";
import CurrentBudgetProvider from "@/contexts/CurrentBudgetContext";
import BudgetOverview from "@/components/BudgetOverview";

export default function Page() {
  return (
    <BudgetProvider>
      <CategoryProvider>
        <BudgetOverview />
      </CategoryProvider>
    </BudgetProvider>
  );
}
