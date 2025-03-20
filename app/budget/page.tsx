import React from "react";
import AllBudgetsPage from "@/components/AllBudgetsPage";
import { BudgetAndCategoryPage } from "@/components/BudgetManagement";
import BudgetProvider from "@/contexts/BudgetContext";
import CategoryProvider from "@/contexts/CategoriesContext";
import CurrentBudgetProvider from "@/contexts/CurrentBudgetContext";

export default function Page() {
  return (
    <BudgetProvider>
      <CurrentBudgetProvider>
        <BudgetAndCategoryPage>
          <CategoryProvider>
            <AllBudgetsPage />
          </CategoryProvider>
        </BudgetAndCategoryPage>
      </CurrentBudgetProvider>
    </BudgetProvider>
  );
}
